import { Redis } from "@upstash/redis";

const redisUrl = process.env.REDIS_URL;
const redisToken = process.env.REDIS_TOKEN;

if (!redisUrl) {
  throw new Error("FATAL: REDIS_URL environment variable is missing.");
}

export const redis = new Redis({
  url: redisUrl,
  token: redisToken || "",
});

export interface ReservationData {
  userProfileId: string;
  productId: string;
  variantId: string;
  quantity: number;
  createdAt: string;
}

/**
 * Atomic stock check and reservation Lua script.
 * Scans active reservation keys, sums reserved stock, compares against Postgres stock,
 * and sets the reservation with 900s TTL.
 */
export async function tryReserveStock(
  reservationId: string,
  reservationData: ReservationData,
  stockCount: number
): Promise<{ success: boolean; error?: string }> {
  const script = `
    local variantId = ARGV[1]
    local stockCount = tonumber(ARGV[2])
    local quantity = tonumber(ARGV[3])
    local reservationId = ARGV[4]
    local reservationJson = ARGV[5]
    local ttl = tonumber(ARGV[6])

    local keys = redis.call('keys', 'reservation:*')
    local totalReserved = 0
    for _, key in ipairs(keys) do
        local val = redis.call('get', key)
        if val then
            -- Safely decode JSON
            local success, data = pcall(cjson.decode, val)
            if success and data and data.variantId == variantId then
                totalReserved = totalReserved + (tonumber(data.quantity) or 0)
            end
        end
    end

    local availableStock = stockCount - totalReserved
    if availableStock < quantity then
        return "INSUFFICIENT_STOCK"
    end

    local resKey = 'reservation:' .. reservationId
    redis.call('set', resKey, reservationJson, 'EX', ttl)
    return "OK"
  `;

  try {
    const result = await redis.eval(
      script,
      [],
      [
        reservationData.variantId,
        String(stockCount),
        String(reservationData.quantity),
        reservationId,
        JSON.stringify(reservationData),
        "900", // 15 minutes TTL
      ]
    );

    if (result === "OK") {
      return { success: true };
    } else {
      return { success: false, error: String(result) };
    }
  } catch (error: any) {
    console.error("Redis Lua execution failed:", error);
    throw error;
  }
}

/**
 * Scans and sums reserved stock for a variant to compute current available stock count.
 */
export async function getReservedStock(variantId: string): Promise<number> {
  let totalReserved = 0;
  try {
    const keys = await redis.keys("reservation:*");
    if (keys.length > 0) {
      const pipeline = redis.pipeline();
      keys.forEach((key) => pipeline.get(key));
      const results = await pipeline.exec();

      results.forEach((val: any) => {
        if (val) {
          const data = typeof val === "string" ? JSON.parse(val) : val;
          if (data && data.variantId === variantId) {
            totalReserved += Number(data.quantity) || 0;
          }
        }
      });
    }
  } catch (error) {
    console.error("Failed to fetch reserved stock from Redis:", error);
  }
  return totalReserved;
}

/**
 * Checks and increments rate limit counter. Capped at 20 attempts per 10 minutes.
 */
export async function checkRateLimit(userProfileId: string): Promise<boolean> {
  const key = `rate-limit:cart-reserve:${userProfileId}`;
  const limit = 20;
  const windowSeconds = 600; // 10 minutes

  try {
    const pipeline = redis.pipeline();
    pipeline.incr(key);
    pipeline.ttl(key);
    const [countResult, ttlResult] = await pipeline.exec();

    const count = Number(countResult);
    const ttl = Number(ttlResult);

    if (count === 1 || ttl === -1) {
      await redis.expire(key, windowSeconds);
    }

    return count <= limit;
  } catch (error) {
    console.error("Rate limit check failed:", error);
    return true; // Fail open for user experience if Redis rate limit is down
  }
}

/**
 * Scans active reservations and deletes the one matching the buyer, product, variant and quantity.
 */
export async function deleteMatchingReservation(
  userProfileId: string,
  productId: string,
  variantId: string,
  quantity: number
): Promise<void> {
  try {
    const keys = await redis.keys("reservation:*");
    if (keys.length === 0) return;

    for (const key of keys) {
      const val = await redis.get(key);
      if (val) {
        const data = typeof val === "string" ? JSON.parse(val) : val;
        if (
          data &&
          data.userProfileId === userProfileId &&
          data.productId === productId &&
          data.variantId === variantId &&
          data.quantity === quantity
        ) {
          await redis.del(key);
          console.log(`[Redis] Deleted matched reservation key: ${key}`);
          return;
        }
      }
    }
  } catch (error) {
    console.error("Failed to delete matching reservation from Redis:", error);
  }
}

/**
 * Retrieves all active reservations for a specific userProfileId.
 */
export async function getUserReservations(
  userProfileId: string
): Promise<Array<{ id: string } & ReservationData>> {
  const reservations: Array<{ id: string } & ReservationData> = [];
  try {
    const keys = await redis.keys("reservation:*");
    if (keys.length === 0) return [];

    const pipeline = redis.pipeline();
    keys.forEach((key) => pipeline.get(key));
    const results = await pipeline.exec();

    keys.forEach((key, idx) => {
      const val = results[idx];
      if (val) {
        const data = (typeof val === "string" ? JSON.parse(val) : val) as ReservationData;
        if (data && data.userProfileId === userProfileId) {
          const id = key.replace("reservation:", "");
          reservations.push({ id, ...data });
        }
      }
    });
  } catch (error) {
    console.error("Failed to fetch user reservations:", error);
  }
  return reservations;
}

