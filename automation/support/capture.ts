import type { APIResponse } from "@playwright/test";
import type { ApiResult } from "./types";

export async function capture(response: APIResponse, result: ApiResult): Promise<void> {
  result.status = response.status();
  result.contentType = response.headers()["content-type"] ?? "";
  const text = await response.text();
  result.body = text.length > 0 ? (JSON.parse(text) as unknown) : null;
}
