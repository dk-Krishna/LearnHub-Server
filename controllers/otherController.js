import { cathAsynError } from "../middlewares/cathAsyncError.js";
import ErrorHandler from "../utils/errorHandler.js";
import { sendEmail } from "../utils/sendEmail.js";

import { statsServices } from "../services/statsServices.js";
const { findStats } = statsServices;

export const contact = cathAsynError(async (req, res, next) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return next(new ErrorHandler("Please enter all fields.", 401));
  }

  const to = process.env.MY_EMAIL;
  const subject = "Contact from LearnHub";
  const text = `I am ${name} and my Email is ${email}. \n ${message}`;

  await sendEmail(to, subject, text);

  res.status(200).json({
    success: true,
    message: "Your message has been sent.",
  });
});

export const courseRequest = cathAsynError(async (req, res, next) => {
  const { name, email, course } = req.body;
  if (!name || !email || !course) {
    return next(new ErrorHandler("Please enter all fields.", 401));
  }

  const to = process.env.MY_EMAIL;
  const subject = "Requesting for a course on LearnHub";
  const text = `I am ${name} and my Email is ${email}. \n Course Details: ${course}`;

  await sendEmail(to, subject, text);

  res.status(200).json({
    success: true,
    message: "Your course request has been sent.",
  });
});

export const getDashboardStats = cathAsynError(async (req, res, next) => {
  const stats = await findStats();

  const statsData = [];

  for (let i = 0; i < stats.length; i++) {
    statsData.unshift(stats[i]);
  }

  const requiredSize = 12 - stats.length;

  for (let i = 0; i < requiredSize; i++) {
    statsData.unshift({
      users: 0,
      subscribers: 0,
      views: 0,
    });
  }

  const userCount = statsData[11].users;
  const subscribersCount = statsData[11].users;
  const viewsCount = statsData[11].users;

  let userPercentage = true,
    subscribersPercentage = true,
    viewsPercentage = true;

  let userProfit = true,
    subscribersProfit = true,
    viewsProfit = true;

  if (statsData[10].users === 0) userPercentage = userCount * 100;
  if (statsData[10].users === 0) subscribersPercentage = subscribersCount * 100;
  if (statsData[10].users === 0) viewsPercentage = viewsCount * 100;
  else {
    const difference = {
      users: statsData[11].users - statsData[10].users,
      subscribers: statsData[11].subscribers - statsData[10].subscribers,
      views: statsData[11].views - statsData[10].views,
    };

    userPercentage = (difference.users / statsData[10].users) * 100;
    subscribersPercentage =
      (difference.subscribers / statsData[10].subscribers) * 100;
    viewsPercentage = (difference.views / statsData[10].views) * 100;

    if (userPercentage < 0) userProfit = false;
    if (subscribersPercentage < 0) subscribersProfit = false;
    if (viewsPercentage < 0) viewsProfit = false;
  }

  res.status(200).json({
    success: true,
    stats: statsData,
    userCount,
    subscribersCount,
    viewsCount,
    userPercentage,
    subscribersPercentage,
    viewsPercentage,
    userProfit,
    subscribersProfit,
    viewsProfit,
  });
});
