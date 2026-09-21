import { listQuery } from "../../../contracts.ts";
import { AnkiService } from "../../../features/anki.ts";
import { endpoint, getRepository, query } from "../../../lib/http.ts";

export default endpoint("listAnki", async (event) => {
  const input = query(event, listQuery);
  return new AnkiService(await getRepository()).list(
    input.page_size,
    input.next_cursor,
  );
});
