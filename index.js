"use strict";
const stream = require("stream"),
    sharp = require("sharp"),
    mime = require("mime/lite"),
    AWS = require("aws-sdk");

// aws config
AWS.config.update({
    accessKeyId: "your AWS access KEY",
    secretAccessKey: "Your secret Key",
});

//
const s3 = new AWS.S3()
    // sizes = [
    //     "80x80", // small existing thumb
    //     "150x150", // new thumb size?
    //     "200x125", // existing thumb
    //     "360w", // thumb without height restriction
    //     "360x270", // larger thumb restricted
    //     "480w",
    //     "640w",
    //     "1280w", // largest web image
    // ];



const Bucket_name = "your bucket name"
const CDN_URL = "your CDN URL"
exports.handler = async (event) => {
    try {
        // Extract image name and size from the query string parameters
        const imageName = event.queryStringParameters.name;
        const imageSize = event.queryStringParameters.size;

        // Validate image name
        if (!imageName) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Image name is required." }),
            };
        }

        // Process image size
        const params = processImageSize(imageSize);

        // Check if the image already exists in S3
        const target = await s3.headObject({
            Bucket: Bucket_name,
            Key: imageName,
        }).promise();

        // If the image exists and not forced, return JSON response with original image URL
        const forced = typeof event.queryStringParameters.force !== "undefined";
        if (target && !forced) {
            const imageUrl = `${CDN_URL}/${imageName}`;
            return {
                statusCode: 200,
                body: JSON.stringify({ imageUrl }),
            };
        }

        // Resize and upload the image
        await resizeAndUploadImage(imageName, params);

        // Return JSON response with the new resized image URL
        const resizedImageUrl = `${CDN_URL}/${imageName}`;
        return {
            statusCode: 200,
            body: JSON.stringify({ resizedImageUrl }),
        };
    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message }),
        };
    }
};


const processImageSize = (size) => {
    let params = {};
    if (size.slice(-1) === "w") {
        params.width = parseInt(size.slice(0, -1), 10);
    } else if (size.slice(-1) === "h") {
        params.height = parseInt(size.slice(0, -1), 10);
    } else {
        const sizeComponents = size.split("x");
        params = {
            width: parseInt(sizeComponents[0], 10),
            height: parseInt(sizeComponents[1], 10),
        };
    }
    return params;
};

const resizeAndUploadImage = async (imageName, params) => {
    const readStream = getS3Stream(imageName);
    const resizeStream = stream2Sharp(params);
    const { writeStream, success } = putS3Stream(imageName);

    // Trigger stream
    readStream.pipe(resizeStream).pipe(writeStream);

    // Wait for the stream to complete
    await success;
};

const getS3Stream = (imageName) => {
    return s3.getObject({
        Bucket: Bucket_name,
        Key: imageName,
    }).createReadStream();
};

const putS3Stream = (imageName) => {
    const pass = new stream.PassThrough();
    return {
        writeStream: pass,
        success: s3.upload({
            Body: pass,
            Bucket: Bucket_name,
            Key: imageName,
            ContentType: mime.getType(imageName),
            ACL: "public-read",
        }).promise(),
    };
};

const stream2Sharp = (params) => {
    return sharp().resize(
        Object.assign(params, {
            withoutEnlargement: true,
        })
    );
};
