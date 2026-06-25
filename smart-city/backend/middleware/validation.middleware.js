import { body, validationResult } from 'express-validator';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array(),
    });
  }
  next();
};

export const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 50 }),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and a number'),
];

export const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

export const complaintValidation = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 100 }),
  body('description').trim().notEmpty().withMessage('Description is required').isLength({ min: 20, max: 2000 }),
  body('category').notEmpty().withMessage('Category is required')
    .isIn(['roads', 'water', 'electricity', 'sanitation', 'parks', 'health', 'general', 'noise', 'illegal_construction', 'public_transport']),
  body('location')
    .notEmpty().withMessage('Location is required')
    .custom((value) => {
      let location = value;
      if (typeof location === 'string') {
        try {
          location = JSON.parse(location);
        } catch (err) {
          throw new Error('Location must be valid JSON');
        }
      }
      if (!location || !location.address || !location.address.toString().trim()) {
        throw new Error('Location address is required');
      }
      return true;
    }),
];

export const statusUpdateValidation = [
  body('status').notEmpty().withMessage('Status is required')
    .isIn(['pending', 'under_review', 'in_progress', 'resolved', 'rejected', 'closed']),
];
