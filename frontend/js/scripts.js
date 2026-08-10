import { getPhotos, renderPhotos } from "./photos.js";
import "./gallery.js";
import { processTiles } from "./masonry.js";

const photoGrid = document.querySelector("#photo_grid");

const images = await getPhotos();

const tileElements = renderPhotos(images.photos, photoGrid);

processTiles(tileElements, images.photos)