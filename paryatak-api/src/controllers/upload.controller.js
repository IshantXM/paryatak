const cloudinary = require('cloudinary').v2;
const { sendSuccess, sendError } = require('../utils/apiResponse');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadImage = async (req, res) => {
    try {
        if (!req.file) return sendError(res, 'No file provided', 400);

        // Check Cloudinary config
        if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === 'your-cloud-name') {
            return sendError(res, 'Cloudinary not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env', 503);
        }

        const folder = req.body.folder || 'paryatak/uploads';
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataUri = `data:${req.file.mimetype};base64,${b64}`;

        const result = await cloudinary.uploader.upload(dataUri, {
            folder,
            resource_type: 'image',
            transformation: [
                { width: 1920, height: 1080, crop: 'limit', quality: 'auto', fetch_format: 'auto' },
            ],
        });

        return sendSuccess(res, 'Image uploaded', {
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
        }, 201);
    } catch (err) {
        return sendError(res, err.message, 500);
    }
};

const deleteImage = async (req, res) => {
    try {
        const { publicId } = req.body;
        if (!publicId) return sendError(res, 'publicId required', 400);
        await cloudinary.uploader.destroy(publicId);
        return sendSuccess(res, 'Image deleted');
    } catch (err) { return sendError(res, err.message, 500); }
};

module.exports = { uploadImage, deleteImage };
