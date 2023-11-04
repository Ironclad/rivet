export const allowedOrigins = ['tauri://localhost', 'http://localhost:5173'];

export function getPublicAccessControlHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

export function getRestrictedAccessControlHeaders(request: Request) {
  const origin = request.headers.get('origin');
  const allowedOrigin = allowedOrigins.includes(origin!) ? origin : allowedOrigins[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin!,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };
}

export async function OPTIONS(request: Request) {
  const method = request.headers.get('access-control-request-method');

  if (method === 'GET') {
    return new Response(undefined, {
      headers: getPublicAccessControlHeaders(),
    });
  }

  return new Response(undefined, {
    headers: getRestrictedAccessControlHeaders(request),
  });
}
