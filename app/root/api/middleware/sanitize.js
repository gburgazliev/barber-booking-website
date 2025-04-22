// middleware/sanitize.js
const validator = require('validator');
const sanitizeHtml = require('sanitize-html');

/**
 * Middleware to sanitize request body inputs
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const sanitizeInputs = (req, res, next) => {
  if (req.body) {
    // Create a new sanitized body object
    const sanitizedBody = {};
    
    // Iterate through each field in the request body
    for (const [key, value] of Object.entries(req.body)) {
      // Handle different types of input differently
      if (typeof value === 'string') {
        // Sanitize string inputs
        sanitizedBody[key] = sanitizeString(value);
      } else if (Array.isArray(value)) {
        // Sanitize arrays
        sanitizedBody[key] = value.map(item => 
          typeof item === 'string' ? sanitizeString(item) : item
        );
      } else if (typeof value === 'object' && value !== null) {
        // Recursively sanitize nested objects
        sanitizedBody[key] = sanitizeObject(value);
      } else {
        // Keep non-string values as is (numbers, booleans, etc.)
        sanitizedBody[key] = value;
      }
    }
    
    // Replace the original body with the sanitized one
    req.body = sanitizedBody;
  }
  
  next();
};

/**
 * Sanitizes a string value
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
const sanitizeString = (str) => {
  // Trim whitespace
  let sanitized = validator.trim(str);
  
  // Escape HTML special characters
  sanitized = validator.escape(sanitized);
  
  // Remove any potential script injections
  sanitized = sanitizeHtml(sanitized, {
    allowedTags: [],
    allowedAttributes: {}
  });
  
  return sanitized;
};

/**
 * Recursively sanitizes an object's string properties
 * @param {Object} obj - Object to sanitize
 * @returns {Object} Sanitized object
 */
const sanitizeObject = (obj) => {
  const sanitized = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeString(item) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

module.exports = sanitizeInputs;