import { cathAsynError } from "../middlewares/cathAsyncError.js";
import ErrorHandler from "../utils/errorHandler.js";
import crypto from "crypto";
import { userServices } from "../services/userServices.js";
import { courseServices } from "../services/courseServices.js";
import { sendToken } from "../utils/sendToken.js";
import { sendEmail } from "../utils/sendEmail.js";
import cloudinary from "cloudinary";
import getDataUri from "../utils/dataUri.js";
import User from "../models/User.js";
import Stats from "../models/Stats.js";
const {
  createUser,
  checkUserExists,
  findUser,
  checkUserExistsWithResetToken,
  fetchAllUsers,
  findAndDelete,
  deleteMe,
} = userServices;

const { findCourse } = courseServices;

export const signup = cathAsynError(async (req, res, next) => {
  const { name, email, password } = req.body;
  const file = req.file;

  if (!name || !email || !password || !file) {
    return next(new ErrorHandler("Please enter all fields", 400));
  }

  const user = await checkUserExists(email);
  if (user) {
    return next(
      new ErrorHandler("User already exists with this email address", 400)
    );
  }

  // Upload file on cloudinary
  const fileUri = getDataUri(file);
  const myCloud = await cloudinary.v2.uploader.upload(fileUri.content);

  const newUser = await createUser({
    name,
    email,
    password,
    avatar: {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    },
  });

  sendToken(res, newUser, "Registered Successfully.", 200);
});

export const login = cathAsynError(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("Please enter all fields", 400));
  }

  const user = await checkUserExists(email);
  if (!user) {
    return next(new ErrorHandler("User dosen't exist.", 401));
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return next(new ErrorHandler("Incorrect email or password.", 401));
  }

  sendToken(res, user, `${user.name}, Logged In Successfully.`, 200);
});

export const logout = cathAsynError(async (req, res, next) => {
  return res
    .status(200)
    .cookie("token", null, {
      expires: new Date(Date.now()),
      secure: process.env.NODE_ENV === "Development" ? false : true,
      sameSite: process.env.NODE_ENV === "Development" ? "lax" : "none",
    })
    .json({
      success: true,
      message: "Logged Out Successfully.",
    });
});

export const getMyProfile = cathAsynError(async (req, res, next) => {
  const user = await findUser(req.userId);
  if (!user) {
    return next(new ErrorHandler("User dosen't exist.", 401));
  }

  return res.status(200).json({
    success: true,
    user,
  });
});

export const deleteMyProfile = cathAsynError(async (req, res, next) => {
  const user = await findUser(req.userId);
  if (!user) {
    return next(new ErrorHandler("Login first...", 401));
  }

  await cloudinary.v2.uploader.destroy(user.avatar.public_id);

  // Cancel Subscription

  await deleteMe(user._id);

  return res
    .status(200)
    .cookie("token", null, {
      expires: new Date(Date.now()),
    })
    .json({
      success: true,
      message: `Your profile deleted successfully.`,
    });
});

export const changePassword = cathAsynError(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return next(new ErrorHandler("Please enter all fields", 401));
  }

  const user = await findUser(req.userId);
  if (!user) {
    return next(new ErrorHandler("Login first...", 401));
  }

  const isMatch = await user.comparePassword(oldPassword);
  if (!isMatch) {
    return next(new ErrorHandler("Incorrect old password.", 401));
  }

  user.password = newPassword;
  user.save();

  return res.status(200).json({
    success: true,
    message: "Password changed successfully.",
  });
});

export const updateProfile = cathAsynError(async (req, res, next) => {
  const { name, email } = req.body;

  const user = await findUser(req.userId);
  if (!user) {
    return next(new ErrorHandler("Login first...", 401));
  }

  if (name) user.name = name;
  if (email) user.email = email;

  user.save();

  return res.status(200).json({
    success: true,
    message: "Profile updated successfully.",
    user,
  });
});

export const updateProfilePicture = cathAsynError(async (req, res, next) => {
  // CLOUDINARY
  const user = await findUser(req.userId);
  if (!user) {
    return next(new ErrorHandler("Login first...", 401));
  }

  await cloudinary.v2.uploader.destroy(user.avatar.public_id);

  const file = req.file;
  const fileUri = getDataUri(file);

  const myCloud = await cloudinary.v2.uploader.upload(fileUri.content);

  user.avatar.public_id = myCloud.public_id;
  user.avatar.url = myCloud.secure_url;
  user.save();

  return res.status(200).json({
    success: true,
    message: "Profile picture updated successfully.",
  });
});

