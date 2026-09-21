import { listQuery } from "../../../contracts.ts";
import { TriviaService } from "../../../features/trivia.ts";
import { endpoint, getRepository, query } from "../../../lib/http.ts";

export default endpoint("listTrivia", async (event) => {
  const input = query(event, listQuery);
  return new TriviaService(await getRepository()).list(input.page_size);
});
