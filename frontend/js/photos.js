import { buildCloudinaryUrl } from "./cloudinary.js";

export const SortOrder = {
	OLDEST: "ASC",
	NEWEST: "DESC",
};

export const seenIds = new Set();

// Dynamically creating the API url, depending if running locally or live.
const hostname = window.location.hostname;
const isLocal = hostname === "127.0.0.1" || hostname === "localhost";
const baseAddress = isLocal
	? "http://127.0.0.1:8000"
	: "https://photo-archive-8i48.onrender.com";

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
 * Each tile stores the photo's natural pixel size in data-width and data-height,
 * so the masonry layout can read it back from the page without keeping a separate list.
 * The first 12 images load eagerly and the rest lazily.
 * @param {Object[]} photos - array of photo data objects (needs public_id, width and height)
 * @param {HTMLElement} gridElement - the container element to render tiles into
 */
export function renderPhotos(photos, gridElement) {
	for (const [i, photo] of photos.entries()) {
		const tile = document.createElement("div");
		tile.classList.add("tile");
		const img = document.createElement("img");
		img.loading = i < 12 ? "eager" : "lazy";
		img.src = buildCloudinaryUrl(photo.public_id);
		tile.dataset.width = photo.width;
		tile.dataset.height = photo.height;
		tile.appendChild(img);
		gridElement.appendChild(tile);
	}
}
