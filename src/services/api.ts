const API_URL = import.meta.env.VITE_API_URL;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const accessToken = localStorage.getItem("accessToken");

  const response = await fetch(`${API_URL}/v1${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers
    }
  });

  if (response.status === 401) {
    // The stored token is missing, expired, or otherwise rejected by the
    // server. Clear it and reload so the app's normal startup check
    // (looking for a token in localStorage) sends the user back to the
    // login screen, instead of surfacing a confusing "failed to load" error
    // on whatever screen happened to trigger the request.
    localStorage.removeItem("accessToken");
    localStorage.removeItem("currentUser");
    window.location.reload();
    throw new ApiError("Session expired", 401);
  }

  if (!response.ok) {
    throw new ApiError(`Request failed: ${response.status}`, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}
