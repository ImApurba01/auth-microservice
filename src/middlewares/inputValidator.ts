import Joi from "joi";

const userSchema = Joi.object({
  name: Joi.string().min(3).max(30).required().messages({
    "string.empty": "Name is required",
    "string.min": "Name must be at least 3 characters",
    "string.max": "Name must be at most 30 characters"
  }),
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required"
  }),
  phone: Joi.string()
    .pattern(/^\+?[0-9]{10,15}$/)
    .required()
    .messages({
      "string.pattern.base": "Phone number must be 10–15 digits and may start with +",
      "any.required": "Phone number is required"
    }),
  password: Joi.string()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$!%*?&])[A-Za-z\d@#$!%*?&]{6,}$/)
    .required()
    .messages({
      "string.pattern.base": "Password must be at least 6 characters, include uppercase, lowercase, number, and special character",
      "any.required": "Password is required"
    })
});

const validateUser = (req, res, next) => {
  const { error } = userSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: 400,
      message: error.details[0].message,
    });
  }
  next();
};

export default validateUser;
