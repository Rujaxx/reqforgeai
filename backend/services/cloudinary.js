const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Function to upload a file to Cloudinary
exports.uploadImage = async (imageBuffer) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            {
                resource_type: 'image',
                folder: 'reqforgeai', // Optional: organize uploads in folders
                transformation: [
                    { quality: 'auto' }, // Automatic quality optimization
                    { fetch_format: 'auto' } // Automatic format optimization
                ]
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve({
                        public_id: result.public_id,
                        secure_url: result.secure_url,
                        url: result.url,
                        width: result.width,
                        height: result.height,
                        format: result.format,
                        bytes: result.bytes,
                        created_at: result.created_at
                    });
                }
            }
        ).end(imageBuffer);
    });
}


// Function to delete a file from Cloudinary
exports.deleteImage = async (publicId) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.destroy(publicId, { resource_type: 'image' }, (error, result) => {
            if (error) {
                reject(error);
            } else {
                console.log(`Deleted image with publicId ${publicId}`)
                resolve(result);
            }
        });
    });
}