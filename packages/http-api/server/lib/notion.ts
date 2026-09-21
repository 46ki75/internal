import { Client, collectPaginatedAPI, isFullPage } from "@notionhq/client";
import type {
  QueryDataSourceParameters,
  CreatePageParameters,
  UpdatePageParameters,
} from "@notionhq/client";
import { N2A2UIClient } from "n2a2ui";
import { getParameter, stageName } from "./parameters.ts";

export const NOTION_VERSION = "2026-03-11";
export type DataSource =
  "anki" | "trivia" | "bookmark" | "todo" | "image" | "image_tag";

export class NotionRepository {
  constructor(
    readonly client: Client,
    readonly dataSourceId: (feature: DataSource) => Promise<string>,
    readonly converter = new N2A2UIClient({
      notion: client,
      enableUnsupportedBlock: true,
      enableFetchImageMeta: true,
      enableFetchBookmarkMeta: true,
      enableHtmlEmbed: false,
      fetch: (input, init) =>
        fetch(input, { ...init, signal: AbortSignal.timeout(5000) }),
    }),
  ) {}

  async query(
    feature: DataSource,
    options: Omit<QueryDataSourceParameters, "data_source_id"> = {},
  ) {
    const response = await this.client.dataSources.query({
      ...options,
      data_source_id: await this.dataSourceId(feature),
    });
    return {
      pages: response.results.map(fullPage),
      next_cursor: response.next_cursor,
    };
  }

  async queryAll(
    feature: DataSource,
    options: Omit<QueryDataSourceParameters, "data_source_id"> = {},
  ) {
    const pages = await collectPaginatedAPI(this.client.dataSources.query, {
      ...options,
      data_source_id: await this.dataSourceId(feature),
    });
    return pages.map(fullPage);
  }

  async getPage(id: string) {
    return fullPage(await this.client.pages.retrieve({ page_id: id }));
  }
  async updatePage(id: string, options: Omit<UpdatePageParameters, "page_id">) {
    return fullPage(
      await this.client.pages.update({ ...options, page_id: id }),
    );
  }
  async createPage(
    feature: DataSource,
    options: Omit<CreatePageParameters, "parent">,
  ) {
    return fullPage(
      await this.client.pages.create({
        ...options,
        parent: {
          type: "data_source_id",
          data_source_id: await this.dataSourceId(feature),
        },
      }),
    );
  }
}

export function fullPage(page: Parameters<typeof isFullPage>[0]) {
  if (!isFullPage(page)) throw new Error("Notion returned a partial page");
  return page;
}

let repository: Promise<NotionRepository> | undefined;
export function getRepository() {
  repository ??= (async () => {
    const prefix = `/${stageName()}/46ki75/internal/notion`;
    const client = new Client({
      auth: await getParameter(`${prefix}/secret`),
      notionVersion: NOTION_VERSION,
      timeoutMs: 8000,
      retry: { maxRetries: 1, maxRetryDelayMs: 1000 },
    });
    return new NotionRepository(client, (feature) =>
      getParameter(`${prefix}/${feature}/data_source/id`),
    );
  })().catch((error: unknown) => {
    repository = undefined;
    throw error;
  });
  return repository;
}
