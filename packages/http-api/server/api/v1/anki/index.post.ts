import { schemas } from "../../../contracts.ts";
import { AnkiService } from "../../../features/anki.ts";
import { body, endpoint, getRepository } from "../../../lib/http.ts";

export default endpoint("createAnki", async (event) => {
  const input = await body(event, schemas.CreateAnkiRequest);
  return new AnkiService(await getRepository()).create(input);
});
