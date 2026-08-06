const cloudinaryName = "photo-archive";

export function buildCloudinaryUrl(cloudinaryId, width = 800) {
	return `https://res.cloudinary.com/${cloudinaryName}/image/upload/c_scale,w_${width}/q_auto/f_auto/${cloudinaryId}`;
}

// https://res.cloudinary.com/<your_cloud_name>/image/upload/c_scale,w_500/q_auto/f_auto/cld-sample-4.jpg
