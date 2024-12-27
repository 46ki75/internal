# 手動管理リソース

## Parameter Store

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

## S3

- `shared-46ki75-internal-s3-bucket-terraform-tfstate`: Terraform の tfstate 管理用バケット・全環境共通
