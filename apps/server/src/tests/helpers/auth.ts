const ROOT = `http://localhost:${process.env.PORT ?? 3001}/api/v1`;
const AUTH_BASE = `${ROOT}/auth`;

export const PASSWORD = "12345678";

export type JsonBody = Record<string, unknown>;

function extractCookie(headers: Headers): string | undefined {
  return headers.get("set-cookie") ?? undefined;
}

export async function signIn(email: string, password: string = PASSWORD) {
  const res = await fetch(`${AUTH_BASE}/sign-in/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return {
    status: res.status,
    cookie: extractCookie(res.headers),
    body: (await res.json()) as JsonBody,
  };
}

export async function loginAs(email: string) {
  const { cookie, status, body } = await signIn(email);
  if (status !== 200 || !cookie) {
    throw new Error(
      `Login failed for ${email}: ${status} ${JSON.stringify(body)}`,
    );
  }
  return { cookie, email };
}

export async function apiPost(path: string, body: object, cookie?: string) {
  const res = await fetch(`${ROOT}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: (await res.json()) as JsonBody };
}

export async function apiGet(path: string, cookie?: string) {
  const res = await fetch(`${ROOT}${path}`, {
    headers: cookie ? { Cookie: cookie } : {},
  });
  return { status: res.status, body: (await res.json()) as JsonBody };
}

export async function apiPatch(path: string, cookie?: string) {
  const res = await fetch(`${ROOT}${path}`, {
    method: "PATCH",
    headers: cookie ? { Cookie: cookie } : {},
  });
  return { status: res.status, body: (await res.json()) as JsonBody };
}
