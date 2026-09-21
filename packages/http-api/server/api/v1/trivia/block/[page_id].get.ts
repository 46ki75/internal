import { TriviaService } from "../../../../features/trivia.ts";
import { endpoint, getRepository, pageId } from "../../../../lib/http.ts";

export default endpoint("triviaBlocks", async (event) =>
  new TriviaService(await getRepository()).blocks(pageId(event)),
);
