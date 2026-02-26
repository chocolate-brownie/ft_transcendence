// Thin fetch wrapper — reads JWT from localStorage and attaches it automatically.
// Throws ApiError (with .status) on non-ok responses.

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Send an HTTP request with automatic JSON/FormData handling and optional bearer authentication.
 *
 * Reads a JWT from localStorage key "token" and, if present, adds an `Authorization: Bearer <token>` header.
 * When `body` is provided and is a `FormData` instance it is sent as-is (no `Content-Type` header is set);
 * otherwise the `body` is JSON-stringified and `Content-Type: application/json` is added.
 * Additional headers passed via `headers` are merged into the request headers.
 *
 * @param body - Optional request payload. If a `FormData` instance, it will be sent directly; otherwise it will be JSON-stringified.
 * @param headers - Optional additional headers to include in the request.
 * @returns The response body parsed as JSON, typed as `T`.
 * @throws {ApiError} When the response has a non-OK status; the error's message is the parsed response `message` if present, otherwise `Request failed: <status>`, and the error contains the HTTP status.
 */
async function request<T>(
  method: string,
  url: string,
  body?: unknown,
  headers?: HeadersInit,
): Promise<T> {
  const token = localStorage.getItem("token");
  const hasBody = body !== undefined;

  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;

  const res = await fetch(url, {
    method,
    headers: {
      ...(hasBody && !isFormData ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(hasBody
      ? { body: isFormData ? (body) : JSON.stringify(body) }
      : {}),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(
      (data as { message?: string }).message ?? `Request failed: ${res.status}`,
      res.status,
    );
  }

  return res.json() as Promise<T>;
}

export const apiClient = {
  get<T>(url: string, headers?: HeadersInit): Promise<T> {
    return request<T>("GET", url, undefined, headers);
  },
  post<T>(url: string, body: unknown, headers?: HeadersInit): Promise<T> {
    return request<T>("POST", url, body, headers);
  },
  put<T>(url: string, body: unknown, headers?: HeadersInit): Promise<T> {
    return request<T>("PUT", url, body, headers);
  },
  del<T>(url: string, headers?: HeadersInit): Promise<T> {
    return request<T>("DELETE", url, undefined, headers);
  },
};
