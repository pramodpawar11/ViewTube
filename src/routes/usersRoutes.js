import { Router } from "express";
const router = Router();
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
} from "../controllers/userController.js";
import { upload } from "../middlewares/multerMiddleware.js";
import verifyToken from "../middlewares/authMiddleware.js";

router.post(
  "/register",
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);
router.post("/login", loginUser);

router.post("/logout", verifyToken, logoutUser);

router.post("/refresh-token", refreshAccessToken);

export default router;
