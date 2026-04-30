import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  createCopilotHonoHandler,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";

import { CopilotRuntime, InMemoryAgentRunner } from "@copilotkit/runtime/v2";
import { BuiltInAgent } from "@copilotkit/runtime/v2";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const generateAgent = (modelId: string): BuiltInAgent =>
  new BuiltInAgent({
    model: openrouter(modelId),
    maxSteps: 200,
    mcpServers: [
      {
        url: "https://knowledge-mcp.global.api.aws",
        type: "http",
        options: {},
      },
    ],
    providerOptions: {
      openrouter: {
        reasoning: { effort: "high" },
      },
    },
    tools: [],
  });

const modelId = process.env.MODEL_ID ?? "minimax/minimax-m2.5:free";
const agentName = "default";
const copilotkitBuiltinRuntime = new CopilotRuntime({
  agents: {
    [agentName]: generateAgent(modelId),
  },
  runner: new InMemoryAgentRunner(),
  a2ui: {
    injectA2UITool: true,
  },
});

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
const runtimeHandler = createCopilotRuntimeHandler({
  runtime: copilotkitBuiltinRuntime,
  basePath: "/copilotkit/builtin",
});
app.post("/invocations", async (c) => {
  const body = await c.req.arrayBuffer();
  return runtimeHandler(
    new Request(`http://localhost/copilotkit/builtin/agent/${agentName}/run`, {
      method: "POST",
      headers: c.req.raw.headers,
      body,
    }),
  );
});

const port = parseInt(process.env.PORT || "8080", 10);
const hostname = process.env.ADDRESS || "0.0.0.0";

serve({ fetch: app.fetch, port, hostname }, (info) => {
  console.log(
    `CopilotKit (BuiltIn) backend running on http://${info.address}:${info.port}`,
  );
});
