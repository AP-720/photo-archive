import { getPhotos, renderPhotos, seenIds } from "./photos.js";
import { processTiles, setCurrentPhotoData } from "./masonry.js";

const button = document.querySelector("#button_dice");
const photoGrid = document.querySelector("#photo_grid");

button.addEventListener("click", async () => {
	const weight = document.querySelector("#weight").value;

	const photos = await getPhotos(weight, seenIds);

	if (!photos.hasMore) {
		seenIds.clear();
	}

	for (const photo of photos.photos) {
		seenIds.add(photo.id);
	}

	const tiles = document.querySelectorAll(".tile");
	tiles.forEach((tile) => tile.remove());

	const tileElements = renderPhotos(photos.photos, photoGrid);
	setCurrentPhotoData(tileElements, photos.photos);
	processTiles();
	window.scrollTo({ top: 0, behavior: "smooth" });
});
