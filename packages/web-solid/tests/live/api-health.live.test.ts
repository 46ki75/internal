import { expect, it } from "vitest";

const requiredEnvironmentVariable = (
  name: "LIVE_API_ACCESS_TOKEN" | "LIVE_API_BASE_URL",
) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required to run live tests`);
  }
  return value;
};

it("reaches the authenticated API health endpoint", async () => {
  const baseUrl = requiredEnvironmentVariable("LIVE_API_BASE_URL");
  const accessToken = requiredEnvironmentVariable("LIVE_API_ACCESS_TOKEN");
  const response = await fetch(new URL("/api/health", baseUrl), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual({ status: "ok" });
});
