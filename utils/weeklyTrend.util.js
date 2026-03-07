export const calculateWeeklyTrend = (activity) => {

  const weeks = {
    week1: 0,
    week2: 0,
    week3: 0,
    week4: 0
  };

  const today = new Date();

  activity.forEach((a) => {

    const activityDate = new Date(a.date);

    const diffDays =
      Math.floor((today - activityDate) / (1000 * 60 * 60 * 24));

    if (diffDays <= 7) {
      weeks.week1 += a.count;
    } else if (diffDays <= 14) {
      weeks.week2 += a.count;
    } else if (diffDays <= 21) {
      weeks.week3 += a.count;
    } else if (diffDays <= 30) {
      weeks.week4 += a.count;
    }

  });

  return [
    { week: "Week 1", activity: weeks.week1 },
    { week: "Week 2", activity: weeks.week2 },
    { week: "Week 3", activity: weeks.week3 },
    { week: "Week 4", activity: weeks.week4 }
  ];

};