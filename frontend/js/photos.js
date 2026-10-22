import { buildCloudinaryUrl } from "./cloudinary.js";

export const SortOrder = {
	OLDEST: "ASC",
	NEWEST: "DESC",
};

export const seenIds = new Set();

const baseAddress = "http://127.0.0.1:8000";

export async function getPhotos(weight, seenIds, limit = 50) {
	const url = `${baseAddress}/random?weight=${weight}&limit=${limit}`;

	const response = await fetch(url, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ ids: [...seenIds] }),
	});

	if (!response.ok) {
		throw new Error(`Request failed: ${response.status}`);
	}

	return await response.json();
}

export async function getAllPhotos(sortOrder, offset, limit = 50) {
	const url = `${baseAddress}/all-images?sort=${sortOrder}&offset=${offset}&limit=${limit}`;

	const response = await fetch(url, {
		method: "GET",
	});

	if (!response.ok) {
		throw new Error(`Request failed: ${response.status}`);
	}

	return await response.json();
}

/**
 * Creates and appends a tile div (containing an img) for each photo in the array.
 * @param {Object[]} photos - array of photo data objects
 * @param {HTMLElement} gridElement - the container element to render tiles into
 * @returns {HTMLElement[]} array of the created tile div elements, in the same order as `photos`
 */
export function renderPhotos(photos, gridElement) {
	const tiles = [];
	for (const photo of photos) {
		const tile = document.createElement("div");
		tile.classList.add("tile");
		const img = document.createElement("img");
		img.src = buildCloudinaryUrl(photo.public_id);
		tile.appendChild(img);
		gridElement.appendChild(tile);
		tiles.push(tile);
	}
	return tiles;
}
