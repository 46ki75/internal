import { ToDoService } from "../../../features/to-do.ts";
import { endpoint, getRepository } from "../../../lib/http.ts";

export default endpoint("listToDos", async () =>
  new ToDoService(await getRepository()).list(),
);
