import { getPhotos, renderPhotos } from "./photos.js";
import "./gallery.js";

const photoGrid = document.querySelector("#photo_grid")

const images = await getPhotos()

renderPhotos(images.photos, photoGrid)


