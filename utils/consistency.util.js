export const calculateConsistencyScore = (activity) => {

  const today = new Date();
  const last30 = new Date();

  last30.setDate(today.getDate() - 30);

  let activeDays = 0;

  activity.forEach((a) => {

    const activityDate = new Date(a.date);

    if (activityDate >= last30) {
      activeDays++;
    }

  });

  const score = (activeDays / 30) * 100;

  return Math.round(score);

};