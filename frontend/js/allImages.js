import { SortOrder, getAllPhotos, renderPhotos } from "./photos.js";
import { processTiles, setCurrentPhotoData } from "./masonry.js";
import { setLoading, setMessage, clearMessage } from "./loading.js";
import "./backToTop.js";

let offset = 0;
let isLoading = false;
let sortOrder = SortOrder.NEWEST;

const photoGrid = document.querySelector("#photo_grid");
const radioGroup = document.querySelector(".sort_wrapper");
const sentinel = document.querySelector("#sentinel");
const errorContainer = document.querySelector("#error_message_container");

try {
	clearMessage(errorContainer);
	setLoading(true);

	const images = await getAllPhotos(sortOrder, offset);
	offset = images.photos.length;

	const tileElements = renderPhotos(images.photos, photoGrid);

	setCurrentPhotoData(tileElements, images.photos);
	processTiles();
} catch (error) {
	console.error(error);
	setMessage(errorContainer, "Oops, something went wrong!");
} finally {
	setLoading(false);
}

radioGroup.addEventListener("change", async (event) => {
	if (isLoading) return;

	let previousCount = offset;
	let requestedSortOrder = SortOrder[event.target.value];

	try {
		clearMessage(errorContainer);

		isLoading = true;
		setLoading(isLoading);

		const photos = await getAllPhotos(requestedSortOrder, 0, previousCount);

		sortOrder = requestedSortOrder;
		offset = photos.photos.length;

		const tiles = document.querySelectorAll(".tile");
		tiles.forEach((tile) => tile.remove());

		const tileElements = renderPhotos(photos.photos, photoGrid);
		setCurrentPhotoData(tileElements, photos.photos);
		processTiles();
	} catch (error) {
		console.error(error);
		setMessage(errorContainer, "Oops, something went wrong!");
		const previousKey = Object.keys(SortOrder).find(
			(key) => SortOrder[key] === sortOrder,
		);
		const radio = radioGroup.querySelector(`input[value='${previousKey}']`);
		radio.checked = true;
	} finally {
		isLoading = false;
		setLoading(isLoading);
	}
});

const observer = new IntersectionObserver(infiniteScroll, {
	rootMargin: "33%",
});

async function infiniteScroll(entries) {
	const [entry] = entries;

	if (!entry.isIntersecting) return;

	if (isLoading) return;

	try {
		clearMessage(errorContainer);
		isLoading = true;
		setLoading(isLoading, false);
		const photos = await getAllPhotos(sortOrder, offset);

		if (!photos.hasMore) {
			observer.disconnect();
		}

		offset += photos.photos.length;

		const tileElements = renderPhotos(photos.photos, photoGrid);
		setCurrentPhotoData(tileElements, photos.photos);
		processTiles();
	} catch (error) {
		console.error(error);
		setMessage(errorContainer, "Oops, something went wrong!");
	} finally {
		isLoading = false;
		setLoading(isLoading, false);
	}
}

observer.observe(sentinel);
