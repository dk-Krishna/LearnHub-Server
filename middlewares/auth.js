import jwt from "jsonwebtoken";
import { cathAsynError } from "./cathAsyncError.js";
import ErrorHandler from "../utils/errorHandler.js";
import { userServices } from "../services/userServices.js";
const { findUser } = userServices;

export const isAuthenticated = cathAsynError(async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) return next(new ErrorHandler("User not logged in..", 401));

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  req.user = await findUser(decoded._id);
  req.userId = decoded._id;

  next();
});

export const authorizedAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return next(
      new ErrorHandler(
        `${req.user.role} is not allowed to access this resource.`
      )
    );
  }

  next();
};

export const authorizedSubscribers = (req, res, next) => {
  if (req.user.subscription.status !== "active" && req.user.role !== "admin") {
    return next(
      new ErrorHandler(`Only subscribers can access this resource.`)
    );
  }

  next();
};
