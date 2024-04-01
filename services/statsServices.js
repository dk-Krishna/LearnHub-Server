import Stats from "../models/Stats.js";

export const statsServices = {
  createStats: async () => {
    return await Stats.create({});
  },

  findStats: async () => {
    return await Stats.find({}).sort({ createdAt: "desc" }).limit(12);
  },

  findAndDeleteStats: async (paymentId) => {
    return await Stats.findByIdAndDelete(paymentId);
  },
};
