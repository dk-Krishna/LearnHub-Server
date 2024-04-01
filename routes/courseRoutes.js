import Express from "express";
import {
  getAllCourses,
  createCourse,
  getCourseLectures,
  addCourseLecture,
  deleteCourse,
  deleteLecture,
} from "../controllers/courseController.js";

import singleUpload from "../middlewares/multer.js";
import {
  authorizedAdmin,
  authorizedSubscribers,
  isAuthenticated,
} from "../middlewares/auth.js";

export default Express.Router()

  .get("/getAllCourses", getAllCourses)

  .post(
    "/createCourse",
    isAuthenticated,
    authorizedAdmin,
    singleUpload,
    createCourse
  )

  .get(
    "/getCourseLectures/:courseId",
    isAuthenticated,
    authorizedSubscribers,
    getCourseLectures
  )

  .post(
    "/addCourseLecture/:courseId",
    isAuthenticated,
    authorizedAdmin,
    singleUpload,
    addCourseLecture
  )

  .delete(
    "/deleteCourse/:courseId",
    isAuthenticated,
    authorizedAdmin,
    deleteCourse
  )

  .delete(
    "/deleteLecture/:courseId/:lectureId",
    isAuthenticated,
    authorizedAdmin,
    deleteLecture
  );
