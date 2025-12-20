const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("./cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    return {
      folder: "megamart",
      resource_type: "image",
      format: file.mimetype.split("/")[1], // png / jpg
    };
  },
});

const upload = multer({ storage });

module.exports = upload;
