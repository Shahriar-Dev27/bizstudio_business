import type { Config } from "@netlify/functions";
import { validWorkerToken } from "../../lib/chat/session";
import { runGenerationJob } from "../../lib/chat/jobs";
const handler = async (request: Request) => {
  if (!validWorkerToken(request.headers.get("authorization")))
    return new Response("Unauthorized", { status: 401 });
  let id: unknown;
  try {
    ({ id } = await request.json());
  } catch {
    return new Response("Invalid request", { status: 400 });
  }
  if (typeof id !== "string" || !/^[a-f0-9-]{36}$/.test(id))
    return new Response("Invalid request", { status: 400 });
  await runGenerationJob(id);
  return new Response(null, { status: 204 });
};
export default handler;
export const config: Config = { background: true };
