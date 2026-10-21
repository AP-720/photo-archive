const cloudinaryName = "photo-archive";

export function buildCloudinaryUrl(cloudinaryId, width = 800) {
	return `https://res.cloudinary.com/${cloudinaryName}/image/upload/c_scale,w_${width}/q_auto/f_auto/${cloudinaryId}`;
}

