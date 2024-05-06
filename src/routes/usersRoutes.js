import { Router } from "express";
const router = Router();
import { registerUser } from "../controllers/userController.js";
import { upload } from "../middlewares/multerMiddleware.js";

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

export default router;
