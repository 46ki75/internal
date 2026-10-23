# Terraform

## Lambda release ownership and migration

Terraform owns Lambda infrastructure and configuration (IAM, runtime, environment,
logging, ingress, and initial provisioning). The release CLI owns subsequent code
updates, the live `green` alias target, and an optional `blue` alias. Only `green`
receives API Gateway traffic and reporter CloudWatch Logs subscriptions; neither
`blue` nor unqualified `$LATEST` is a live ingress target.

| Bootstrap map key | Function name (`<stage>` is `dev`, `stg`, or `prod`) |
| --- | --- |
| `http-api` | `<stage>-46ki75-internal-lambda-function-http-api` |
| `logs-reporter` | `<stage>-46ki75-internal-lambda-function-reporter` |
| `nitro-api` | `<stage>-46ki75-internal-lambda-function-nitro-api` |

The existing Terraform alias addresses (`aws_lambda_alias.http_api`, `.reporter`,
and `.nitro_api`) now create `green`, always targeting a numbered published version.
Their `function_version` is bootstrap-only (`ignore_changes`): later infrastructure
applies do not undo CLI promotions or rollbacks. Terraform does **not** manage
`blue`; the CLI may create, retarget, or delete it, and it can be absent.

Function code artifact fields are also ignored after creation: `filename` and
`source_code_hash` for Rust; `s3_bucket`, `s3_key`, `s3_object_version`, and
`source_code_hash` for Nitro. Terraform still applies configuration changes and may
publish versions, but those changes do not reach live traffic until the CLI moves
`green` to a version containing the intended code **and** configuration. A new push
updates Lambda code directly, without a Terraform apply; promotion and rollback
are release operations, not infrastructure deployments.

### Migrate an existing workspace safely

Do this separately for each workspace. Freeze code pushes, configuration changes,
and concurrent Terraform/release operations until migration is verified.

1. **Before the first push or migration apply**, record the currently live code,
   configuration, and `stable` alias target for all three functions. Existing Rust
   `stable` aliases may target `$LATEST`; while that exact code/configuration is
   still live, snapshot it with Lambda `PublishVersion` and record the returned
   numbered version. Use the captured code SHA-256 and revision ID as publish
   guards. If identical code/configuration is already published, verify and reuse
   that version. Do not push new code first and then publish `$LATEST` as the old
   live version. Recover the known-good artifact/configuration first if necessary.
   For an already numbered alias (normally Nitro), record its **current alias
   target**, not the function's newest version or the latest S3 artifact.
2. Supply `lambda_green_bootstrap_versions` with those verified live versions for
   **all existing functions**. It is an optional map with only the keys above and
   positive integer strings; `$LATEST`, zero, and unknown keys are rejected. For
   example, using illustrative version numbers only:

   ```hcl
   lambda_green_bootstrap_versions = {
     "http-api"      = "12"
     "logs-reporter" = "7"
     "nitro-api"     = "24"
   }
   ```

   Pass this through the selected workspace's variable file or
   `TF_VAR_lambda_green_bootstrap_versions`. The default empty map falls back to
   each function's published `version` **only for initial alias creation**. That
   fallback is suitable for first provisioning, not migration: a function's newest
   version might be an unpromoted release. Changing this map later does not move
   an existing `green`, but the map is reused if an alias is recreated; keep any
   retained overrides appropriate for recovery.
3. Review the infrastructure plan before applying it. It must create `green` at
   the captured live versions, create qualified permissions, and switch both API
   Gateway integrations and **all** reporter subscriptions to `green`. Aliases
   and changing permissions use `create_before_destroy`; ingress explicitly waits
   for its new permission. Keep `stable` available until its dependent ingress
   updates finish; Terraform removes the replaced aliases afterward. Do not
   manually delete `stable` early or use targeted/partial applies for this cutover.
4. After the full apply, verify `green` targets, API routes, and reporter delivery
   before unfreezing releases. Pending code must remain off the live alias until
   explicitly promoted. Preserve the recorded versions for rollback; do not delete
   versions referenced by either alias or needed for recovery.

The release CLI serializes per-function releases with conditional S3 writes in the
existing shared Terraform state bucket,
`shared-46ki75-internal-s3-bucket-terraform-tfstate`, under
`lambda-release-locks/<account>/<region>/<function>.lock` (full Lambda function
name). These are separate from Terraform's state lock and do not serialize
Terraform configuration changes; coordinate infrastructure applies with releases.
No additional lock bucket or Terraform-managed `blue` alias is required.

### Initial provisioning and Nitro deployment artifacts

