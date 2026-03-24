import { Router } from "express";
import * as authController from "../controllers/auth.controller"
import validateRegisterUser from "../middlewares/validateRegisterUser";

const authRouter = Router();


/**
 * POST api/auth/register
 */
authRouter.post("/register", validateRegisterUser, authController.register)

/**
 * POST api/auth/login
 */
authRouter.post("/login", authController.login)

/**
 * GET api/auth/get-me
 */
authRouter.get("/get-me", authController.getUser)

/**
 * GET api/auth/token/refresh-token
 */
authRouter.get("/token/refresh-token", authController.rotateToken)

/**
 * POST api/auth/logout
 */
authRouter.get("/logout", authController.logout)

/**
 * POST api/auth/logout
 */
authRouter.get("/logout-all", authController.logoutAll)

export default authRouter;