import { mockPhotoResponse } from "./mockPhotos.js";
import { buildCloudinaryUrl } from "./cloudinary.js";

export async function getPhotos(weight, seenIds) {
	return mockPhotoResponse;
}

export function renderPhotos(photos, gridElement) {
	for (const photo of photos) {
		const tile = document.createElement("div");
		tile.classList.add("tile");
		const img = document.createElement("img");
		img.src = buildCloudinaryUrl(photo.cloudinary_id);
		tile.appendChild(img);
		gridElement.appendChild(tile);
	}
}
