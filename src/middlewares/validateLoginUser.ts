import type { Request, Response, NextFunction } from "express";
import Joi from "joi";
import type { ValidationError } from "joi"

const userSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required"
  }),
  password: Joi.string()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$!%*?&])[A-Za-z\d@#$!%*?&]{6,}$/)
    .required()
    .messages({
      "string.pattern.base": "Password must be at least 6 characters, include uppercase, lowercase, number, and special character",
      "any.required": "Password is required"
    })
});

const validateLoginUser = (req: Request, res: Response, next: NextFunction) => {
  const { error } = userSchema.validate(req.body);
  if (error) {
    const err: ValidationError = error;
    return res.status(400).json({
      status: 400,
      message: err.details[0]?.message,
    });
  }
  next();
};

export default validateLoginUser;
