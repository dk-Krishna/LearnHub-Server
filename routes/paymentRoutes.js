import Express from "express";
import {
  buySubscription,
  cancelSubscription,
  getRazorpayKey,
  paymentVerification,
} from "../controllers/paymentController.js";
import { isAuthenticated } from "../middlewares/auth.js";

export default Express.Router()

  .get("/buySubscription", isAuthenticated, buySubscription)
  .post("/paymentVerification", isAuthenticated, paymentVerification)
  .get("/getRazorpayKey", getRazorpayKey)
  .delete("/cancelSubscription", isAuthenticated, cancelSubscription)
