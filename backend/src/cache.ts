import { createClient, type RedisClientType } from "redis";
import z from "zod";
import { env } from "@/env";

let _cacheClient: CacheClient | null = null;

export async function getCache() {
  if (_cacheClient != null) return _cacheClient;
  if (env.REDIS_URL) {
    try {
      const cache = createClient({
        url: env.REDIS_URL,
      });
      await cache.connect();
      await cache.ping();

      _cacheClient = new RedisCache(cache as RedisClientType);
      console.log("[Cache] Connected to redis cache. Using redis client");
      return _cacheClient;
    } catch (e) {
      console.error("Failed to connect to redis", e);
      console.warn("Using in memory cache");
    }
  }

  console.log(
    "[Cache] Failed to connect to redis cache. Using in memory cache",
  );

  const inMemory = new InMemory();
  _cacheClient = inMemory;
  return _cacheClient;
}

type CachifyParams<T extends z.ZodType> = {
  key: string;
  fn: () => Promise<z.input<T>>;
  schema: T;
  ttlSeconds?: number;
  validateCache?: (cachedValue: z.output<T>) => boolean;
};

type CachifyResponse<T extends z.ZodType> = {
  data: z.output<T>;
  info: {
    cached: boolean;
    ttl: number | undefined;
  };
};

export interface CacheClient {
  getTTL: (key: string) => Promise<number | undefined>;
  delete: (key: string) => Promise<void>;

  getString: (key: string) => Promise<string | undefined>;
  setString: (key: string, value: string, ttl?: number) => Promise<void>;

  getObject: <T>(key: string) => Promise<T | undefined>;
  setObject: <T>(key: string, value: T, ttl?: number) => Promise<void>;

  cachifyValidate<T extends z.ZodType>(
    params: CachifyParams<T>,
  ): Promise<CachifyResponse<T>>;
}

abstract class BaseCache implements CacheClient {
  abstract getTTL(key: string): Promise<number | undefined>;
  abstract delete(key: string): Promise<void>;
  abstract getString(key: string): Promise<string | undefined>;
  abstract setString(key: string, value: string, ttl?: number): Promise<void>;

  async getObject<T>(key: string): Promise<T | undefined> {
    const value = await this.getString(key);
    if (value == null) return undefined;
    try {
      return JSON.parse(value);
    } catch {
      return undefined;
    }
  }

  async setObject<T>(key: string, value: T, ttl?: number): Promise<void> {
    const jsonString = JSON.stringify(value);
    return await this.setString(key, jsonString, ttl);
  }

  async cachifyValidate<T extends z.ZodType>({
    fn,
    key,
    schema,
    ttlSeconds: ttl,
    validateCache,
  }: CachifyParams<T>): Promise<CachifyResponse<T>> {
    const cacheInfo = {
      cached: false,
      ttl,
    };
    let cachedValue: unknown;
    try {
      cachedValue = await this.getObject<unknown>(key);
      cacheInfo.ttl = await this.getTTL(key);
    } catch (error) {
      console.error(`Failed to retrieve from cache for key: ${key}`, error);
      cachedValue = undefined;
    }
    if (cachedValue != null) {
      cacheInfo.cached = true;
      const result = schema.safeParse(cachedValue);
      if (result.success) {
        if (validateCache == null) {
          return { data: result.data, info: cacheInfo };
        }

        if (validateCache(result.data)) {
          return { data: result.data, info: cacheInfo };
        }
      }
    }
    const value = await fn();
    const result = schema.safeParse(value);
    if (!result.success) {
      throw new Error(
        `Invalid returned value from function: ${result.error.message}`,
      );
    }
    try {
      await this.setObject(key, result.data, ttl);
    } catch (error) {
      console.error(`Failed to cache value for key: ${key}`, error);
    }
    return { data: result.data, info: cacheInfo };
  }
}

class InMemory extends BaseCache {
  #cache: Map<string, { value: string; expires: number }>;
  constructor() {
    super();
    this.#cache = new Map();
  }

  override async getTTL(key: string): Promise<number | undefined> {
    const entry = this.#cache.get(key);
    if (entry == null) return undefined;
    if (entry.expires == -1) return undefined;
    return Math.floor((entry.expires - Date.now()) / 1000);
  }

  override async delete(key: string): Promise<void> {
    this.#cache.delete(key);
  }

  override async getString(key: string): Promise<string | undefined> {
    const entry = this.#cache.get(key);
    if (entry == null) return undefined;
    const now = Date.now();
    if (entry.expires != -1 && entry.expires > now) {
      this.#cache.delete(key);
      return undefined;
    }
    return String(entry.value);
  }

  override async setString(
    key: string,
    value: string,
    ttl?: number,
  ): Promise<void> {
    const now = Date.now();
    this.#cache.set(key, {
      value,
      expires: ttl != null ? now + ttl * 1000 : -1,
    });
  }
}

class RedisCache extends BaseCache {
  #redis: RedisClientType;
  constructor(redis: RedisClientType) {
    super();

    this.#redis = redis;
  }

  async getTTL(key: string) {
    const redis = this.#redis;

    const ttl = await redis.ttl(key);
    if (ttl <= 0) {
      return undefined;
    }
    return ttl;
  }
  async delete(key: string) {
    const redis = this.#redis;
    await redis.del(key);
  }

  async getString(key: string) {
    const redis = this.#redis;
    const value = await redis.get(key);
    if (value == null) {
      return undefined;
    }
    return String(value);
  }

  async setString(key: string, value: string, ttl?: number) {
    const redis = this.#redis;
    if (typeof ttl === "number" && ttl > 0) {
      await redis.setEx(key, ttl, value);
      return;
    }
    await redis.set(key, value);
  }
}
