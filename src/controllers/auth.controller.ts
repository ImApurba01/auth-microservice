//Standardized response function
import crypto from "crypto";
import {
  getUserService,
  loginUserService,
  registerUserService,
} from "../models/user.model";
import jwt from "jsonwebtoken";
import { config } from "../config/config";
import {
  createSessionService,
  fetchSessionService,
  revokeAllSessionsService,
  updateSessionService,
} from "../models/sessions.model";
import type { Request, Response, NextFunction } from "express";

export interface IApiResponse<T = unknown> {
  status: number;
  message: string;
  data?: T;
  accessToken?: string | null;
}

const handleResponse = <T>(
  res: Response,
  status: number,
  message: string,
  data?: T,
  accessToken?: string,
) => {
  const response: IApiResponse<T> = { status, message };
  if (data != undefined) {
    response.data = data;
  }
  if (accessToken) {
    response.accessToken = accessToken;
  }
  res.status(status).json(response);
};

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { name, email, phone, password } = req.body;
  const hashPassword = crypto
    .createHash("sha256")
    .update(password)
    .digest("hex");
  try {
    const user = await registerUserService(name, email, phone, hashPassword);

    const refreshToken = jwt.sign(
      {
        id: user.id,
      },
      config.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    const refreshTokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    const session = await createSessionService(
      user.id,
      refreshTokenHash,
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      req.ip,
      req.headers["user-agent"],
    );

    const accessToken = jwt.sign(
      {
        id: user.id,
        sessionId: session.id,
      },
      config.JWT_SECRET,
      {
        expiresIn: "15m",
      },
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    handleResponse(res, 201, "User created successfully", user, accessToken);
  } catch (err) {
    next(err);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { email, password } = req.body;

  try {
    const user = await loginUserService(email);

    if (!user) {
      return handleResponse(res, 401, "Invalid email or password");
    }

    const hashedPassword = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");

    const isPasswordValid = hashedPassword === user.password;

    if (!isPasswordValid) {
      return handleResponse(res, 401, "Invalid email or password");
    }

    const refreshToken = jwt.sign(
      {
        id: user.id,
      },
      config.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    const refreshTokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    const session = await createSessionService(
      user.id,
      refreshTokenHash,
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      req.ip,
      req.headers["user-agent"],
    );

    const accessToken = jwt.sign(
      {
        id: user.id,
        sessionId: session.id,
      },
      config.JWT_SECRET,
      {
        expiresIn: "15m",
      },
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const data = {
      username: user.name,
      email: user.email,
    };

    handleResponse(res, 200, "Logged in successfully", data, accessToken);
  } catch (err) {
    next(err);
  }
};

export const getUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // const authHeader = req.headers.authorization;
  const authHeader = req.headers.authorization as string;

  try {

    const token = authHeader.split(" ")[1];

    if (!token || !token.startsWith("Bearer ")) {
      return handleResponse(res, 400, "Token not found!");
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);

    const user = await getUserService(decoded);

    return handleResponse(res, 200, "User fetched successfully", user);
  } catch (err) {
    next(err);
  }
};

export const rotateToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return handleResponse(res, 401, "Refresh token not found");
  }
  try {
    const decoded = jwt.verify(refreshToken, config.JWT_SECRET);

    if (typeof decoded === "string") {
      // handle the case where it's just a string
      return handleResponse(res, 401, "Invalid token format");
    }

    const refreshTokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    const session = await fetchSessionService(refreshTokenHash);

    if (!session || session.revoked === true) {
      return handleResponse(res, 400, "Invalid refresh token");
    }

    const accesstoken = jwt.sign(
      {
        id: decoded.id,
      },
      config.JWT_SECRET,
      {
        expiresIn: "15m",
      },
    );

    const newRefreshToken = jwt.sign(
      {
        id: decoded.id,
      },
      config.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    const newRefreshTokenHash = crypto
      .createHash("sha256")
      .update(newRefreshToken)
      .digest("hex");

    session.refresh_token_hash = newRefreshTokenHash;

    await updateSessionService(session);

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    return handleResponse(
      res,
      200,
      "Access token refreshed successfully",
      null,
      accesstoken,
    );
  } catch (err) {
    next(err);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return handleResponse(res, 400, "Refresh token not found");
  }
  try {
    const refreshTokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    const session = await fetchSessionService(refreshTokenHash);

    if (!session || session.revoked == true) {
      // console.log(session);
      return handleResponse(res, 400, "Invalid refresh token");
    }

    session.revoked = true;

    await updateSessionService(session);

    res.clearCookie("refreshToken");

    return handleResponse(res, 200, "Logged out successfully");
  } catch (err) {
    next(err);
  }
};

export const logoutAll = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return handleResponse(res, 400, "Refresh token not found");
  }
  try {
    const decoded = jwt.verify(refreshToken, config.JWT_SECRET);

    if(typeof decoded === "string"){
      return handleResponse(res, 401, "Invalid token format");
    }

    await revokeAllSessionsService(decoded.id);

    res.clearCookie("refreshToken");

    return handleResponse(res, 200, "Logged out from all device successfully");
  } catch (err) {
    next(err);
  }
};
