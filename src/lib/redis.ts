import { Redis } from "@upstash/redis";

const redisUrl = process.env.REDIS_URL;
const redisToken = process.env.REDIS_TOKEN;

if (!redisUrl) {
  console.warn("WARNING: REDIS_URL environment variable is missing. Redis operations will fail at runtime.");
}

export const redis = new Redis({
  url: redisUrl || "http://mock-redis-url-for-build-time-purposes",
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
 * Adds a reservation ID to the user's reservation index set.
 */
export async function addReservationToUserIndex(
  userProfileId: string,
  reservationId: string
): Promise<void> {
  try {
    await redis.sadd(`reservations:user:${userProfileId}`, reservationId);
  } catch (error) {
    console.error("Failed to add reservation to user index:", error);
  }
}

/**
 * Removes a reservation ID from the user's reservation index set.
 */
export async function removeReservationFromUserIndex(
  userProfileId: string,
  reservationId: string
): Promise<void> {
  try {
    await redis.srem(`reservations:user:${userProfileId}`, reservationId);
  } catch (error) {
    console.error("Failed to remove reservation from user index:", error);
  }
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
 * Uses per-user Redis Set index for O(M) lookup instead of O(N) keyspace scan.
 */
export async function deleteMatchingReservation(
  userProfileId: string,
  productId: string,
  variantId: string,
  quantity: number
): Promise<void> {
  try {
    const setKey = `reservations:user:${userProfileId}`;
    const reservationIds = await redis.smembers(setKey);

    if (!reservationIds || reservationIds.length === 0) return;

    // Fetch all reservations for this user from the index
    const getPipeline = redis.pipeline();
    reservationIds.forEach((id) => getPipeline.get(`reservation:${id}`));
    const results = await getPipeline.exec();

    // Find the matching reservation
    let matchedId: string | null = null;
    reservationIds.forEach((id, idx) => {
      const val = results[idx];
      if (val && !matchedId) {
        const data = typeof val === "string" ? JSON.parse(val) : val;
        if (
          data &&
          data.userProfileId === userProfileId &&
          data.productId === productId &&
          data.variantId === variantId &&
          data.quantity === quantity
        ) {
          matchedId = id;
        }
      }
    });

    if (matchedId) {
      const deletePipeline = redis.pipeline();
      deletePipeline.del(`reservation:${matchedId}`);
      deletePipeline.srem(setKey, matchedId);
      await deletePipeline.exec();
    }
  } catch (error) {
    console.error("Failed to delete matching reservation from Redis:", error);
  }
}

/**
 * Retrieves all active reservations for a specific userProfileId.
 * Uses a per-user Redis Set index for O(M) lookup instead of O(N) keyspace scan.
 * Falls back to keyspace scan only when the user set is empty (backward compatibility
 * for reservations created before the index was introduced).
 */
export async function getUserReservations(
  userProfileId: string
): Promise<Array<{ id: string } & ReservationData>> {
  const reservations: Array<{ id: string } & ReservationData> = [];
  const setKey = `reservations:user:${userProfileId}`;

  try {
    // 1. Fast path: use per-user index set
    const reservationIds = await redis.smembers(setKey);

    if (reservationIds && reservationIds.length > 0) {
      const pipeline = redis.pipeline();
      reservationIds.forEach((id) => pipeline.get(`reservation:${id}`));
      const results = await pipeline.exec();

      reservationIds.forEach((id, idx) => {
        const val = results[idx];
        if (val) {
          const data = (typeof val === "string" ? JSON.parse(val) : val) as ReservationData;
          if (data && data.userProfileId === userProfileId) {
            reservations.push({ id, ...data });
          }
        }
      });
      return reservations;
    }

    // 2. Fallback: keyspace scan for backward compatibility with
    // reservations created before the user-index was introduced.
    // This path only executes once per user until all old reservations expire.
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
