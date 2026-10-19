import { ChatError } from "./errors";
import { redisStore, type KeyValueStore } from "./redis";
type Input = {
  sessionId: string;
  ipKey: string;
  attemptId: string;
  maxOutputTokens: number;
};
type Result = { outcome: string; generatedTokens?: number };
export interface AdmissionStore {
  reserve(input: Input): Promise<string>;
  settle(id: string, result: Result): Promise<void>;
}
export class MemoryAdmissionStore implements AdmissionStore {
  private counters = new Map<string, number>();
  private reservations = new Map<
    string,
    { input: Input; expires: number; day: string }
  >();
  async reserve(input: Input) {
    const now = Date.now(),
      day = new Date(now).toISOString().slice(0, 10),
      minute = Math.floor(now / 60000);
    for (const [id, r] of this.reservations)
      if (r.expires <= now) this.reservations.delete(id);
    const active = [...this.reservations.values()];
    if (
      active.length >= 10 ||
      active.some((r) => r.input.sessionId === input.sessionId)
    )
      throw new ChatError("rate_limited", 429, 30);
    const keys = [
      `s:${minute}:${input.sessionId}`,
      `d:${day}:${input.sessionId}`,
      `ip:${minute}:${input.ipKey}`,
    ];
    if (keys.some((k, i) => (this.counters.get(k) || 0) >= [10, 100, 30][i]))
      throw new ChatError("rate_limited", 429, 60);
    const usage = `tokens:${day}`;
    if ((this.counters.get(usage) || 0) + input.maxOutputTokens > 100000)
      throw new ChatError("budget_exhausted", 429, 60);
    keys.forEach((k) => this.counters.set(k, (this.counters.get(k) || 0) + 1));
    this.counters.set(
      usage,
      (this.counters.get(usage) || 0) + input.maxOutputTokens,
    );
    const id = crypto.randomUUID();
    this.reservations.set(id, { input, expires: now + 900000, day });
    return id;
  }
  async settle(id: string, result: Result) {
    const record = this.reservations.get(id);
    if (!record) return;
    this.reservations.delete(id);
    if (
      typeof result.generatedTokens === "number" &&
      Number.isFinite(result.generatedTokens) &&
      result.generatedTokens >= 0
    ) {
      const key = `tokens:${record.day}`;
      this.counters.set(
        key,
        Math.max(
          0,
          (this.counters.get(key) || 0) -
            record.input.maxOutputTokens +
            result.generatedTokens,
        ),
      );
    }
  }
}
// All keys share a Redis Cluster hash tag; quota checks, counters and leases are one atomic script.
const RESERVE = `
local now=tonumber(ARGV[1]); local lease=tonumber(ARGV[2]); local id=ARGV[3]; local tokens=tonumber(ARGV[4]);
redis.call('ZREMRANGEBYSCORE',KEYS[1],'-inf',now); redis.call('ZREMRANGEBYSCORE',KEYS[2],'-inf',now);
if redis.call('ZCARD',KEYS[1])>=10 or redis.call('ZCARD',KEYS[2])>=1 then return 'rate_limited' end
if tonumber(redis.call('GET',KEYS[3]) or '0')>=10 or tonumber(redis.call('GET',KEYS[4]) or '0')>=100 or tonumber(redis.call('GET',KEYS[5]) or '0')>=30 then return 'rate_limited' end
if tonumber(redis.call('GET',KEYS[6]) or '0')+tokens>100000 then return 'budget_exhausted' end
for i=3,5 do redis.call('INCR',KEYS[i]);redis.call('EXPIRE',KEYS[i],i==4 and 172800 or 120) end
redis.call('INCRBY',KEYS[6],tokens);redis.call('EXPIRE',KEYS[6],172800);
redis.call('ZADD',KEYS[1],now+lease,id);redis.call('ZADD',KEYS[2],now+lease,id);
redis.call('EXPIRE',KEYS[1],1800);redis.call('EXPIRE',KEYS[2],1800);
redis.call('HSET',KEYS[7],'tokens',tokens,'usage',KEYS[6],'session',KEYS[2]);redis.call('EXPIRE',KEYS[7],172800);return id`;
const SETTLE = `
local tokens=redis.call('HGET',KEYS[1],'tokens');if not tokens then return 0 end
local usage=redis.call('HGET',KEYS[1],'usage');local session=redis.call('HGET',KEYS[1],'session');
redis.call('ZREM',KEYS[2],ARGV[1]);redis.call('ZREM',session,ARGV[1]);
if tonumber(ARGV[2])>=0 then redis.call('INCRBY',usage,tonumber(ARGV[2])-tonumber(tokens)) end
redis.call('DEL',KEYS[1]);return 1`;
export class RedisAdmissionStore implements AdmissionStore {
  constructor(private store: KeyValueStore = redisStore()) {}
  async reserve(input: Input) {
    const now = Date.now(),
      day = new Date(now).toISOString().slice(0, 10),
      minute = Math.floor(now / 60000),
      id = crypto.randomUUID(),
      p = "{bizguide}:";
    const keys = [
      `${p}active`,
      `${p}active:${input.sessionId}`,
      `${p}minute:${minute}:${input.sessionId}`,
      `${p}daily:${day}:${input.sessionId}`,
      `${p}ip:${minute}:${input.ipKey}`,
      `${p}tokens:${day}`,
      `${p}reservation:${id}`,
    ];
    const result = await this.store.command<string>([
      "EVAL",
      RESERVE,
      keys.length,
      ...keys,
      now,
      900000,
      id,
      input.maxOutputTokens,
    ]);
    if (result === "rate_limited" || result === "budget_exhausted")
      throw new ChatError(result, 429, 60);
    if (result !== id) throw new ChatError("not_configured", 503);
    return id;
  }
  async settle(id: string, result: Result) {
    await this.store.command([
      "EVAL",
      SETTLE,
      2,
      `{bizguide}:reservation:${id}`,
      "{bizguide}:active",
      id,
      typeof result.generatedTokens === "number" &&
      Number.isFinite(result.generatedTokens)
        ? Math.max(0, Math.ceil(result.generatedTokens))
        : -1,
    ]);
  }
}
const developmentStore = new MemoryAdmissionStore();
function activeStore() {
  return process.env.NODE_ENV === "production" || process.env.NETLIFY === "true"
    ? new RedisAdmissionStore()
    : developmentStore;
}
export function reserveGeneration(
  input: Input,
  store: AdmissionStore = activeStore(),
) {
  if (process.env.ADVISOR_DISABLED === "true")
    throw new ChatError("not_configured", 503);
  return store.reserve(input);
}
export function settleGeneration(
  id: string,
  result: Result,
  store: AdmissionStore = activeStore(),
) {
  return store.settle(id, result);
}
