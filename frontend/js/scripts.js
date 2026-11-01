import { getPhotos, renderPhotos, seenIds } from "./photos.js";
import "./gallery.js";
import { processTiles } from "./masonry.js";
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

	renderPhotos(images.photos, photoGrid);

	processTiles();
} catch (error) {
	console.error(error);
	setMessage(messageContainer, "Oops, something went wrong!");
} finally {
	setLoading(false);
}
