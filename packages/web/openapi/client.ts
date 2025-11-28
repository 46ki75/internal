import createClient from "openapi-fetch";
import type { paths } from "./schema";

export const openApiClient = createClient<paths>()

