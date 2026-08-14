import { SortOrder, getAllPhotos, renderPhotos } from "./photos.js";
import { processTiles, setCurrentPhotoData } from "./masonry.js";

let offset = 0;
let isLoading = false;
let sortOrder = SortOrder.NEWEST;

const photoGrid = document.querySelector("#photo_grid");
const radioGroup = document.querySelector(".sort_wrapper");

const images = await getAllPhotos(sortOrder, offset);
offset = images.photos.length;

const tileElements = renderPhotos(images.photos, photoGrid);

setCurrentPhotoData(tileElements, images.photos);
processTiles();

radioGroup.addEventListener("change", async (event) => {
	if (isLoading) return;

	sortOrder = SortOrder[event.target.value];
	let previousCount = offset;

	try {
		isLoading = true;
		const photos = await getAllPhotos(sortOrder, 0, previousCount);

		offset = photos.photos.length;

		const tiles = document.querySelectorAll(".tile");
		tiles.forEach((tile) => tile.remove());

		const tileElements = renderPhotos(photos.photos, photoGrid);
		setCurrentPhotoData(tileElements, photos.photos);
		processTiles();
	} finally {
		isLoading = false;
	}
});
