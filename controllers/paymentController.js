import { cathAsynError } from "../middlewares/cathAsyncError.js";
import { userServices } from "../services/userServices.js";
import { paymentServices } from "../services/paymentServices.js";
import ErrorHandler from "../utils/errorHandler.js";
import crypto from "crypto";

import { instance } from "../server.js";

const { createPayment, findPayment, findAndDeletePayment } = paymentServices;
const { findUser } = userServices;

export const buySubscription = cathAsynError(async (req, res, next) => {
  const user = await findUser(req.userId);
  if (!user) {
    return next(new ErrorHandler("Login first...", 401));
  }

  if (user.role === "admin") {
    return next(new ErrorHandler("Admin can't buy subscription.", 400));
  }

  const plan_id = process.env.PLAN_ID;
  const subscription = await instance.subscriptions.create({
    plan_id,
    customer_notify: 1,
    total_count: 12,
  });

  user.subscription.id = subscription.id;
  user.subscription.status = subscription.status;
  await user.save();

  return res.status(201).json({
    success: true,
    subscriptionId: subscription.id,
  });
});

export const paymentVerification = cathAsynError(async (req, res, next) => {
  const { razorpay_payment_id, razorpay_signature, razorpay_subscription_id } =
    req.body;

  const user = await findUser(req.userId);
  if (!user) {
    return next(new ErrorHandler("Login first...", 401));
  }

  const subscription_id = user.subscription.id;
  const generated_signature = crypto
    .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
    .update(razorpay_payment_id + "|" + subscription_id, "utf-8")
    .digest("hex");

  const isAuthentic = generated_signature === razorpay_signature;
  if (!isAuthentic) {
    return res.redirect(`${process.env.FRONTEND_URL}/paymentfail`);
  }

  //Database comes here
  await createPayment({
    razorpay_payment_id,
    razorpay_signature,
    razorpay_subscription_id,
  });

  user.subscription.status = "active";
  await user.save();

  return res.redirect(
    `${process.env.FRONTEND_URL}/paymentsuccess?reference=${razorpay_payment_id}`
  );
});

export const getRazorpayKey = cathAsynError((req, res, next) => {
  res.status(200).json({
    success: true,
    key: process.env.RAZORPAY_API_KEY,
  });
});

export const cancelSubscription = cathAsynError(async (req, res, next) => {
  const user = await findUser(req.userId);
  if (!user) {
    return next(new ErrorHandler("Login first...", 401));
  }

  const subscriptionId = user.subscription.id;
  let refund = false;

  const subscription = await instance.subscriptions.cancel(subscriptionId);
  if (!subscription) {
    return next(new ErrorHandler("Subscription already canceled.", 200));
  }

  const payment = await findPayment(subscriptionId);
  if (!payment) {
    return next(new ErrorHandler("Payment not found.", 401));
  }

  const gap = Date.now() - payment.createdAt;
  const refundTime = process.env.REFUND_DAYS * 24 * 60 * 60 * 1000;

  if (gap < refundTime) {
    await instance.payments.refund(payment.razorpay_payment_id);
    refund = true;
  }

  await findAndDeletePayment(payment._id);
  user.subscription.id = undefined;
  user.subscription.status = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    refund: refund
      ? "You will receive full refund within 7 days."
      : "Refund Unsuccessful cause 7 day's refund policy exceeded",
    message: "Subscription cancelled successfully.",
  });
});
