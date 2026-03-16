const getApiUrl = () => import.meta.env.VITE_API_URL || 'http://localhost:3002';

export type ApiOptions = RequestInit & {
  token?: string | null;
};

export async function api<T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const { token, ...init } = options;
  const url = `${getApiUrl().replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(url, {
    ...init,
    headers,
    credentials: 'include',
  });
  if (!res.ok) {
    const body = await res.text();
    let message = body;
    try {
      const json = JSON.parse(body);
      message = json.message ?? json.error ?? body;
    } catch {
      // keep message as body
    }
    throw new Error(message || `HTTP ${res.status}`);
  }
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

export { getApiUrl };

export async function apiBlob(
  path: string,
  options: ApiOptions = {},
): Promise<Blob> {
  const { token, ...init } = options;
  const url = `${getApiUrl().replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  const headers: HeadersInit = {
    ...(init.headers as Record<string, string>),
  };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(url, {
    ...init,
    headers,
    credentials: 'include',
  });
  if (!res.ok) {
    const body = await res.text();
    let message = body;
    try {
      const json = JSON.parse(body);
      message = json.message ?? json.error ?? body;
    } catch {
      // keep message as body
    }
    throw new Error(message || `HTTP ${res.status}`);
  }
  return res.blob();
}
