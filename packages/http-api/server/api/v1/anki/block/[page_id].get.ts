import { AnkiService } from "../../../../features/anki.ts";
import { endpoint, getRepository, pageId } from "../../../../lib/http.ts";

export default endpoint("ankiBlocks", async (event) =>
  new AnkiService(await getRepository()).blocks(pageId(event)),
);
