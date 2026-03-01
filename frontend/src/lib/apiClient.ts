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
      ? { body: isFormData ? body : JSON.stringify(body) }
      : {}),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(
      (data as { message?: string; error?: string }).message ??
        (data as { message?: string; error?: string }).error ??
        `Request failed: ${res.status}`,
      res.status,
    );
  }

  // 204/205 have no response body.
  if (res.status === 204 || res.status === 205) {
    return undefined as T;
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return undefined as T;
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
  patch<T>(url: string, body?: unknown, headers?: HeadersInit): Promise<T> {
    return request<T>("PATCH", url, body, headers);
  },
  del<T>(url: string, headers?: HeadersInit): Promise<T> {
    return request<T>("DELETE", url, undefined, headers);
  },
};
