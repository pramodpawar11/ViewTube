import { Router } from "express"
const router = Router();
import {registerUser} from "../controllers/userController.js";

router.get("/register",registerUser);

export default router