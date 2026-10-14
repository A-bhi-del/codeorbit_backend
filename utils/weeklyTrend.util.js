import { activityByDay, dayKey } from "./dates.util.js";

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Activity for each of the last 7 days (today last). These are the real counts stored for the day
 * (the same numbers the heatmap shows), not an estimate of problems solved.
 */
export const calculateWeeklyTrend = (activity) => {
  const byDay = activityByDay(activity);
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const key = dayKey(-i);
    days.push({ day: dayNames[new Date(`${key}T00:00:00Z`).getUTCDay()], problems: byDay.get(key) || 0 });
  }
  return days;
};
