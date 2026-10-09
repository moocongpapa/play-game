export interface SpeechQuota {
  configured: boolean;
  consume: (client: string) => Promise<{ allowed: boolean; retryAfter: number }>;
}

// Reserve all allowances atomically across every deployed server instance.
export const SPEECH_QUOTA_SCRIPT = `
for i, key in ipairs(KEYS) do
  if tonumber(redis.call('GET', key) or '0') >= tonumber(ARGV[i * 2 - 1]) then
    return {0, math.max(1, redis.call('TTL', key))}
  end
end
for i, key in ipairs(KEYS) do
  if redis.call('INCR', key) == 1 then redis.call('EXPIRE', key, tonumber(ARGV[i * 2])) end
end
return {1, 0}`;

const LIMITS = [30, 300, 1200]; // Per IP/minute, per IP/24h, entire app/24h.
const WINDOWS = [60, 86400, 86400];
export const unavailableSpeechQuota: SpeechQuota = {
  configured: false,
  consume: async () => { throw new Error('Speech quota storage is not configured'); },
};

export function createRedisSpeechQuota(url?: string, token?: string): SpeechQuota {
  if (!url || !token) return unavailableSpeechQuota;
  try { if (new URL(url).protocol !== 'https:') return unavailableSpeechQuota; }
  catch { return unavailableSpeechQuota; }
  return {
    configured: true,
    async consume(client) {
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(client));
      const clientHash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
      const keys = [`play-game:speech:minute:${clientHash}`, `play-game:speech:day:${clientHash}`, 'play-game:speech:day:all'];
      const response = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(['EVAL', SPEECH_QUOTA_SCRIPT, keys.length, ...keys, ...LIMITS.flatMap((limit, i) => [limit, WINDOWS[i]])]),
        signal: AbortSignal.timeout(2000),
      });
      if (!response.ok) throw new Error('Speech quota storage unavailable');
      const data = await response.json() as { result?: [number, number]; error?: string };
      if (data.error || !Array.isArray(data.result) || data.result.length !== 2 || ![0, 1].includes(data.result[0]) || !Number.isFinite(data.result[1])) {
        throw new Error('Invalid speech quota response');
      }
      return { allowed: data.result[0] === 1, retryAfter: Math.max(0, Math.ceil(data.result[1])) };
    },
  };
}

/** Local Vite only; deployed serverless instances must use shared counters. */
export function createLocalSpeechQuota(now = Date.now): SpeechQuota {
  const counters = new Map<string, { count: number; expires: number }>();
  return {
    configured: true,
    async consume(client) {
      const time = now();
      for (const [key, value] of counters) if (value.expires <= time) counters.delete(key);
      const keys = [`minute:${client}`, `day:${client}`, 'day:all'];
      for (let i = 0; i < keys.length; i++) {
        const value = counters.get(keys[i]);
        if (value && value.count >= LIMITS[i]) return { allowed: false, retryAfter: Math.ceil((value.expires - time) / 1000) };
      }
      if (counters.size > 2048) return { allowed: false, retryAfter: 60 };
      keys.forEach((key, i) => {
        const value = counters.get(key) || { count: 0, expires: time + WINDOWS[i] * 1000 };
        value.count++;
        counters.set(key, value);
      });
      return { allowed: true, retryAfter: 0 };
    },
  };
}
