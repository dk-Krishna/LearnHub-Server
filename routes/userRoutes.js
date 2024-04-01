import Express from "express";
import {
  signup,
  login,
  logout,
  getMyProfile,
  changePassword,
  updateProfile,
  updateProfilePicture,
  forgetPassword,
  resetPassword,
  addToPlaylist,
  removeFromPlaylist,
  getAllUsers,
  updateUserRole,
  deleteUser,
  deleteMyProfile,
} from "../controllers/userController.js";
import { authorizedAdmin, isAuthenticated } from "../middlewares/auth.js";
import singleUpload from "../middlewares/multer.js";

export default Express.Router()

  .post("/signup", singleUpload, signup)
  .post("/login", login)
  .get("/logout", logout)

  .get("/getMyProfile", isAuthenticated, getMyProfile)
  .put("/changePassword", isAuthenticated, changePassword)
  .put("/updateProfile", isAuthenticated, updateProfile)
  .put(
    "/updateProfilePicture",
    isAuthenticated,
    singleUpload,
    updateProfilePicture
  )
  .delete("/deleteMyProfile", isAuthenticated, deleteMyProfile)

  .post("/forgetPassword", forgetPassword)
  .put("/resetPassword/:token", resetPassword)

  // PLAYLIST FUNCTIONALITIES
  .post("/addToPlaylist", isAuthenticated, addToPlaylist)
  .delete("/removeFromPlaylist", isAuthenticated, removeFromPlaylist)

  // ADMIN ROUTES
  .get("/getAllUsers", isAuthenticated, authorizedAdmin, getAllUsers)
  .put(
    "/updateUserRole/:userId",
    isAuthenticated,
    authorizedAdmin,
    updateUserRole
  )
  .delete("/deleteUser/:userId", isAuthenticated, authorizedAdmin, deleteUser)
