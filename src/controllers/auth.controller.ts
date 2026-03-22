//Standardized response function
import crypto from "crypto";
import { getUserService, registerUserService } from "../models/user.model.ts";
import jwt from "jsonwebtoken";
import { config } from "../config/config.ts";
import {
  createSessionService,
  fetchSessionService,
  updateSessionService,
} from "../models/sessions.model.ts";

type ApiResponse = {
  status: number;
  message: string;
  data?: any;
  accessToken?: string;
};

const handleResponse = (
  res: any,
  status: number,
  message: string,
  data?: any,
  accessToken?: string,
) => {
  const response: ApiResponse = { status, message };
  if (accessToken) {
    response.accessToken = accessToken;
  }
  if (data != undefined) {
    response.data = data;
  }
  res.status(status).json(response);
};

export const register = async (req, res, next) => {
  const { name, email, phone, password } = req.body;
  const hashPassword = crypto
    .createHash("sha256")
    .update(password)
    .digest("hex");
  try {
    const users = await registerUserService(name, email, phone, hashPassword);

    const refreshToken = jwt.sign(
      {
        id: users.id,
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
      users.id,
      refreshTokenHash,
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      req.ip,
      req.headers,
    );

    const accessToken = jwt.sign(
      {
        id: users.id,
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

    handleResponse(res, 201, "User created successfully", users, accessToken);
  } catch (err) {
    next(err);
  }
};

export const getUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return handleResponse(res, 400, "Token not found!");
  }

  const token = authHeader.split(" ")[1];
  const decoded = jwt.verify(token, config.JWT_SECRET);
  // console.log(decoded);

  try {
    const user = await getUserService(decoded);

    return handleResponse(res, 200, "User fetched successfully", user);
  } catch (err) {
    next(err);
  }
};

export const rotateToken = async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return handleResponse(res, 401, "Refresh token not found");
  }
  try {
    const decoded = jwt.verify(refreshToken, config.JWT_SECRET);

    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

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

    const newRefreshTokenHash = crypto.createHash("sha256").update(newRefreshToken).digest("hex");

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

export const logout = async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return handleResponse(res, 400, "Refresh token not found");
  }
  try {
    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
    
    // console.log("Cookie refreshToken:", refreshToken);
    // console.log("Hash computed:", refreshTokenHash);

    const session = await fetchSessionService(refreshTokenHash);

    // console.log("Fetched session:", session);


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
