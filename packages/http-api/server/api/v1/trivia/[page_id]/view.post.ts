import { TriviaService } from "../../../../features/trivia.ts";
import { endpoint, getRepository, pageId } from "../../../../lib/http.ts";

export default endpoint("incrementView", async (event) =>
  new TriviaService(await getRepository()).incrementView(pageId(event)),
);
