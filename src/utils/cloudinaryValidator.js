const url = require("url");

const getCloudName = () => {
  return (
    process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME || "" 
  );
};

/**
 * Validates that a given url looks like a Cloudinary image URL for our cloud
 * Example accepted host: res.cloudinary.com/{cloudName}/image/upload/...
 */
exports.isValidCloudinaryUrl = (value) => {
  if (!value || typeof value !== "string") return false;
  try {
    const parsed = new url.URL(value);
    const host = parsed.host || "";
    const cloudName = getCloudName();
    if (!cloudName) return false;
    // Common Cloudinary host pattern
    if (host.includes("res.cloudinary.com") && parsed.pathname.includes(`/${cloudName}/`)) {
      return true;
    }
    // Also allow cdn subdomains or direct cloudinary urls that contain cloudName
    if (value.includes(cloudName) && value.includes("cloudinary")) return true;
    return false;
  } catch (err) {
    return false;
  }
};

exports.normalizeCloudinaryUrl = (value) => {
  if (!value || typeof value !== "string") return null;
  return value.trim();
};
