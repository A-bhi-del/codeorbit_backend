export const calculateConsistencyScore = (activity) => {

  const today = new Date();
  const last30 = new Date();

  last30.setDate(today.getDate() - 30);

  let activeDays = 0;

  activity.forEach((a) => {

    const activityDate = new Date(a.date);

    if (activityDate >= last30 && activityDate <= today) {
      activeDays++;
    }

  });

  // Cap at 30 days max and ensure it doesn't exceed 100%
  const cappedActiveDays = Math.min(activeDays, 30);
  const score = (cappedActiveDays / 30) * 100;

  return Math.round(score);

};