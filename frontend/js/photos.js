import { mockPhotoResponse } from "./mockPhotos.js";
import { buildCloudinaryUrl } from "./cloudinary.js";

export async function getPhotos(weight, seenIds) {
	return mockPhotoResponse;
}

/**
 * Creates and appends a tile div (containing an img) for each photo in the array.
 * @param {Object[]} photos - array of photo data objects
 * @param {HTMLElement} gridElement - the container element to render tiles into
 * @returns {HTMLElement[]} array of the created tile div elements, in the same order as `photos`
 */
export function renderPhotos(photos, gridElement) {
	const tiles = []
	for (const photo of photos) {
		const tile = document.createElement("div");
		tile.classList.add("tile");
		const img = document.createElement("img");
		img.src = buildCloudinaryUrl(photo.cloudinary_id);
		tile.appendChild(img);
		gridElement.appendChild(tile);
		tiles.push(tile)
	}
	return tiles
}
