import { ImageService } from "../../../features/image.ts";
import { endpoint, getRepository } from "../../../lib/http.ts";

export default endpoint("listImageTags", async () =>
  new ImageService(await getRepository()).tags(),
);
