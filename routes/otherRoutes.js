import Express from "express";
import {
  contact,
  courseRequest,
  getDashboardStats,
} from "../controllers/otherController.js";
import { authorizedAdmin, isAuthenticated } from "../middlewares/auth.js";

export default Express.Router()

  .post("/contact", contact)
  .post("/courseRequest", courseRequest)

  .get(
    "/admin/getDashboardStats",
    isAuthenticated,
    authorizedAdmin,
    getDashboardStats
  )
