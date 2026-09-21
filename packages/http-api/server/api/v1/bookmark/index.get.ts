import { BookmarkService } from "../../../features/bookmark.ts";
import { endpoint, getRepository } from "../../../lib/http.ts";

export default endpoint("listBookmarks", async () =>
  new BookmarkService(await getRepository()).list(),
);
