import { Worker, WebhookVerificationError } from "@notionhq/workers";

const worker = new Worker();
export default worker;

/**
 * PixAI task webhook payload.
 * https://platform.pixai.art/en/docs/references/webhook
 *
 * PixAI sends no signature header; the unguessable Notion webhook URL is the
 * only transport-level auth, so the payload shape is validated strictly and
 * anything unexpected is rejected without retries.
 */
interface PixaiOutputs {
  mediaIds?: string[];
  mediaUrls?: string[];
  mediaId?: string;
  videos?: Array<{ mediaId?: string; thumbnailMediaId?: string }>;
}

interface PixaiTaskEvent {
  action: string;
  data: {
    id: string;
    status: string;
    createdAt?: string;
    updatedAt?: string;
    outputs?: PixaiOutputs;
  };
}

function parsePixaiEvent(body: Record<string, unknown>): PixaiTaskEvent {
  // Webhooks configured on the profile page send the event name as `type`;
  // the documented `callbackUrl` format uses `action`. Same `data` shape.
  const action = body["type"] ?? body["action"];
  const data = body["data"] as PixaiTaskEvent["data"] | undefined;

  if (
    typeof action !== "string" ||
    !action.startsWith("task_") ||
    typeof data?.id !== "string" ||
    typeof data?.status !== "string"
  ) {
    throw new WebhookVerificationError(
      `Request body does not match the PixAI task event shape: ${JSON.stringify(body).slice(0, 1000)}`,
    );
  }

  return { action, data };
}

function collectMediaIds(outputs: PixaiOutputs | undefined): string[] {
  if (!outputs) return [];
  const ids = [...(outputs.mediaIds ?? [])];
  for (const video of outputs.videos ?? []) {
    if (video.mediaId) ids.push(video.mediaId);
    if (video.thumbnailMediaId) ids.push(video.thumbnailMediaId);
  }
  if (outputs.mediaId) ids.push(outputs.mediaId);
  return [...new Set(ids)];
}

/** Resolve a PixAI media ID to a downloadable URL via GET /v1/media/{id}. */
async function resolveMediaUrl(
  mediaId: string,
  apiKey: string,
): Promise<{ name: string; url: string } | null> {
  const res = await fetch(`https://api.pixai.art/v1/media/${mediaId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    console.error(`Failed to resolve media ${mediaId}: HTTP ${res.status}`);
    return null;
  }
  const media = (await res.json()) as {
    type?: string;
    urls?: Array<{ variant?: string; url?: string }>;
  };
  const url = media.urls?.find((entry) => entry.url)?.url;
  if (!url) {
    console.error(`Media ${mediaId} has no URL: ${JSON.stringify(media)}`);
    return null;
  }
  return { name: `${media.type?.toLowerCase() ?? "media"}-${mediaId}`, url };
}

worker.webhook("onPixaiTask", {
  title: "PixAI Task Webhook",
  description:
    "Upserts one Notion page per PixAI task, tracking status and generated media URLs.",
  execute: async (events, { notion }) => {
    const databaseId = process.env.PIXAI_DATABASE_ID;
    if (!databaseId) {
      throw new Error(
        "PIXAI_DATABASE_ID is not set. Run: ntn workers env set PIXAI_DATABASE_ID=<database-id>",
      );
    }

    // API version 2025-09-03: pages are queried per data source, not per
    // database. Single-source databases (the normal case) have exactly one.
    const database = await notion.databases.retrieve({
      database_id: databaseId,
    });
    const dataSourceId =
      "data_sources" in database ? database.data_sources[0]?.id : undefined;
    if (!dataSourceId) {
      throw new Error(`Database ${databaseId} has no data source`);
    }

    for (const event of events) {
      const { action, data } = parsePixaiEvent(event.body);

      const existing = await notion.dataSources.query({
        data_source_id: dataSourceId,
        filter: { property: "Task ID", rich_text: { equals: data.id } },
        page_size: 1,
      });

      console.log(
        `Task ${data.id} (${action}) outputs: ${JSON.stringify(data.outputs)?.slice(0, 2000)}`,
      );
      // Prefer URLs sent inline; profile-page webhooks only send media IDs,
      // which need a PixAI API call to resolve.
      const mediaFiles = (data.outputs?.mediaUrls ?? []).map((url, i) => ({
        name: `media-${i + 1}`,
        url,
      }));
      if (mediaFiles.length === 0) {
        const mediaIds = collectMediaIds(data.outputs);
        const apiKey = process.env.PIXAI_API_KEY;
        if (mediaIds.length > 0 && !apiKey) {
          console.error(
            "PIXAI_API_KEY is not set; cannot resolve media IDs to URLs. Run: ntn workers env set PIXAI_API_KEY=<api-key>",
          );
        } else if (mediaIds.length > 0 && apiKey) {
          const resolved = await Promise.all(
            mediaIds.map((id) => resolveMediaUrl(id, apiKey)),
          );
          mediaFiles.push(...resolved.filter((file) => file !== null));
        }
      }

      const properties: Parameters<
        typeof notion.pages.update
      >[0]["properties"] = {
        Status: { select: { name: data.status } },
        URL: {
          url: `https://pixai.art/en/generator/?taskId=${data.id}&showOnStage=1`,
        },
      };
      if (data.updatedAt) {
        properties["Updated"] = { date: { start: data.updatedAt } };
      }
      if (mediaFiles.length > 0) {
        properties["Media"] = {
          files: mediaFiles.map((file) => ({
            name: file.name,
            external: { url: file.url },
          })),
        };
      }

      if (existing.results.length > 0) {
        await notion.pages.update({
          page_id: existing.results[0].id,
          properties,
        });
      } else {
        await notion.pages.create({
          parent: { database_id: databaseId },
          properties: {
            Name: {
              title: [{ text: { content: `PixAI task ${data.id}` } }],
            },
            "Task ID": { rich_text: [{ text: { content: data.id } }] },
            ...properties,
          },
        });
      }

      console.log(
        `Processed ${action} for task ${data.id} (delivery ${event.deliveryId})`,
      );
    }
  },
});
