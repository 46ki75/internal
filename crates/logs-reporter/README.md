# Introduction

logs-reporter is a Rust project that implements an AWS Lambda function in Rust.

## Prerequisites

- [Rust](https://www.rust-lang.org/tools/install)
- [Cargo Lambda](https://www.cargo-lambda.info/guide/installation.html)

## Building

To build the project for production, run `cargo lambda build --release`. Remove the `--release` flag to build for development.

Read more about building your lambda function in [the Cargo Lambda documentation](https://www.cargo-lambda.info/commands/build.html).

## Testing

You can run regular Rust unit tests with `cargo test`.

If you want to run integration tests locally, you can use the `cargo lambda watch` and `cargo lambda invoke` commands to do it.

First, run `cargo lambda watch` to start a local server. When you make changes to the code, the server will automatically restart.

Second, you'll need a way to pass the event data to the lambda function.

You can use the existent [event payloads](https://github.com/awslabs/aws-lambda-rust-runtime/tree/main/lambda-events/src/fixtures)
in the Rust Runtime repository if your lambda function is using one of the supported event types.

You can use those examples directly with the `--data-example` flag, where the value is the name of the file in the
[lambda-events](https://github.com/awslabs/aws-lambda-rust-runtime/tree/main/lambda-events/src/fixtures) repository without the `example_` prefix and the `.json` extension.

```bash
cargo lambda invoke --data-example apigw-request
```

For generic events, where you define the event data structure, you can create a JSON file with the data you want to test with. For example:

```json
{
    "command": "test"
}
```

Then, run `cargo lambda invoke --data-file ./data.json` to invoke the function with the data in `data.json`.

Read more about running the local server in [the Cargo Lambda documentation for the `watch` command](https://www.cargo-lambda.info/commands/watch.html).
Read more about invoking the function in [the Cargo Lambda documentation for the `invoke` command](https://www.cargo-lambda.info/commands/invoke.html).

## Deploying

Use the repository release tasks against the Terraform-provisioned function:

```sh
mise run --silent //crates:logs-reporter:push dev
mise run --silent //crates:logs-reporter:promote dev
mise run --silent //crates:logs-reporter:rollback dev
```

`push` builds and publishes code without changing live traffic. `promote` saves the
current green version in blue and pins green to the highest published version.
`rollback` restores green from blue, then removes blue; blue may legitimately be
absent. `logs-reporter:deploy` is deferred and prints guidance instead of deploying.

CloudWatch log subscriptions invoke green, not the unqualified function ARN.
Read the [release lifecycle](../../README.md#lambda-release-lifecycle) and complete
the [alias migration](../../terraform/README.md#lambda-release-ownership-and-migration)
before pushing to an existing environment.
