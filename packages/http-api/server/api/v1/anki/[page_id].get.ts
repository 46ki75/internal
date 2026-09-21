import { AnkiService } from "../../../features/anki.ts";
import { endpoint, getRepository, pageId } from "../../../lib/http.ts";

export default endpoint("getAnki", async (event) =>
  new AnkiService(await getRepository()).get(pageId(event)),
);
