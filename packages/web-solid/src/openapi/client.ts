import createClient from "openapi-fetch";
import type { paths } from "./schema";

const fetchCurrent: typeof globalThis.fetch = (...args) =>
  globalThis.fetch(...args);

export const openApiClient = createClient<paths>({ fetch: fetchCurrent });
