import { Hono } from "hono";
import type { CacheClient } from "./cache";
import { UTCDate } from "@date-fns/utc";
import {
  addDays,
  eachDayOfInterval,
  endOfYear,
  getYear,
  isAfter,
  startOfYear,
} from "date-fns";

export type AppContext = {
  cache: CacheClient;
};

export function createRoute() {
  return new Hono<{
    Variables: AppContext;
  }>();
}

export function getRangesForYear(
  year: number,
  options: { step?: number } = {},
) {
  const { step = 80 } = options;
  const utcDate = new UTCDate(year, 0, 1);

  const startYear = startOfYear(utcDate);
  const endYear = endOfYear(utcDate);

  const ranges = eachDayOfInterval(
    { start: startYear, end: endYear },
    { step: step },
  ).map((v) => ({
    start: v,
    end: isAfter(addDays(v, step), endYear) ? endYear : addDays(v, step),
  }));

  return ranges;
}

export function getRelevantRangesForRange(
  range: {
    start: UTCDate;
    end: UTCDate;
  },
  options: { step?: number } = {},
) {
  const cacheKeys = [];

  const startYear = getYear(range.start);
  const endYear = getYear(range.end);

  for (let year = startYear; year <= endYear; year++) {
    cacheKeys.push(...getRangesForYear(year, options));
  }

  return cacheKeys.filter((cacheKey) => {
    // Overlap exists if: cacheStart <= requestEnd AND cacheEnd >= requestStart
    return (
      !isAfter(cacheKey.start, range.end) && !isAfter(range.start, cacheKey.end)
    );
  });
}
