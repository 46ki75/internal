import { schemas } from "../../../contracts.ts";
import { AnkiService } from "../../../features/anki.ts";
import { body, endpoint, getRepository, pageId } from "../../../lib/http.ts";

export default endpoint("updateAnki", async (event) => {
  const input = await body(event, schemas.UpdateAnkiRequest);
  return new AnkiService(await getRepository()).update(pageId(event), input);
});
