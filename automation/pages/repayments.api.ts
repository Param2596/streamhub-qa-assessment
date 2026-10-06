import type { APIRequestContext, APIResponse } from "@playwright/test";

/** Page object for the repayments resource. */
export class RepaymentsApi {
  constructor(private readonly request: APIRequestContext) {}

  list(query = ""): Promise<APIResponse> {
    const suffix = query.length > 0 ? `?${encodeQuery(query)}` : "";
    return this.request.get(`/api/v1/repayments${suffix}`);
  }
}

function encodeQuery(query: string): string {
  const params = new URLSearchParams();
  for (const part of query.split("&")) {
    if (part.length === 0) {
      continue;
    }
    const separator = part.indexOf("=");
    const key = separator === -1 ? part : part.slice(0, separator);
    const value = separator === -1 ? "" : part.slice(separator + 1);
    params.append(key, value);
  }
  return params.toString();
}
