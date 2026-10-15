import { TypingService } from "../../../features/typing.ts";
import { endpoint, getRepository } from "../../../lib/http.ts";

export default endpoint("listTyping", async () =>
  new TypingService(await getRepository()).list(),
);
