import { ChatError } from "./errors";
export interface KeyValueStore {
  command<T = unknown>(args: (string | number)[]): Promise<T>;
}
export function redisStore(): KeyValueStore {
  const url = process.env.UPSTASH_REDIS_REST_URL,
    token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token || !url.startsWith("https://"))
    throw new ChatError("not_configured", 503);
  return {
    async command<T>(args: (string | number)[]): Promise<T> {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(args),
          signal: AbortSignal.timeout(8000),
          cache: "no-store",
        });
        if (!response.ok) throw Error();
        const result = (await response.json()) as { result: T; error?: string };
        if (result.error) throw Error();
        return result.result;
      } catch {
        throw new ChatError("not_configured", 503);
      }
    },
  };
}
