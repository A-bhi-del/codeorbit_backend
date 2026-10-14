import { activityByDay, dayKey, dayNum } from "./dates.util.js";

/** Share of the last 30 days (today and the 29 before) that had any activity, as a whole percentage. */
export const calculateConsistencyScore = (activity) => {
  const first = dayNum(dayKey(-29));
  const last = dayNum(dayKey(0));

  let activeDays = 0;
  activityByDay(activity).forEach((count, key) => {
    const n = dayNum(key);
    if (count > 0 && n >= first && n <= last) activeDays++;
  });

  return Math.round((activeDays / 30) * 100);
};
