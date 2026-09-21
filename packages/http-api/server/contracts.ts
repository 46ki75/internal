import { z } from "zod";

// The existing OpenAPI contract makes Rust Option fields optional and nullable.
const nullableText = z.string().nullish();
const tag = z.object({ id: z.string(), name: z.string(), color: z.string() });
const surface = z.object({
  root: z.string(),
  components: z.record(
    z.object({ id: z.string(), component: z.string() }).passthrough(),
  ),
});
const severity = z.enum(["UNKNOWN", "DEBUG", "INFO", "WARN", "ERROR"]);
const date = z.string().date();

export const schemas = {
  AnkiTagResponse: tag,
  AnkiResponse: z.object({
    page_id: z.string(),
    title: nullableText,
    description: nullableText,
    ease_factor: z.number(),
    repetition_count: z.number().int().nonnegative(),
    next_review_at: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
    tags: z.array(tag),
    url: z.string(),
    is_review_required: z.boolean(),
  }),
  AnkiBlockResponse: z.object({
    front: surface,
    back: surface,
    explanation: surface,
  }),
  CreateAnkiRequest: z.object({ title: z.string().nullish() }),
  UpdateAnkiRequest: z.object({
    ease_factor: z.number().nullish(),
    repetition_count: z.number().int().min(0).max(4294967295).nullish(),
    next_review_at: z.string().datetime({ offset: true }).nullish(),
    is_review_required: z.boolean().nullish(),
    in_trash: z.boolean().nullish(),
  }),
  TriviaResponse: z.object({
    page_id: z.string(),
    title: nullableText,
    view_count: z.number().int().nonnegative(),
    created_at: z.string(),
    updated_at: z.string(),
    url: z.string(),
  }),
  TriviaBlockResponse: z.object({ surface }),
  BookmarkTagReponse: tag,
  BookmarkResponse: z.object({
    id: z.string(),
    name: nullableText,
    url: nullableText,
    favicon: nullableText,
    tag: tag.nullish(),
    nsfw: z.boolean(),
    favorite: z.boolean(),
    notion_url: z.string(),
  }),
  CreateBookmarkRequestBody: z.object({
    name: z.string(),
    url: z.string().url(),
  }),
  ToDoSeverityRequest: severity,
  ToDoSeverityResponse: severity,
  ToDoResponse: z.object({
    id: z.string(),
    url: z.string(),
    source: z.string(),
    title: z.string(),
    description: nullableText,
    is_done: z.boolean(),
    is_archived: z.boolean(),
    is_recurring: z.boolean(),
    deadline: date.nullish(),
    severity,
    created_at: date.nullish(),
    updated_at: date.nullish(),
  }),
  CreateToDoRequest: z.object({
    title: z.string(),
    description: z.string().nullish(),
    severity: severity.nullish(),
    deadline: date.nullish(),
  }),
  UpdateToDoInput: z.object({ id: z.string().min(1), is_done: z.boolean() }),
  IconResponse: z.object({
    id: z.string(),
    url: z.string(),
    name: z.string(),
    content_type: nullableText,
  }),
  ImageSourceResponse: tag,
  ImageResponse: z.object({
    title: z.string(),
    name: z.string(),
    sources: z.array(tag),
    url: nullableText,
    tags: z.array(z.string()),
    notable_tags: z.array(z.string()),
    uploaded_at: nullableText,
    images: z.array(z.string()),
  }),
  ImageTagResponse: z.object({
    tag_name: z.string(),
    url: z.string(),
    tag_type: z.string(),
  }),
};

export const imagePage = z.object({
  images: z.array(schemas.ImageResponse),
  next_cursor: nullableText,
});
export const listQuery = z.object({
  page_size: z.coerce.number().int().min(1).max(100).default(100),
  next_cursor: z.string().optional(),
});

export const operations = {
  listTrivia: {
    method: "get",
    path: "/api/v1/trivia",
    response: z.array(schemas.TriviaResponse),
    query: listQuery,
  },
  triviaBlocks: {
    method: "get",
    path: "/api/v1/trivia/block/{page_id}",
    response: schemas.TriviaBlockResponse,
  },
  incrementView: {
    method: "post",
    path: "/api/v1/trivia/{page_id}/view",
    response: schemas.TriviaResponse,
  },
  listAnki: {
    method: "get",
    path: "/api/v1/anki",
    response: z.array(schemas.AnkiResponse),
    query: listQuery,
  },
  getAnki: {
    method: "get",
    path: "/api/v1/anki/{page_id}",
    response: schemas.AnkiResponse,
  },
  ankiBlocks: {
    method: "get",
    path: "/api/v1/anki/block/{page_id}",
    response: schemas.AnkiBlockResponse,
  },
  createAnki: {
    method: "post",
    path: "/api/v1/anki",
    body: schemas.CreateAnkiRequest,
    response: schemas.AnkiResponse,
    status: 201,
  },
  updateAnki: {
    method: "put",
    path: "/api/v1/anki/{page_id}",
    body: schemas.UpdateAnkiRequest,
    response: schemas.AnkiResponse,
  },
  listBookmarks: {
    method: "get",
    path: "/api/v1/bookmark",
    response: z.array(schemas.BookmarkResponse),
  },
  createBookmark: {
    method: "post",
    path: "/api/v1/bookmark",
    body: schemas.CreateBookmarkRequestBody,
    response: schemas.BookmarkResponse,
    status: 201,
  },
  listToDos: {
    method: "get",
    path: "/api/v1/to-do",
    response: z.array(schemas.ToDoResponse),
  },
  createToDo: {
    method: "post",
    path: "/api/v1/to-do",
    body: schemas.CreateToDoRequest,
    response: schemas.ToDoResponse,
    status: 201,
  },
  updateToDo: {
    method: "put",
    path: "/api/v1/to-do",
    body: schemas.UpdateToDoInput,
    response: schemas.ToDoResponse,
  },
  listIcons: {
    method: "get",
    path: "/api/v1/icon",
    response: z.array(schemas.IconResponse),
  },
  listImages: { method: "get", path: "/api/v1/image", response: imagePage },
  listImageTags: {
    method: "get",
    path: "/api/v1/image/tag",
    response: z.array(schemas.ImageTagResponse),
  },
} as const;
