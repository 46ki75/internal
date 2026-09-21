import { schemas } from "../../../contracts.ts";
import { BookmarkService } from "../../../features/bookmark.ts";
import { body, endpoint, getRepository } from "../../../lib/http.ts";

export default endpoint("createBookmark", async (event) => {
  const input = await body(event, schemas.CreateBookmarkRequestBody);
  return new BookmarkService(await getRepository()).create(input);
});
