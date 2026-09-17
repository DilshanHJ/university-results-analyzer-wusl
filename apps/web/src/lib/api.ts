import axios, { type InternalAxiosRequestConfig } from 'axios';

let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1',
  withCredentials: true,
  timeout: 15_000,
});

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

api.interceptors.response.use(undefined, async (error: unknown) => {
  if (!axios.isAxiosError(error)) return Promise.reject(error);
  const request = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
  if (error.response?.status !== 401 || !request || request._retried || request.url?.includes('/auth/')) {
    return Promise.reject(error);
  }
  request._retried = true;
  refreshPromise ??= api.post<{ accessToken: string }>('/auth/refresh').then(({ data }) => {
    setAccessToken(data.accessToken);
    return data.accessToken;
  }).catch(() => {
    setAccessToken(null);
    return null;
  }).finally(() => { refreshPromise = null; });
  const token = await refreshPromise;
  if (!token) return Promise.reject(error);
  request.headers.Authorization = `Bearer ${token}`;
  return api.request(request);
});

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<{ message?: string }>(error)) return error.response?.data?.message ?? 'The request could not be completed.';
  return error instanceof Error ? error.message : 'Something went wrong.';
}
