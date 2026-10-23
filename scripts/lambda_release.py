"""Release the Terraform-managed Lambdas without changing their ingress targets."""

import argparse
import base64
import hashlib
import json
import re
import subprocess
import sys
import tempfile
import uuid
from collections.abc import Iterator
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
REGION = "ap-northeast-1"
LOCK_BUCKET = "shared-46ki75-internal-s3-bucket-terraform-tfstate"
COMPONENTS = {
    "http-api": ("http-api", "//crates:http-api"),
    "logs-reporter": ("reporter", "//crates:logs-reporter"),
    "nitro-api": ("nitro-api", "//packages/http-api"),
}


class ReleaseError(Exception):
    pass


class AwsError(ReleaseError):
    def __init__(self, message: str):
        super().__init__(message)
        match = re.search(r"An error occurred \(([^)]+)\)", message)
        self.code = match.group(1) if match else ""


def numbered_version(value: Any) -> str:
    if not isinstance(value, str) or not re.fullmatch(r"[1-9][0-9]*", value):
        raise ReleaseError(f"Expected a fixed published version number, got {value!r}.")
    return value


class Release:
    def __init__(self, component: str, stage: str, *, root: Path = ROOT):
        if component not in COMPONENTS:
            raise ReleaseError(f"Unknown Lambda component: {component}")
        if stage not in ("dev", "stg", "prod"):
            raise ReleaseError(f"Invalid stage: {stage}")
        suffix, self.task = COMPONENTS[component]
        self.component = component
        self.stage = stage
        self.root = root
        self.function = f"{stage}-46ki75-internal-lambda-function-{suffix}"

    def aws(self, service: str, operation: str, *args: str) -> dict[str, Any]:
        command = [
            "aws",
            service,
            operation,
            *args,
            "--region",
            REGION,
            "--output",
            "json",
            "--no-cli-pager",
            "--no-cli-auto-prompt",
        ]
        try:
            result = subprocess.run(
                command, check=True, capture_output=True, text=True, cwd=self.root
            )
        except subprocess.CalledProcessError as error:
            raise AwsError(error.stderr or str(error)) from error
        return json.loads(result.stdout) if result.stdout.strip() else {}

    def lambda_call(self, operation: str, *args: str) -> dict[str, Any]:
        if operation == "wait":
            return self.aws(
                "lambda", "wait", args[0], "--function-name", self.function, *args[1:]
            )
        return self.aws("lambda", operation, "--function-name", self.function, *args)

    @contextmanager
    def lock(self, operation: str) -> Iterator[None]:
        account = self.aws("sts", "get-caller-identity")["Account"]
        key = f"lambda-release-locks/{account}/{REGION}/{self.function}.lock"
        location = f"s3://{LOCK_BUCKET}/{key}"
        with tempfile.TemporaryDirectory(prefix="lambda-release-") as directory:
            body = Path(directory) / "lock.json"
            body.write_text(
                json.dumps(
                    {
                        "operation": operation,
                        "function": self.function,
                        "started_at": datetime.now(timezone.utc).isoformat(),
                        "owner": str(uuid.uuid4()),
                    }
                )
            )
            try:
                response = self.aws(
                    "s3api",
                    "put-object",
                    "--bucket",
                    LOCK_BUCKET,
                    "--key",
                    key,
                    "--body",
                    str(body),
                    "--content-type",
                    "application/json",
                    "--if-none-match",
                    "*",
                )
            except AwsError as error:
                raise ReleaseError(
                    f"Could not acquire release lock at {location}: {error}\n"
                    "If another release owns it, wait for that release to finish. "
                    "For an interrupted release, inspect the lock and remove it only "
                    "after confirming its owner has stopped."
                ) from error
            etag = response["ETag"]

        def unlock():
            # Conditional deletion cannot remove a replacement owner's lock.
            self.aws(
                "s3api",
                "delete-object",
                "--bucket",
                LOCK_BUCKET,
                "--key",
                key,
                "--if-match",
                etag,
            )

        try:
            yield
        except BaseException:
            try:
                unlock()
            except ReleaseError as error:
                print(f"Could not release lock at {location}: {error}", file=sys.stderr)
            raise
        else:
            try:
                unlock()
            except ReleaseError as error:
                raise ReleaseError(
                    f"Release action completed, but lock cleanup failed at {location}: "
                    f"{error}"
                ) from error

    def alias(self, name: str) -> dict[str, Any] | None:
        try:
            alias = self.lambda_call("get-alias", "--name", name)
        except AwsError as error:
            if error.code == "ResourceNotFoundException":
                return None
            raise
        numbered_version(alias["FunctionVersion"])
        if alias.get("RoutingConfig", {}).get("AdditionalVersionWeights"):
            raise ReleaseError(
                f"Weighted {name} aliases are not supported by this workflow."
            )
        return alias

    def write_alias(
        self, name: str, version: str, existing: dict[str, Any] | None
    ) -> None:
        args = ["--name", name, "--function-version", numbered_version(version)]
        if existing is not None:
            args += [
                "--revision-id",
                existing["RevisionId"],
                "--routing-config",
                '{"AdditionalVersionWeights":{}}',
            ]
        response = self.lambda_call(
            "create-alias" if existing is None else "update-alias", *args
        )
        if response["FunctionVersion"] != version:
            raise ReleaseError(f"Unexpected {name} version returned by Lambda.")

    def wait_for_version(self, version: str) -> None:
        self.lambda_call("wait", "function-active-v2", "--qualifier", version)

    def push(self) -> dict[str, Any]:
        green = self.alias("green")
        if green is None:
            raise ReleaseError(
                "Missing green alias. Provision/migrate Terraform and route live "
                "invocations through green before pushing code."
            )
        if self.component == "nitro-api":
            subprocess.run(
                ["bash", "packages/http-api/scripts/package.sh"],
                cwd=self.root,
                check=True,
            )
            artifact = self.root / "packages/http-api/.output/lambda.zip"
        else:
            subprocess.run(
                ["mise", "run", "--silent", f"{self.task}:build"],
                cwd=self.root,
                check=True,
            )
            artifact = self.root / f"target/lambda/{self.component}/bootstrap.zip"
        checksum = base64.b64encode(
            hashlib.sha256(artifact.read_bytes()).digest()
        ).decode()
        code = ["--zip-file", f"fileb://{artifact}"]
        if self.component == "nitro-api":
            result = subprocess.run(
                [
                    "bash",
                    "packages/http-api/scripts/upload.sh",
                    self.stage,
                    str(artifact),
                ],
                cwd=self.root,
                check=True,
                capture_output=True,
                text=True,
            )
            upload = json.loads(result.stdout)
            if (
                upload.get("VersionId") in (None, "", "null")
                or upload.get("ChecksumSHA256") != checksum
            ):
                raise ReleaseError(
                    "Upload did not return an immutable, checksummed artifact."
                )
            code = [
                "--s3-bucket",
                f"{self.stage}-46ki75-internal-s3-bucket-nitro-api-artifacts",
                "--s3-key",
                "nitro-api/lambda.zip",
                "--s3-object-version",
                upload["VersionId"],
            ]
        self.lambda_call("wait", "function-updated-v2")
        configuration = self.lambda_call("get-function-configuration")
        # Publish with the code update: its in-progress RevisionId changes again
        # on completion and cannot safely guard a separate PublishVersion call.
        updated = self.lambda_call(
            "update-function-code",
            *code,
            "--revision-id",
            configuration["RevisionId"],
            "--architectures",
            "arm64",
            "--publish",
        )
        if updated["CodeSha256"] != checksum:
            raise ReleaseError("Updated Lambda code does not match the local artifact.")
        version = numbered_version(updated["Version"])
        self.lambda_call("wait", "function-updated-v2")
        self.wait_for_version(version)
        return {
            "function": self.function,
            "version": version,
            "green": green["FunctionVersion"],
        }

    def promote(self) -> dict[str, Any]:
        # The CLI paginates JSON output; resolve once so a concurrent publish cannot
        # change the selected version halfway through promotion.
        response = self.lambda_call("list-versions-by-function")
        versions = [
            item["Version"]
            for item in response["Versions"]
            if re.fullmatch(r"[1-9][0-9]*", item["Version"])
        ]
        if not versions:
            raise ReleaseError("No published Lambda version exists. Run push first.")
        version = max(versions, key=int)
        green = self.alias("green")
        if green is not None and green["FunctionVersion"] == version:
            return {
                "function": self.function,
                "version": version,
                "status": "already-promoted",
            }
        blue = self.alias("blue")
        if green is None and blue is not None:
            raise ReleaseError(
                "green is absent but blue exists; inspect aliases before promoting."
            )
        self.wait_for_version(version)
        if green is not None:
            self.write_alias("blue", green["FunctionVersion"], blue)
        self.write_alias("green", version, green)
        return {"function": self.function, "version": version, "status": "promoted"}

    def rollback(self) -> dict[str, Any]:
        green = self.alias("green")
        blue = self.alias("blue")
        if blue is None:
            raise ReleaseError("No rollback target available: blue alias is absent.")
        if green is None:
            raise ReleaseError(
                "green alias is absent; inspect aliases before rolling back."
            )
        version = blue["FunctionVersion"]
        if green["FunctionVersion"] != version:
            self.wait_for_version(version)
            self.write_alias("green", version, green)
        # If cleanup previously failed, green == blue and a retry only removes blue.
        current = self.alias("blue")
        if current is not None:
            if current["RevisionId"] != blue["RevisionId"]:
                raise ReleaseError(
                    "blue changed during rollback; refusing to remove it."
                )
            self.lambda_call("delete-alias", "--name", "blue")
        return {"function": self.function, "version": version, "status": "rolled-back"}

    def execute(self, operation: str) -> dict[str, Any]:
        if operation == "deploy":
            raise ReleaseError(
                "deploy is deferred. To deploy, run "
                f"`mise run --silent {self.task}:push {self.stage}`, then "
                f"`mise run --silent {self.task}:promote {self.stage}`."
            )
        if operation not in ("push", "promote", "rollback"):
            raise ReleaseError(f"Unknown operation: {operation}")
        with self.lock(operation):
            return getattr(self, operation)()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("operation", choices=("push", "promote", "rollback", "deploy"))
    parser.add_argument("component", choices=tuple(COMPONENTS))
    parser.add_argument("stage", choices=("dev", "stg", "prod"))
    args = parser.parse_args()
    try:
        result = Release(args.component, args.stage).execute(args.operation)
    except (ReleaseError, OSError, subprocess.CalledProcessError, ValueError) as error:
        print(f"Error: {error}", file=sys.stderr)
        return 1
    print(json.dumps(result))
    return 0


if __name__ == "__main__":
    sys.exit(main())
