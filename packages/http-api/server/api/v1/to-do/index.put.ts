import { schemas } from "../../../contracts.ts";
import { ToDoService } from "../../../features/to-do.ts";
import { body, endpoint, getRepository } from "../../../lib/http.ts";

export default endpoint("updateToDo", async (event) => {
  const input = await body(event, schemas.UpdateToDoInput);
  return new ToDoService(await getRepository()).update(input);
});
