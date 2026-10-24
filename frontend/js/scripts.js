import { getPhotos, renderPhotos, seenIds } from "./photos.js";
import "./gallery.js";
import { processTiles, setCurrentPhotoData } from "./masonry.js";
import { setLoading } from "./loading.js";
import "./backToTop.js"

const photoGrid = document.querySelector("#photo_grid");

try {
	setLoading(true);
	const images = await getPhotos(0.5, seenIds);

	for (const photo of images.photos) {
		seenIds.add(photo.id);
	}

	const tileElements = renderPhotos(images.photos, photoGrid);

	setCurrentPhotoData(tileElements, images.photos);
	processTiles();
} finally {
	setLoading(false);
}
