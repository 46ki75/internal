import { ImageService } from "../../../features/image.ts";
import { endpoint, getRepository } from "../../../lib/http.ts";

export default endpoint("listImages", async () =>
  new ImageService(await getRepository()).list(),
);
