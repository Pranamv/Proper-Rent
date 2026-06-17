import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, apiFetch, publicApi } from "@/lib/api/client";

describe("apiFetch", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends JSON requests with no-store caching by default", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: "ok", version: "0.1.0" }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await publicApi.health();

    expect(result).toEqual({ status: "ok", version: "0.1.0" });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/health$/),
      expect.objectContaining({
        cache: "no-store",
        headers: expect.objectContaining({ Accept: "application/json" }),
        method: "GET",
      }),
    );
  });

  it("throws ApiError with parsed response bodies for non-2xx responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ detail: "Too many requests" }), {
          headers: { "Content-Type": "application/json" },
          status: 429,
        }),
      ),
    );

    await expect(apiFetch("/chat", { body: { message: "hello" } })).rejects.toMatchObject({
      body: { detail: "Too many requests" },
      status: 429,
    } satisfies Partial<ApiError>);
  });
});