For a new function, Terraform publishes its bootstrap code and creates `green` at
that numbered version. Rust uses `assets/bootstrap.zip`, a placeholder rather than
an application release; deploy the real application through the release CLI.

Before the first Nitro publication in each workspace, run
`mise run --silent //packages/http-api:bootstrap <stage>` to create its private,
versioned artifact bucket, then
`mise run --silent //packages/http-api:publish <stage>`. This existing `publish`
task is **artifact-only bootstrap**: uploading a ZIP does not update an existing
Lambda or promote `green`. Use the new push/release workflow for subsequent Lambda
code updates, without a Terraform apply.

Terraform retains the remote version-ID/checksum lookup and validation for initial
creation or replacement. Shared-stack plans still require a valid published
artifact, but no local Nitro build. Keep the bootstrap artifact available even
after adopting direct pushes. Function replacement also consumes bootstrap code;
review such plans and deploy the intended release explicitly. See the
[Nitro deployment guide](../packages/http-api/README.md#deployment) for artifact
packaging details.

## ドメイン設計

### CloudFront (メインドメイン)

- `dev-internal.46ki75.com`: 開発環境の CloudFront
- `stg-internal.46ki75.com`: ステージング環境の CloudFront
- `internal.46ki75.com`: 本番環境の CloudFront

### Amazon API Gateway

- `api.dev-internal.46ki75.com: 開発環境
- `api.stg-internal.46ki75.com: ステージング環境
- `api.internal.46ki75.com: 本番環境

## 手動管理リソース

### Parameter Store

| リソース名                                                | 説明                                                                                  | 環境                   |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------- | ---------------------- |
| `/環境名/46ki75/internal/notion/secret`                   | Notion の API キー / Lambda 環境変数として使用                                        | `dev` / `stg` / `prod` |
| `/環境名/46ki75/internal/openrouter/secret`               | OpenRouter の API キー                                                                | `dev` / `stg` / `prod` |
| `/環境名/46ki75/internal/openrouter/model`                | Writing Assessment で使用する OpenRouter モデル ID                                    | `dev` / `stg` / `prod` |
| `/環境名/46ki75/internal/openrouter/reasoning-effort`     | OpenRouter モデルの reasoning effort                                                  | `dev` / `stg` / `prod` |
| `/環境名/46ki75/internal/github/secret`                   | Notion の API キー / Lambda 環境変数として使用                                        | `dev` / `stg` / `prod` |
| `/環境名/46ki75/internal/cognito/userpool/user/password`  | Cognito ユーザーのログインパスワード                                                  | `dev` / `stg` / `prod` |
| `/環境名/46ki75/internal/notion/typing/data_source/id`    | Typing Notion data source ID (`Title`: Title, `Text`: RichText)                       | `dev` / `stg` / `prod` |
| `/環境名/46ki75/internal/notion/anki/database/id`         | Notion の Anki データベース / デプロイ時に Lambda 環境変数として使用                  | `dev` / `stg` / `prod` |
| `/環境名/46ki75/internal/notion/bookmark/database/id`     | Notion の Bookmark データベース ID / デプロイ時に Lambda 環境変数として使用           | `dev` / `stg` / `prod` |
| `/環境名/46ki75/internal/notion/todo/database/id`         | Notion の ToDo(Calender) データベース ID / デプロイ時に Lambda 環境変数として使用     | `dev` / `stg` / `prod` |
| `/環境名/46ki75/internal/notion/routine/database/id`      | Notion の Routine データベース ID / デプロイ時に Lambda 環境変数として使用            | `dev` / `stg` / `prod` |
| `/環境名/46ki75/internal/notion/notification/database/id` | Notion の Notification データベース ID / デプロイ時に Lambda 環境変数として使用       | `dev` / `stg` / `prod` |
| `/shared/46ki75/internal/deepl/secret`                    | deepl の API シークレット・環境共通・Terraform デプロイ時に Lambda 環境変数として使用 | `shared`               |

### S3

- `shared-46ki75-internal-s3-bucket-terraform-tfstate`: Terraform の tfstate 管理用バケット・全環境共通

### SNS

- EMail サブスクリプションの承認

## Route 53 ゾーン

以下のゾーンを手動作成する。NS レコードは後で使用する。

- `dev-internal.46ki75.com`
- `stg-internal.46ki75.com`
- `internal.46ki75.com`

## Route 53 レコード(別アカウント)

以下の子ゾーンが作成されるので、`46ki75.com` を所持しているアカウントに NS レコードを追加する。執筆時点で `46ki75.com` のレコードは [こちらのリポジトリ](https://github.com/46ki75/iac) で管理されている。

- `dev-internal.46ki75.com`
- `stg-internal.46ki75.com`
- `internal.46ki75.com`
