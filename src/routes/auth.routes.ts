import { Router } from "express";
import * as authController from "../controllers/auth.controller.ts"
import validateUser from "../middlewares/inputValidator.ts";

const authRouter = Router();


/**
 * POST api/auth/register
 */
authRouter.post("/register", validateUser, authController.register)

/**
 * GET api/auth/get-me
 */
authRouter.get("/get-me", authController.getUser)

/**
 * GET api/auth/refresh-token
 */
authRouter.get("/refresh-token", authController.rotateToken)

/**
 * POST api/auth/logout
 */
authRouter.get("/logout", authController.logout)

export default authRouter