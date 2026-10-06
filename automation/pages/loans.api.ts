import type { APIRequestContext, APIResponse } from "@playwright/test";

/** Page object for the loans resource. Steps call this instead of building URLs themselves. */
export class LoansApi {
  constructor(private readonly request: APIRequestContext) {}

  list(query = ""): Promise<APIResponse> {
    const suffix = query.length > 0 ? `?${encodeQuery(query)}` : "";
    return this.request.get(`/api/v1/loans${suffix}`);
  }

  getById(id: string | number): Promise<APIResponse> {
    return this.request.get(`/api/v1/loans/${id}`);
  }

  create(body: string): Promise<APIResponse> {
    return this.request.post("/api/v1/loans", {
      headers: { "Content-Type": "application/json" },
      data: body,
    });
  }

  call(method: string, pathname: string, body?: string): Promise<APIResponse> {
    return this.request.fetch(pathname, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      data: body,
    });
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
