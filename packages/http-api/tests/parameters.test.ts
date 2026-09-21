import { describe, expect, it, vi } from "vitest";
import { SSMClient } from "@aws-sdk/client-ssm";
import { parameterReader } from "../server/lib/parameters.ts";

describe("SSM initialization", () => {
  it("shares in-flight reads, decrypts secrets, and retries failures", async () => {
    const client = new SSMClient({ region: "ap-northeast-1" });
    const send = vi
      .fn()
      .mockRejectedValueOnce(new Error("temporary"))
      .mockResolvedValue({ Parameter: { Value: "value" } });
    vi.spyOn(client, "send").mockImplementation(send);
    const read = parameterReader(client);
    await expect(read("/dev/test")).rejects.toThrow("temporary");
    expect(await Promise.all([read("/dev/test"), read("/dev/test")])).toEqual([
      "value",
      "value",
    ]);
    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[1][0].input).toMatchObject({
      Name: "/dev/test",
      WithDecryption: true,
    });
  });
});
