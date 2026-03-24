import type { Request, Response, NextFunction } from "express";

interface AppError extends Error{
  code : String,
  constraint: string

}
// Centralized error handler
const errorHandler = (err: AppError, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);

  // Handle Postgres unique constraint violation
  if (err.code === "23505") {
    // Can check which constraint failed
    if (err.constraint === "users_email_key") {
      return res.status(400).json({
        status: 400,
        message: "Email already registered"
      });
    }
    if (err.constraint === "users_phone_key") {
      return res.status(400).json({
        status: 400,
        message: "Phone number already registered"
      });
    }
    // fallback for other unique constraints
    return res.status(400).json({
      status: 400,
      message: "Duplicate value violates unique constraint"
    });
  }

  // Default fallback
  res.status(500).json({
    status: 500,
    message: "Something went wrong!",
    error: err.message
  });
};

export default errorHandler;