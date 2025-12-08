const express = require('express');
const multer = require('multer');
const path = require('path');
const paperController = require('../controllers/paperController');
const authController = require('../controllers/authController');
const verifyToken = require('../middleware/authMiddleware');

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Public Routes
router.get('/archives', paperController.getArchives);
router.post('/auth/register', authController.registerUser);

// Protected Routes
router.post('/submit', verifyToken, upload.single('manuscript'), paperController.submitPaper);
router.get('/profile', verifyToken, authController.getUserProfile);

module.exports = router;