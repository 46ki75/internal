import base64
import hashlib
import json
import re
import subprocess
import tempfile
import tomllib
import unittest
from pathlib import Path
from unittest.mock import patch

import lambda_release as release


class FakeCommands:
    def __init__(self, root: Path):
        self.root = root
        self.calls: list[list[str]] = []
        self.aliases = {"green": self.alias("41"), "blue": self.alias("40")}
        self.versions = ["$LATEST", "9", "42", "41", "40"]
        self.failures: dict[tuple[str, str, str], str] = {}
        self.locked = False
        self.hash = base64.b64encode(hashlib.sha256(b"artifact").digest()).decode()
        self.upload_version = "immutable-s3-version"
        self.code_updated = False
        self.update_completed = False

    @staticmethod
    def alias(version: str):
        return {
            "FunctionVersion": version,
            "RevisionId": f"revision-{version}",
            "RoutingConfig": {"AdditionalVersionWeights": {}},
        }

    @staticmethod
    def option(args: list[str], name: str):
        return args[args.index(name) + 1] if name in args else ""

    def run(self, args: list[str], **kwargs):
        self.calls.append(args)
        if args[0] != "aws":
            if args[0] == "mise" or args[-1].endswith("package.sh"):
                for component in ("http-api", "logs-reporter"):
                    artifact = self.root / f"target/lambda/{component}/bootstrap.zip"
                    artifact.parent.mkdir(parents=True, exist_ok=True)
                    artifact.write_bytes(b"artifact")
                artifact = self.root / "packages/http-api/.output/lambda.zip"
                artifact.parent.mkdir(parents=True, exist_ok=True)
                artifact.write_bytes(b"artifact")
                response = {}
            else:
                response = {
                    "VersionId": self.upload_version,
                    "ChecksumSHA256": self.hash,
                }
            return subprocess.CompletedProcess(args, 0, json.dumps(response), "")
        service, operation = args[1:3]
        name = self.option(args, "--name")
        failure = self.failures.get((service, operation, name))
        if failure:
            self.error(args, failure)
        response = {}
        if service == "sts":
            response = {"Account": "123456789012"}
        elif service == "s3api":
            if operation == "put-object":
                if self.locked:
                    self.error(args, "PreconditionFailed")
                self.locked = True
                response = {"ETag": '"lock-etag"'}
            else:
                self.locked = False
        elif operation == "get-alias":
            if name not in self.aliases:
                self.error(args, "ResourceNotFoundException")
            response = self.aliases[name]
        elif operation in ("update-alias", "create-alias"):
            if operation == "update-alias":
                assert (
                    self.option(args, "--revision-id")
                    == self.aliases[name]["RevisionId"]
                )
            response = self.alias(self.option(args, "--function-version"))
            self.aliases[name] = response
        elif operation == "delete-alias":
            del self.aliases[name]
        elif operation == "list-versions-by-function":
            response = {"Versions": [{"Version": v} for v in self.versions]}
        elif operation == "get-function-configuration":
            response = {
                "RevisionId": "completed-revision"
                if self.update_completed
                else "function-revision"
            }
        elif operation == "update-function-code":
            assert self.option(args, "--revision-id") == "function-revision"
            self.code_updated = True
            response = {"RevisionId": "updated-revision", "CodeSha256": self.hash}
            if "--publish" in args:
                response["Version"] = "43"
        elif operation == "publish-version":
            assert self.option(args, "--revision-id") == "completed-revision"
            assert self.option(args, "--code-sha256") == self.hash
            response = {"Version": "43"}
        elif operation == "wait":
            assert args[3] in ("function-active-v2", "function-updated-v2")
            if self.code_updated and args[3] == "function-updated-v2":
                self.update_completed = True
        else:
            raise AssertionError(args)
        return subprocess.CompletedProcess(args, 0, json.dumps(response), "")

    @staticmethod
    def error(args: list[str], code: str):
        raise subprocess.CalledProcessError(
            254,
            args,
            stderr=f"An error occurred ({code}) when calling the operation: fixture",
        )

    def mutations(self):
        return [
            args
            for args in self.calls
            if args[0] == "aws"
            and args[1] == "lambda"
            and args[2]
            in (
                "update-alias",
                "create-alias",
                "delete-alias",
                "update-function-code",
                "publish-version",
            )
        ]


class ReleaseTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        root = Path(self.directory.name)
        self.fake = FakeCommands(root)
        self.patcher = patch.object(release.subprocess, "run", self.fake.run)
        self.patcher.start()
        self.addCleanup(self.patcher.stop)
        self.controller = release.Release("http-api", "dev", root=root)

    def execute(self, operation: str):
        return self.controller.execute(operation)

    def test_push_publishes_code_without_mutating_aliases(self):
        before = self.fake.aliases.copy()
        result = self.execute("push")
        self.assertEqual(result["version"], "43")
        self.assertEqual(self.fake.aliases, before)
        self.assertEqual(
            [args[2] for args in self.fake.mutations()], ["update-function-code"]
        )
        update = self.fake.mutations()[0]
        self.assertIn("--publish", update)
        self.assertEqual(self.fake.option(update, "--architectures"), "arm64")
        self.assertIn("fileb://", " ".join(update))
        self.assertTrue(self.fake.update_completed)
        self.assertFalse(self.fake.locked)

    def test_reporter_push_reuses_its_build_task_and_correct_function_name(self):
        self.controller = release.Release("logs-reporter", "stg", root=self.fake.root)
        result = self.execute("push")
        self.assertEqual(
            result["function"], "stg-46ki75-internal-lambda-function-reporter"
        )
        self.assertIn(
            ["mise", "run", "--silent", "//crates:logs-reporter:build"],
            self.fake.calls,
        )
        self.assertEqual(self.fake.aliases["green"]["FunctionVersion"], "41")

    def test_push_requires_green_to_prevent_a_latest_based_migration(self):
        del self.fake.aliases["green"]
        with self.assertRaisesRegex(release.ReleaseError, "green"):
            self.execute("push")
        self.assertEqual(self.fake.mutations(), [])

    def test_nitro_push_uses_the_exact_checksummed_s3_version(self):
        self.controller = release.Release("nitro-api", "prod", root=self.fake.root)
        self.execute("push")
        args = self.fake.mutations()[0]
        self.assertEqual(
            self.fake.option(args, "--s3-bucket"),
            "prod-46ki75-internal-s3-bucket-nitro-api-artifacts",
        )
        self.assertEqual(
            self.fake.option(args, "--s3-object-version"), "immutable-s3-version"
        )
        self.assertEqual(self.fake.aliases["green"]["FunctionVersion"], "41")

    def test_push_does_not_publish_after_a_failed_code_update(self):
        self.fake.failures[("lambda", "update-function-code", "")] = (
            "PreconditionFailedException"
        )
        with self.assertRaises(release.ReleaseError):
            self.execute("push")
        self.assertNotIn("publish-version", [c[2] for c in self.fake.mutations()])
        self.assertFalse(self.fake.locked)

    def test_invalid_upload_metadata_prevents_code_update(self):
        self.controller = release.Release("nitro-api", "dev", root=self.fake.root)
        self.fake.upload_version = "null"
        with self.assertRaises(release.ReleaseError):
            self.execute("push")
        self.assertEqual(self.fake.mutations(), [])

    def test_promote_pins_highest_numeric_published_version_in_order(self):
        result = self.execute("promote")
        self.assertEqual(result["version"], "42")
        changes = self.fake.mutations()
        self.assertEqual(
            [self.fake.option(c, "--name") for c in changes], ["blue", "green"]
        )
        self.assertEqual(self.fake.aliases["blue"]["FunctionVersion"], "41")
        self.assertEqual(self.fake.aliases["green"]["FunctionVersion"], "42")
        listing = next(c for c in self.fake.calls if "list-versions-by-function" in c)
        self.assertNotIn("--no-paginate", listing)
        self.assertNotIn("$LATEST", " ".join(changes[-1]))

    def test_first_promotion_creates_green_without_blue(self):
        self.fake.aliases.clear()
        self.execute("promote")
        self.assertEqual(set(self.fake.aliases), {"green"})
        self.assertEqual(self.fake.mutations()[0][2], "create-alias")

    def test_promotion_creates_a_missing_blue(self):
        del self.fake.aliases["blue"]
        self.execute("promote")
        self.assertEqual(self.fake.mutations()[0][2], "create-alias")
        self.assertEqual(self.fake.aliases["blue"]["FunctionVersion"], "41")

    def test_repeated_promotion_preserves_the_rollback_candidate(self):
        self.execute("promote")
        self.fake.calls.clear()
        self.execute("promote")
        self.assertEqual(self.fake.mutations(), [])
        self.assertEqual(self.fake.aliases["blue"]["FunctionVersion"], "41")

    def test_promotion_stops_when_preserving_blue_fails(self):
        self.fake.failures[("lambda", "update-alias", "blue")] = "AccessDeniedException"
        with self.assertRaises(release.ReleaseError):
            self.execute("promote")
        self.assertEqual(self.fake.aliases["green"]["FunctionVersion"], "41")

    def test_retry_after_failed_green_update_preserves_the_original_version(self):
        self.fake.failures[("lambda", "update-alias", "green")] = (
            "PreconditionFailedException"
        )
        with self.assertRaises(release.ReleaseError):
            self.execute("promote")
        self.assertEqual(self.fake.aliases["blue"]["FunctionVersion"], "41")
        self.fake.failures.clear()
        self.execute("promote")
        self.assertEqual(self.fake.aliases["blue"]["FunctionVersion"], "41")
        self.assertEqual(self.fake.aliases["green"]["FunctionVersion"], "42")

    def test_unready_candidate_does_not_change_aliases(self):
        self.fake.failures[("lambda", "wait", "")] = "ResourceNotFoundException"
        with self.assertRaises(release.ReleaseError):
            self.execute("promote")
        self.assertEqual(self.fake.mutations(), [])

    def test_unready_rollback_target_does_not_change_aliases(self):
        self.fake.failures[("lambda", "wait", "")] = "ResourceNotFoundException"
        with self.assertRaises(release.ReleaseError):
            self.execute("rollback")
        self.assertEqual(self.fake.mutations(), [])

    def test_missing_blue_does_not_prevent_push(self):
        del self.fake.aliases["blue"]
        self.execute("push")
        self.assertNotIn("blue", self.fake.aliases)

    def test_every_aws_call_uses_the_infrastructure_region(self):
        self.execute("promote")
        for command in self.fake.calls:
            if command[0] == "aws":
                self.assertEqual(
                    self.fake.option(command, "--region"), "ap-northeast-1"
                )

    def test_no_published_version_fails_without_alias_mutations(self):
        self.fake.versions = ["$LATEST"]
        with self.assertRaisesRegex(release.ReleaseError, "published"):
            self.execute("promote")
        self.assertEqual(self.fake.mutations(), [])

    def test_alias_read_errors_are_not_treated_as_absence(self):
        self.fake.failures[("lambda", "get-alias", "blue")] = "AccessDeniedException"
        with self.assertRaises(release.ReleaseError):
            self.execute("promote")
        self.assertEqual(self.fake.mutations(), [])

    def test_rollback_restores_green_then_removes_blue(self):
        self.execute("rollback")
        self.assertEqual(self.fake.aliases["green"]["FunctionVersion"], "40")
        self.assertNotIn("blue", self.fake.aliases)
        self.assertEqual(
            [c[2] for c in self.fake.mutations()], ["update-alias", "delete-alias"]
        )

    def test_missing_blue_fails_clearly_without_changing_green(self):
        del self.fake.aliases["blue"]
        with self.assertRaisesRegex(release.ReleaseError, "No rollback target"):
            self.execute("rollback")
        self.assertEqual(self.fake.mutations(), [])

    def test_failed_rollback_preserves_blue(self):
        self.fake.failures[("lambda", "update-alias", "green")] = (
            "AccessDeniedException"
        )
        with self.assertRaises(release.ReleaseError):
            self.execute("rollback")
        self.assertEqual(self.fake.aliases["blue"]["FunctionVersion"], "40")
        self.assertEqual(self.fake.aliases["green"]["FunctionVersion"], "41")

    def test_retry_after_failed_blue_cleanup_only_cleans_up(self):
        self.fake.failures[("lambda", "delete-alias", "blue")] = "AccessDeniedException"
        with self.assertRaises(release.ReleaseError):
            self.execute("rollback")
        self.fake.failures.clear()
        self.fake.calls.clear()
        self.execute("rollback")
        self.assertEqual([c[2] for c in self.fake.mutations()], ["delete-alias"])
        self.assertNotIn("blue", self.fake.aliases)

    def test_latest_and_weighted_aliases_are_rejected(self):
        for alias in (
            self.fake.alias("$LATEST"),
            {
                **self.fake.alias("41"),
                "RoutingConfig": {"AdditionalVersionWeights": {"40": 0.1}},
            },
        ):
            with self.subTest(alias=alias):
                self.fake.aliases["green"] = alias
                with self.assertRaises(release.ReleaseError):
                    self.execute("promote")
                self.assertEqual(self.fake.mutations(), [])

    def test_existing_lock_blocks_mutations_and_is_not_deleted(self):
        self.fake.locked = True
        with self.assertRaisesRegex(release.ReleaseError, "lock"):
            self.execute("promote")
        self.assertTrue(self.fake.locked)
        self.assertEqual(self.fake.mutations(), [])
        self.assertFalse(any("delete-object" in c for c in self.fake.calls))

    def test_lock_is_account_region_function_scoped_and_conditionally_deleted(self):
        self.execute("promote")
        acquire = next(c for c in self.fake.calls if "put-object" in c)
        self.assertEqual(self.fake.option(acquire, "--if-none-match"), "*")
        self.assertEqual(
            self.fake.option(acquire, "--key"),
            "lambda-release-locks/123456789012/ap-northeast-1/"
            "dev-46ki75-internal-lambda-function-http-api.lock",
        )
        unlock = next(c for c in self.fake.calls if "delete-object" in c)
        self.assertEqual(self.fake.option(unlock, "--if-match"), '"lock-etag"')

    def test_deploy_fails_with_component_specific_hints_before_any_command(self):
        with self.assertRaisesRegex(release.ReleaseError, "push.*promote"):
            self.execute("deploy")
        self.assertEqual(self.fake.calls, [])

    def test_invalid_stage_is_rejected_before_any_command(self):
        with self.assertRaises(release.ReleaseError):
            release.Release("http-api", "qa", root=self.fake.root)
        self.assertEqual(self.fake.calls, [])


