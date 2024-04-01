import mongoose, { isObjectIdOrHexString } from "mongoose";

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please enter course title"],
    minLength: [4, "Title must be at least 4 characters"],
    maxLength: [80, "Title can exceed 80 characters"],
  },

  description: {
    type: String,
    required: [true, "Please enter course title"],
    minLength: [20, "Description must be at least 20 characters"],
  },

  lectures: [
    {
      title: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
      video: {
        public_id: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
      },
    },
  ],

  poster: {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },

  views: {
    type: Number,
    default: 0,
  },

  numOfVideos: {
    type: Number,
    default: 0,
  },

  category: {
    type: String,
    required: true,
  },

  createdBy: {
    type: String,
    required: [true, "Please enter course creator name"], 
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Course = new mongoose.model("Course", courseSchema);

export default Course;
