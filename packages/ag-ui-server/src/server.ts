import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  createCopilotHonoHandler,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";

import { copilotkitBuiltinRuntime } from "./copilotkit-builtin.ts";

const app = new Hono();

app.use("*", cors());

// `/copilotkit/builtin/agent/gpt-5.4-nano/run`
// `/copilotkit/builtin/agent/minimax-m2.5/run`
// `/copilotkit/builtin/agent/kimi-k2.6/run`
app.route(
  "/",
  createCopilotHonoHandler({
    runtime: copilotkitBuiltinRuntime,
    basePath: "/copilotkit/builtin",
  }),
);

// Bedrock AgentCore proxies all requests to /invocations.
// Rewrite the URL to include the target agent so CopilotKit can route it.
const defaultAgent = process.env.DEFAULT_AGENT ?? "minimax-m2.5";
const runtimeHandler = createCopilotRuntimeHandler({
  runtime: copilotkitBuiltinRuntime,
  basePath: "/copilotkit/builtin",
});
app.post("/invocations", async (c) => {
  const body = await c.req.arrayBuffer();
  return runtimeHandler(
    new Request(
      `http://localhost/copilotkit/builtin/agent/${defaultAgent}/run`,
      { method: "POST", headers: c.req.raw.headers, body },
    ),
  );
});

const port = parseInt(process.env.PORT || "8080", 10);
const hostname = process.env.ADDRESS || "0.0.0.0";

serve({ fetch: app.fetch, port, hostname }, (info) => {
  console.log(
    `CopilotKit (BuiltIn) backend running on http://${info.address}:${info.port}`,
  );
});
