import Payment from "../models/Payment.js";

export const paymentServices = {
  createPayment: async (insertObj) => {
    return await Payment.create(insertObj);
  },

  findPayment: async (subscriptionId) => {
    return await Payment.findOne({ razorpay_subscription_id: subscriptionId });
  },

  findAndDeletePayment: async (paymentId) => {
    return await Payment.findByIdAndDelete(paymentId);
  },
};
