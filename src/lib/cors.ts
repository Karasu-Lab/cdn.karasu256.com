import allowedOrigins from '../allowed-origins.json';

export function isAllowedOrigin(request: Request): boolean {
  const requestOrigin = request.headers.get('Origin');
  if (!requestOrigin) return false;

  try {
    const hostname = new URL(requestOrigin).hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
  } catch {
    return false;
  }

  return allowedOrigins.includes(requestOrigin);
}

export function publicOrigin(request: Request): string | null {
  const requestOrigin = request.headers.get('Origin');
  if (!requestOrigin) return null;

  try {
    const hostname = new URL(requestOrigin).hostname;
    return hostname === 'karasu256.com' || hostname.endsWith('.karasu256.com') ? requestOrigin : null;
  } catch {
    return null;
  }
}
