# pixai-webhook-worker

A [Notion Worker](https://developers.notion.com/workers/get-started/overview) that
receives [PixAI task webhooks](https://platform.pixai.art/en/docs/references/webhook)
and upserts one page per PixAI task in a Notion database (status + generated media
URLs).

## How it works

PixAI POSTs `{ action: "task_*", data: { id, status, ..., outputs: { mediaUrls } } }`
to the worker's webhook URL whenever a task starts, completes, is canceled, or fails.
The `onPixaiTask` handler:

1. Validates the payload shape (PixAI sends no signature; malformed requests are
   rejected with `WebhookVerificationError`, which suppresses retries).
2. Looks up an existing page by the `Task ID` property.
3. Updates it, or creates a new page if none exists. Media URLs are written to the
   `Media` files property when the task completes.

## Notion database schema

Create a database and give your integration access to it. Required properties:

| Property  | Type      |
| --------- | --------- |
| `Name`    | Title     |
| `Task ID` | Rich text |
| `Status`  | Select    |
| `Updated` | Date      |
| `Media`   | Files     |
| `URL`     | URL       |

## Setup

1. Install the Notion CLI (interactive; run it yourself):

   ```sh
   curl -fsSL https://ntn.dev | bash
   ```

2. Set secrets (webhooks require your own Notion token — a personal access token or
   an internal integration token that has been connected to the database):

   ```sh
   ntn workers env set NOTION_API_TOKEN=ntn_xxx
   ntn workers env set PIXAI_DATABASE_ID=<database-id>
   ntn workers env set PIXAI_API_KEY=<pixai-api-key>
   ```

   `PIXAI_API_KEY` (from [My API Keys](https://platform.pixai.art/en/docs/quick-start/enroll-in-api))
   is used to resolve the media IDs in completed-task events to downloadable
   URLs via `GET https://api.pixai.art/v1/media/{mediaId}`.

3. Deploy and get the webhook URL:

   ```sh
   ntn workers deploy
   ntn workers webhooks list
   ```

4. Register the printed URL on your
   [PixAI profile page](https://platform.pixai.art/en/docs/references/webhook)
   (or pass it as `callbackUrl` per task in the PixAI REST API).

   The URL contains an unguessable ID and acts as a shared secret — treat it as
   sensitive.

## Debugging

```sh
ntn workers runs list
ntn workers runs logs <run-id>
```
