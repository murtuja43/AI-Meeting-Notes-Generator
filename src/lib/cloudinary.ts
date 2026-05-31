import { v2 as cloudinary } from "cloudinary";
import { env } from "@/lib/env";

/**
 * Configured Cloudinary client (server-only).
 *
 * Cloudinary's SDK is configured globally once at import time. We export the
 * configured instance so the storage service can call `uploader.upload_stream`
 * etc. without re-configuring on every request.
 */
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };
