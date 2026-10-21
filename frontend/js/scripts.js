import { getPhotos, renderPhotos, seenIds } from "./photos.js";
import "./gallery.js";
import { processTiles, setCurrentPhotoData } from "./masonry.js";

const photoGrid = document.querySelector("#photo_grid");

const images = await getPhotos(0.5, seenIds);

for (const photo of images.photos) {
	seenIds.add(photo.id);
}

const tileElements = renderPhotos(images.photos, photoGrid);

setCurrentPhotoData(tileElements, images.photos);
processTiles();
