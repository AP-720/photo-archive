import { getPhotos, renderPhotos } from "./photos.js";

const photoGrid = document.querySelector("#photo_grid")

const images = await getPhotos()

renderPhotos(images.photos, photoGrid)


