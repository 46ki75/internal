import { schemas } from "../../../contracts.ts";
import { ToDoService } from "../../../features/to-do.ts";
import { body, endpoint, getRepository } from "../../../lib/http.ts";

export default endpoint("createToDo", async (event) => {
  const input = await body(event, schemas.CreateToDoRequest);
  return new ToDoService(await getRepository()).create(input);
});