class InfrastructureContractTests(unittest.TestCase):
    def test_terraform_bootstraps_green_but_does_not_own_release_targets(self):
        sources = "\n".join(
            path.read_text() for path in (release.ROOT / "terraform").glob("*.tf")
        )
        aliases = re.findall(
            r'resource "aws_lambda_alias" "([^"]+)" \{(.*?)\n\}', sources, re.S
        )
        self.assertEqual(
            {name for name, _ in aliases}, {"http_api", "reporter", "nitro_api"}
        )
        for name, body in aliases:
            with self.subTest(alias=name):
                self.assertRegex(body, r'name\s*=\s*"green"')
                self.assertRegex(body, r"ignore_changes\s*=\s*\[function_version\]")
                self.assertRegex(body, r"create_before_destroy\s*=\s*true")
                self.assertNotIn("$LATEST", body)
                self.assertIn("var.lambda_green_bootstrap_versions", body)

    def test_all_reporter_subscriptions_use_the_live_alias(self):
        for relative in ("terraform/cloudwatch-logs.tf", "terraform/nitro-api.tf"):
            source = (release.ROOT / relative).read_text()
            subscriptions = re.findall(
                r'resource "aws_cloudwatch_log_subscription_filter" "[^"]+" '
                r"\{(.*?)\n\}",
                source,
                re.S,
            )
            self.assertTrue(subscriptions)
            for body in subscriptions:
                with self.subTest(file=relative, subscription=body):
                    self.assertRegex(
                        body, r"destination_arn\s*=\s*aws_lambda_alias\.reporter\.arn"
                    )
                    self.assertIn("aws_lambda_permission.", body)


class TaskContractTests(unittest.TestCase):
    def test_all_release_tasks_keep_errors_visible_and_do_not_build_deploy(self):
        for relative, prefix in (
            ("crates/mise.toml", "http-api:"),
            ("crates/mise.toml", "logs-reporter:"),
            ("packages/http-api/mise.toml", ""),
        ):
            configuration = tomllib.loads((release.ROOT / relative).read_text())
            for operation in ("push", "promote", "rollback", "deploy"):
                with self.subTest(config=relative, task=f"{prefix}{operation}"):
                    task = configuration["tasks"][f"{prefix}{operation}"]
                    self.assertTrue(task["raw"])
                    self.assertIsInstance(task["run"], str)
                    self.assertIn(operation, task["run"])
                    self.assertNotIn("depends", task)


if __name__ == "__main__":
    unittest.main()
