const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const { uuid: v4 } = require('uuid')

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_KEY,
    api_secret: process.env.CLOUD_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary,
    allowedFormats: ['jpg', 'png', 'jpeg'],
    filename: function (req, file, cb) {
        cb(null, uuid() + file.originalname);
    }
});

const uploadCloud = multer({ storage });

module.exports = {
    uploadCloud,
}
