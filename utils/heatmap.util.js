import { activityByDay, dayKey } from "./dates.util.js";

/** One entry per day for the last 12 months, zero-filled. */
export const generateHeatmapData = (activity) => {
  const byDay = activityByDay(activity);
  const result = [];
  for (let i = 364; i >= 0; i--) {
    const date = dayKey(-i);
    result.push({ date, count: byDay.get(date) || 0 });
  }
  return result;
};
