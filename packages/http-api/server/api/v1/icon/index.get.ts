import { IconService } from "../../../features/icon.ts";
import { endpoint, getRepository } from "../../../lib/http.ts";

export default endpoint("listIcons", async () =>
  new IconService(await getRepository()).list(),
);
