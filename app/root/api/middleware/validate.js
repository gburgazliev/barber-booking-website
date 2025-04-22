// middleware/validate.js
const { body, param, validationResult } = require('express-validator');

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: "Validation error", 
      errors: errors.array().map(err => ({ field: err.param, message: err.msg }))
    });
  }
  next();
};

/**
 * Validation rules for appointment booking
 */
const appointmentValidationRules = [
  body('date')
    .isString()
    .isLength({ min: 10, max: 10 })
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Date must be in YYYY-MM-DD format'),
    
  body('timeSlot')
    .isString()
    .isLength({ min: 5, max: 5 })
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Time slot must be in HH:MM format'),
    
  body('type')
    .isString()
    .isIn(['Hair', 'Hair and Beard', 'Beard'])
    .withMessage('Type must be one of: Hair, Hair and Beard, Beard'),
    
  body('duration')
    .optional()
    .isInt({ min: 30, max: 60 })
    .withMessage('Duration must be between 30 and 60 minutes'),
    
  body('isShiftedSlot')
    .optional()
    .isBoolean()
    .withMessage('isShiftedSlot must be a boolean value'),
    
  body('isIntermediateSlot')
    .optional()
    .isBoolean()
    .withMessage('isIntermediateSlot must be a boolean value'),
    
  body('originalSlotTime')
    .optional()
    .isString()
    .isLength({ min: 5, max: 5 })
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Original slot time must be in HH:MM format'),
    
  handleValidationErrors
];

/**
 * Validation rules for user registration
 */
const userRegistrationRules = [
  body('firstname')
    .isString()
    .isLength({ min: 2, max: 50 })
    .matches(/^[a-zA-Z\s\-']+$/)
    .withMessage('First name must be 2-50 characters and contain only letters, spaces, hyphens, and apostrophes'),
    
  body('lastname')
    .isString()
    .isLength({ min: 2, max: 50 })
    .matches(/^[a-zA-Z\s\-']+$/)
    .withMessage('Last name must be 2-50 characters and contain only letters, spaces, hyphens, and apostrophes'),
    
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Must provide a valid email address'),
    
  body('password')
    .isString()
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be at least 8 characters and include uppercase, lowercase, number and special character'),
    
  handleValidationErrors
];

/**
 * Validation rules for login
 */
const loginValidationRules = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Must provide a valid email address'),
    
  body('password')
    .isString()
    .notEmpty()
    .withMessage('Password is required'),
    
  handleValidationErrors
];

/**
 * Validation rules for appointment confirmation
 */
const confirmationValidationRules = [
  param('confirmHex')
    .isString()
    .isLength({ min: 32, max: 65 }) // Account for the colon prefix
    .withMessage('Invalid confirmation token'),
    
  handleValidationErrors
];

/**
 * Validation rules for appointment cancellation
 */
const cancellationValidationRules = [
  param('id')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Invalid appointment ID'),
    
  handleValidationErrors
];

/**
 * Validation rules for password reset
 */
const passwordResetValidationRules = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Must provide a valid email address'),
    
  handleValidationErrors
];

/**
 * Validation rules for setting new password
 */
const newPasswordValidationRules = [
  body('resetToken')
    .isString()
    .isLength({ min: 32, max: 64 })
    .withMessage('Invalid reset token'),
    
  body('newPassword')
    .isString()
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be at least 8 characters and include uppercase, lowercase, number and special character'),
    
  handleValidationErrors
];

/**
 * Validation rules for working hours
 */
const workingHoursValidationRules = [
  body('date')
    .isString()
    .isLength({ min: 10, max: 10 })
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Date must be in YYYY-MM-DD format'),
    
  body('startTime')
    .isString()
    .isLength({ min: 5, max: 5 })
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format'),
    
  body('endTime')
    .isString()
    .isLength({ min: 5, max: 5 })
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM format'),
    
  body('breakStart')
    .optional()
    .isString()
    .custom((value) => {
      if (value === '') return true;
      return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value);
    })
    .withMessage('Break start time must be in HH:MM format'),
    
  body('breakEnd')
    .optional()
    .isString()
    .custom((value) => {
      if (value === '') return true;
      return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value);
    })
    .withMessage('Break end time must be in HH:MM format'),
    
  handleValidationErrors
];

module.exports = {
  appointmentValidationRules,
  userRegistrationRules,
  loginValidationRules,
  confirmationValidationRules,
  cancellationValidationRules,
  passwordResetValidationRules,
  newPasswordValidationRules,
  workingHoursValidationRules
};