import { getPhotos, renderPhotos, seenIds } from "./photos.js";
import "./gallery.js";
import { processTiles, setCurrentPhotoData } from "./masonry.js";
import { setLoading, setMessage, clearMessage } from "./loading.js";
import "./backToTop.js";

const photoGrid = document.querySelector("#photo_grid");
const messageContainer = document.querySelector("#message_container");

try {
	clearMessage(messageContainer);
	setLoading(true);
	const images = await getPhotos(0.5, seenIds);

	for (const photo of images.photos) {
		seenIds.add(photo.id);
	}

	const tileElements = renderPhotos(images.photos, photoGrid);

	setCurrentPhotoData(tileElements, images.photos);
	processTiles();
} catch (error) {
	console.error(error);
	setMessage(messageContainer, "Oops, something went wrong!");
} finally {
	setLoading(false);
}
