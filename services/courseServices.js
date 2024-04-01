import Course from "../models/Course.js";

export const courseServices = {
  findAllCourses: async (keyword, category) => {
    return await Course.find({
      title: {
        $regex: keyword,
        $options: "i",
      },

      category: {
        $regex: category,
        $options: "i",
      },
    }).select("-lectures");
  },

  createACourse: async (insertObj) => {
    return await Course.create(insertObj);
  },

  findCourse: async (courseId) => {
    return await Course.findById(courseId);
  },

  findAndDelete: async (courseId) => {
    return await Course.findByIdAndDelete(courseId);
  },
};
