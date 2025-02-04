const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Define the storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {


        // Updated path to the 'src/uploads/profile_images' folder
        const uploadDir = path.join(__dirname, '/profile_images');

        // Ensure the directory exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Set the filename as a timestamp followed by the original file name
        cb(null, Date.now() + '-' + file.originalname);
    }
});

// Configure multer for file upload handling
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Accept only jpeg, png, or jpg image formats
        if (file.mimetype == 'image/jpeg' || file.mimetype == 'image/png' || file.mimetype == 'image/jpg') {
            cb(null, true);
        } else {
            cb(null, false);
            return cb(new Error('Only .png, .jpg, and .jpeg formats are allowed!'));
        }
    },
    limits: { fileSize: 1024 * 1024 * 5 } // Limit file size to 5MB
});

module.exports = upload;
