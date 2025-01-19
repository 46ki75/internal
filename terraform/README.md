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

| リソース名                                               | 説明                                                                                  | 環境            |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------- | --------------- |
| `/環境名/46ki75/internal/notion/secret`                  | Notion の API キー / Lambda 環境変数として使用                                        | dev / stg/ prod |
| `/環境名/46ki75/internal/github/secret`                  | Notion の API キー / Lambda 環境変数として使用                                        | dev / stg/ prod |
| `/環境名/46ki75/internal/cognito/userpool/user/password` | Cognito ユーザーのログインパスワード                                                  | dev / stg/ prod |
| `/shared/46ki75/internal/notion/anki/database/id`        | Notion の Anki データベース / デプロイ時に Lambda 環境変数として使用                  | shared          |
| `/shared/46ki75/internal/notion/bookmark/database/id`    | Notion の Bookmark データベース ID / デプロイ時に Lambda 環境変数として使用           | shared          |
| `/shared/46ki75/internal/notion/todo/database/id`        | Notion の ToDO(Calender) データベース ID / デプロイ時に Lambda 環境変数として使用     | shared          |
| `/shared/46ki75/internal/notion/routine/database/id`     | Notion の Routine データベース ID / デプロイ時に Lambda 環境変数として使用            | shared          |
| `/shared/46ki75/internal/deepl/secret`                   | deepl の API シークレット・環境共通・Terraform デプロイ時に Lambda 環境変数として使用 | shared          |

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
