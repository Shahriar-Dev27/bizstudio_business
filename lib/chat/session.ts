import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { ChatError } from "./errors";
const developmentSecret = randomBytes(32).toString("hex");
export function sessionSecret() {
  const secret = process.env.ADVISOR_SESSION_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (process.env.NODE_ENV === "production" || process.env.NETLIFY === "true")
    throw new ChatError("not_configured", 503);
  return developmentSecret;
}
const sign = (text: string) =>
  createHmac("sha256", sessionSecret()).update(text).digest("hex");
export function getAnonymousSession(request: Request) {
  const cookie =
    request.headers
      .get("cookie")
      ?.split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("bizguide-session="))
      ?.slice(17) || "";
  const [id, signature] = cookie.split(".");
  if (
    id &&
    /^[a-f0-9-]{36}$/.test(id) &&
    /^[a-f0-9]{64}$/.test(signature || "") &&
    timingSafeEqual(Buffer.from(sign(id)), Buffer.from(signature))
  )
    return { id, cookie: undefined };
  const fresh = crypto.randomUUID();
  return {
    id: fresh,
    cookie: `bizguide-session=${fresh}.${sign(fresh)}; HttpOnly; Path=/; SameSite=Strict; Max-Age=86400${new URL(request.url).protocol === "https:" ? "; Secure" : ""}`,
  };
}
export const hashIp = (request: Request) =>
  sign(
    process.env.NETLIFY === "true"
      ? request.headers.get("x-nf-client-connection-ip") ||
          "unknown-netlify-client"
      : "local-development",
  );
export const workerToken = () => sign("bizguide-background-worker-v1");
export function validWorkerToken(header: string | null) {
  if (!header) return false;
  const actual = Buffer.from(header),
    expected = Buffer.from(`Bearer ${workerToken()}`);
  return (
    actual.byteLength === expected.byteLength &&
    timingSafeEqual(actual, expected)
  );
}
