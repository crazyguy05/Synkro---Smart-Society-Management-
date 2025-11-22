export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';

export async function api(path: string, opts: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : undefined;
  const headers = new Headers(opts.headers as any);
  const isFormData = typeof FormData !== 'undefined' && opts.body instanceof FormData;
  if (!isFormData) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
