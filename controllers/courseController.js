import { cathAsynError } from "../middlewares/cathAsyncError.js";
import ErrorHandler from "../utils/errorHandler.js";
import cloudinary from "cloudinary";
import { courseServices } from "../services/courseServices.js";
const { findAllCourses, createACourse, findCourse, findAndDelete } =
  courseServices;
import getDataUri from "../utils/dataUri.js";
import Course from "../models/Course.js";
import Stats from "../models/Stats.js";

export const getAllCourses = cathAsynError(async (req, res, next) => {
  const keyword = req.query.keyword || "";
  const category = req.query.category || "";

  const courses = await findAllCourses(keyword, category);

  return res.status(200).json({
    success: true,
    courses,
  });
});

export const createCourse = cathAsynError(async (req, res, next) => {
  const { title, description, category, createdBy } = req.body;

  if (!title || !description || !category || !createdBy) {
    return next(new ErrorHandler("Please enter all fields", 400));
  }

  const file = req.file;
  const fileUri = getDataUri(file);

  const myCloud = await cloudinary.v2.uploader.upload(fileUri.content);

  const newCourse = await createACourse({
    title,
    description,
    category,
    createdBy,
    poster: {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    },
  });

  return res.status(201).json({
    success: true,
    newCourse,
    message: "New course created successfully. You can add lectures now.",
  });
});

export const getCourseLectures = cathAsynError(async (req, res, next) => {
  const course = await findCourse(req.params.courseId);
  if (!course) {
    return next(new ErrorHandler("Course not found.", 404));
  }

  course.views += 1;
  await course.save();

  return res.status(200).json({
    success: true,
    lectures: course.lectures,
  });
});

export const addCourseLecture = cathAsynError(async (req, res, next) => {
  const { title, description } = req.body;

  const course = await findCourse(req.params.courseId);
  if (!course) {
    return next(new ErrorHandler("Course not found.", 404));
  }

  // Upload files on cloudinary
  const file = req.file;
  const fileUri = getDataUri(file);

  const myCloud = await cloudinary.v2.uploader.upload(fileUri.content, {
    resource_type: "video",
  });

  course.lectures.push({
    title,
    description,
    video: {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    },
  });

  course.numOfVideos = course.lectures.length;

  await course.save();

  return res.status(200).json({
    success: true,
    message: "Lecture added successfully.",
  });
});

export const deleteCourse = cathAsynError(async (req, res, next) => {
  const course = await findCourse(req.params.courseId);
  if (!course) {
    return next(new ErrorHandler("Course not found.", 404));
  }

  // Delete files from cloudinary
  await cloudinary.v2.uploader.destroy(course.poster.public_id);
  for (let i = 0; i < course.lectures.length; i++) {
    const singleLecture = course.lectures[i];
    await cloudinary.v2.uploader.destroy(singleLecture.video.public_id, {
      resource_type: "video",
    });
  }

  await findAndDelete(req.params.courseId);

  return res.status(200).json({
    success: true,
    message: "Course deleted by admin.",
  });
});

export const deleteLecture = cathAsynError(async (req, res, next) => {
  const course = await findCourse(req.params.courseId);
  if (!course) {
    return next(new ErrorHandler("Course not found.", 404));
  }

  const lecture = course.lectures.find((item) => {
    if (item._id.toString() === req.params.lectureId.toString()) return item;
  });

  if (!lecture) {
    return next(new ErrorHandler("Lecture not found.", 404));
  }

  await cloudinary.v2.uploader.destroy(lecture.video.public_id, {
    resource_type: "video",
  });

  course.lectures = course.lectures.filter((item) => {
    if (item._id.toString() !== req.params.lectureId.toString()) return item;
  });

  course.numOfVideos = course.lectures.length;

  await course.save();

  return res.status(200).json({
    success: true,
    message: "Lecture deleted by admin.",
  });
});

Course.watch().on("change", async () => {
  const stats = await Stats.find({}).sort({ createdAt: "desc" }).limit(1);

  const courses = Course.find({});

  let totalViews = 0;

  for (let i = 0; i < courses.length; i++) {
    totalViews += courses[i].views;
  }

  stats[0].views = totalViews;
  stats[0].createdAt = new Date(Date.now());

  await stats[0].save();
});
