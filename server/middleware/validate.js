const mongoose = require("mongoose");
const ApiError = require("../utils/ApiError");

// min/max ke message me "characters" ya "items" likhne ke liye
const unit = (v) => (typeof v === "string" ? " characters" : Array.isArray(v) ? " items" : "");

const isEmail = (v) => typeof v === "string" && /^\S+@\S+\.\S+$/.test(v);

// URL ke :id ko check karta hai (galat id pe 400)
exports.validateObjectId =
  (...params) =>
  (req, res, next) => {
    const names = params.length ? params : ["id"];
    for (const p of names) {
      if (!mongoose.isValidObjectId(req.params[p])) return next(new ApiError(400, `Invalid ${p}`));
    }
    next();
  };

/*
  Body validation. Example:
  validateBody({
    email: { required: true, type: "email" },
    password: { required: true, type: "string", min: 6 },
  })
  type: string | email | number | integer | objectId | array | date | boolean
  min/max: string ki length, number ki value ya array ki length pe lagta hai
  oneOf: allowed values ki list
*/
exports.validateBody = (rules) => (req, res, next) => {
  const body = req.body || {};
  const errors = [];

  for (const [field, rule] of Object.entries(rules)) {
    const v = body[field];

    if (v === undefined || v === null || v === "") {
      if (rule.required) errors.push(`${field} is required`);
      continue;
    }

    const before = errors.length;
    switch (rule.type) {
      case "string":
        if (typeof v !== "string") errors.push(`${field} must be text`);
        break;
      case "email":
        if (!isEmail(v)) errors.push(`${field} must be a valid email`);
        break;
      case "number":
        if (typeof v !== "number" || Number.isNaN(v)) errors.push(`${field} must be a number`);
        break;
      case "integer":
        if (!Number.isInteger(v)) errors.push(`${field} must be a whole number`);
        break;
      case "objectId":
        if (!mongoose.isValidObjectId(v)) errors.push(`${field} must be a valid id`);
        break;
      case "array":
        if (!Array.isArray(v)) errors.push(`${field} must be a list`);
        break;
      case "date":
        if (typeof v !== "string" || Number.isNaN(new Date(v).getTime())) errors.push(`${field} must be a valid date`);
        break;
      case "boolean":
        if (typeof v !== "boolean") errors.push(`${field} must be true or false`);
        break;
      default:
        break;
    }

    if (errors.length > before) continue; // is field ki type galat hai, aage check mat karo

    if (rule.min !== undefined) {
      const size = typeof v === "string" || Array.isArray(v) ? v.length : v;
      if (size < rule.min) errors.push(`${field} must be at least ${rule.min}${unit(v)}`);
    }
    if (rule.max !== undefined) {
      const size = typeof v === "string" || Array.isArray(v) ? v.length : v;
      if (size > rule.max) errors.push(`${field} must be at most ${rule.max}${unit(v)}`);
    }
    if (rule.oneOf && !rule.oneOf.includes(v)) errors.push(`${field} must be one of: ${rule.oneOf.join(", ")}`);
  }

  if (errors.length) return next(new ApiError(400, errors[0], errors));
  next();
};
