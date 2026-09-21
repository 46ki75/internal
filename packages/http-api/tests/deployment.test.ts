import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

let directory: string;
let scripts: string;
let callsFile: string;
let env: NodeJS.ProcessEnv;
const artifact = Buffer.from("deployment fixture");

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), "nitro-deployment-"));
  scripts = join(directory, "packages/http-api/scripts");
  callsFile = join(directory, "calls.jsonl");
  const bin = join(directory, "bin");
  await mkdir(scripts, { recursive: true });
  await mkdir(bin);
  await mkdir(join(directory, "packages/http-api/.output"));
  await writeFile(
    join(directory, "packages/http-api/.output/lambda.zip"),
    artifact,
  );
  await writeFile(callsFile, "");
  for (const name of ["deploy.sh", "upload.sh"])
    await copyFile(
      new URL(`../scripts/${name}`, import.meta.url),
      join(scripts, name),
    );
  // Exercise deployment orchestration without rebuilding or contacting AWS.
  await writeFile(join(scripts, "package.sh"), "#!/usr/bin/env bash\nexit 0\n");
  for (const command of ["aws", "terraform"])
    await writeFile(
      join(bin, command),
      `#!/usr/bin/env node
const { appendFileSync, readFileSync } = require("node:fs");
const { createHash } = require("node:crypto");
const args = process.argv.slice(2);
appendFileSync(process.env.CALLS_FILE, JSON.stringify({ command: "${command}", args }) + "\\n");
if ("${command}" === "terraform") {
  if (args.includes("show")) console.log(process.env.WORKSPACE);
} else if (args[1] === "get-bucket-versioning") {
  console.log(process.env.VERSIONING);
} else if (args[1] === "put-object") {
  if (process.env.FAIL_UPLOAD === "1") process.exit(1);
  const body = readFileSync(args[args.indexOf("--body") + 1]);
  const hash = createHash("sha256").update(body).digest("base64");
  if (args[args.indexOf("--checksum-sha256") + 1] !== hash) process.exit(2);
  console.log(JSON.stringify({ VersionId: "immutable-version", ChecksumSHA256: hash }));
} else {
  process.exit(3);
}
`,
      { mode: 0o755 },
    );
  env = {
    ...process.env,
    PATH: `${bin}:${process.env.PATH}`,
    CALLS_FILE: callsFile,
    WORKSPACE: "dev",
    VERSIONING: "Enabled",
    FAIL_UPLOAD: "0",
  };
});

afterEach(async () => {
  await rm(directory, { recursive: true, force: true });
});

function deploy(stage = "dev") {
  return execFileSync("bash", [join(scripts, "deploy.sh"), stage], {
    env,
    encoding: "utf8",
    stdio: "pipe",
  });
}

async function calls() {
  return (await readFile(callsFile, "utf8"))
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as { command: string; args: string[] });
}

describe("versioned Nitro deployment", () => {
  it("publishes a stage-scoped, checksummed artifact before Terraform apply", async () => {
    expect(JSON.parse(deploy())).toEqual({
      VersionId: "immutable-version",
      ChecksumSHA256: createHash("sha256").update(artifact).digest("base64"),
    });
    const commands = await calls();
    const upload = commands.findIndex((call) =>
      call.args.includes("put-object"),
    );
    const apply = commands.findIndex((call) => call.args.includes("apply"));
    expect(upload).toBeGreaterThan(-1);
    expect(apply).toBeGreaterThan(upload);
    expect(commands[upload].args).toEqual(
      expect.arrayContaining([
        "--region",
        "ap-northeast-1",
        "--bucket",
        "dev-46ki75-internal-s3-bucket-nitro-api-artifacts",
        "--key",
        "nitro-api/lambda.zip",
        "--content-type",
        "application/zip",
        "--checksum-algorithm",
        "SHA256",
      ]),
    );
  });

  it.each(["Suspended", "None"])(
    "stops before publication when versioning is %s",
    async (status) => {
      env.VERSIONING = status;
      expect(() => deploy()).toThrow("nitro-api:bootstrap dev");
      expect(
        (await calls()).some((call) => call.args.includes("put-object")),
      ).toBe(false);
      expect((await calls()).some((call) => call.args.includes("apply"))).toBe(
        false,
      );
    },
  );

  it("does not apply Terraform after an upload failure", async () => {
    env.FAIL_UPLOAD = "1";
    expect(() => deploy()).toThrow();
    expect(
      (await calls()).some((call) => call.args.includes("put-object")),
    ).toBe(true);
    expect((await calls()).some((call) => call.args.includes("apply"))).toBe(
      false,
    );
  });

  it("does not publish into a mismatched Terraform workspace", async () => {
    env.WORKSPACE = "prod";
    expect(() => deploy()).toThrow();
    expect(
      (await calls()).some(
        (call) => call.command === "aws" || call.args.includes("apply"),
      ),
    ).toBe(false);
  });

  it("rejects an invalid stage before any external command", async () => {
    expect(() => deploy("qa")).toThrow("Invalid stage: qa");
    expect(await calls()).toEqual([]);
  });
});
