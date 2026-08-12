import { getPhotos, renderPhotos } from "./photos.js";
import "./gallery.js";
import { processTiles, setCurrentPhotoData } from "./masonry.js";

const photoGrid = document.querySelector("#photo_grid");

const images = await getPhotos();

const tileElements = renderPhotos(images.photos, photoGrid);

setCurrentPhotoData(tileElements, images.photos);
processTiles();