export const forgetPassword = cathAsynError(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(
      new ErrorHandler("Please enter email to forget password.", 401)
    );
  }

  const user = await checkUserExists(email);
  if (!user) {
    return next(new ErrorHandler("User dosen't exist.", 401));
  }

  const resetToken = await user.getResetToken();
  user.resetPasswordToken = resetToken;
  await user.save();

  // send token via email
  const url = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;
  const message = `Click on the link to reset your password. ${url}. If you have not requested please ignore.`;
  await sendEmail(user.email, "LearnHub Reset Password", message);

  return res.status(200).json({
    success: true,
    message: `Reset token has been sent to ${user.email}`,
  });
});

export const resetPassword = cathAsynError(async (req, res, next) => {
  const { token } = req.params;

  // const resetPasswordToken = crypto
  //   .createHash("sha256")
  //   .update(token)
  //   .digest("hex");

  const user = await checkUserExistsWithResetToken(token);
  if (!user) {
    return next(new ErrorHandler("Token is invalid or has been expired.", 401));
  }

  user.password = req.body.newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  return res.status(200).json({
    success: true,
    message: "Profile password changed successfully.",
  });
});

export const addToPlaylist = cathAsynError(async (req, res, next) => {
  const user = await findUser(req.userId);
  if (!user) {
    return next(new ErrorHandler("Login first...", 401));
  }

  const course = await findCourse(req.body.courseId);
  if (!course) {
    return next(new ErrorHandler("Course not found.", 401));
  }

  const itemExists = user.playlist.find((item) => {
    if (item.course.toString() === course._id.toString()) {
      return true;
    }
  });

  if (itemExists) {
    return next(new ErrorHandler("Item already exist.", 409));
  }

  user.playlist.push({
    course: course._id,
    poster: course.poster.url,
  });

  await user.save();

  return res.status(200).json({
    success: true,
    course,
    message: "Added to playlist.",
  });
});

export const removeFromPlaylist = cathAsynError(async (req, res, next) => {
  const user = await findUser(req.userId);
  if (!user) {
    return next(new ErrorHandler("Login first...", 401));
  }

  const course = await findCourse(req.query.courseId);
  if (!course) {
    return next(new ErrorHandler("Course not found.", 401));
  }

  const newPlaylist = user.playlist.filter((item) => {
    if (item.course.toString() !== course._id.toString()) {
      return true;
    }
  });

  user.playlist = newPlaylist;
  await user.save();

  return res.status(200).json({
    success: true,
    course,
    message: "Removed from playlist.",
  });
});

// ADMIN CONTROLLER
export const getAllUsers = cathAsynError(async (req, res, next) => {
  const user = await findUser(req.userId);
  if (!user) {
    return next(new ErrorHandler("Login first...", 401));
  }

  const users = await fetchAllUsers();
  if (!users || users.length == 0) {
    return next(new ErrorHandler("Users not found.", 401));
  }

  return res.status(200).json({
    success: true,
    users,
  });
});

export const updateUserRole = cathAsynError(async (req, res, next) => {
  const user = await findUser(req.userId);
  if (!user) {
    return next(new ErrorHandler("Login first...", 401));
  }

  const newUser = await findUser(req.params.userId);
  if (!newUser) {
    return next(new ErrorHandler("User not found.", 401));
  }

  if (user._id.toString() === newUser._id.toString()) {
    return next(new ErrorHandler("You can't change your own role.", 401));
  }

  if (newUser.role === "admin") {
    newUser.role = "user";
  } else {
    newUser.role = "admin";
  }

  await newUser.save();

  return res.status(200).json({
    success: true,
    message: `${newUser.name}'s role changed to ${newUser.role} successfully.`,
  });
});

export const deleteUser = cathAsynError(async (req, res, next) => {
  const user = await findUser(req.userId);
  if (!user) {
    return next(new ErrorHandler("Login first...", 401));
  }

  if (user._id.toString() === req.params.userId.toString()) {
    return next(new ErrorHandler("You can't delete yourself.", 401));
  }

  await cloudinary.v2.uploader.destroy(user.avatar.public_id);

  // Cancel Subscription

  const deleteUser = await findAndDelete(req.params.userId);
  if (!deleteUser) {
    return next(new ErrorHandler("User not found.", 401));
  }

  return res.status(200).json({
    success: true,
    message: `User ${deleteUser.name} deleted by admin.`,
  });
});

User.watch().on("change", async () => {
  let stats = await Stats.find({}).sort({ createdAt: "desc" }).limit(1);

  if (stats.length === 0) {
    stats = [new Stats()];
  }

  const subscrription = await User.find({ "subscription.status": "active" });

  stats[0].users = await User.countDocuments();
  stats[0].subscribers = subscrription.length;
  stats[0].createdAt = new Date(Date.now());

  await stats[0].save();
});
