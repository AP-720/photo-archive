import { getPhotos, renderPhotos, seenIds } from "./photos.js";
import { processTiles, setCurrentPhotoData } from "./masonry.js";
import { setLoading, setMessage, clearMessage } from "./loading.js";

const button = document.querySelector("#button_dice");
const photoGrid = document.querySelector("#photo_grid");
const messageContainer = document.querySelector("#message_container");

button.addEventListener("click", async () => {
	const weight = document.querySelector("#weight").value;

	try {
		clearMessage(messageContainer);
		setLoading(true);

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
	} catch (error) {
		console.error(error);
		setMessage(messageContainer, "Oops, something went wrong!");
	} finally {
		setLoading(false);
	}
});
