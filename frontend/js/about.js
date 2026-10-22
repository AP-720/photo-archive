import { getPhotos } from "./photos.js";
import { buildCloudinaryUrl } from "./cloudinary.js";

let seenIds = []

const aboutImage = document.querySelector('#about_image')

const  photos = await getPhotos(0.5, seenIds, 1)

aboutImage.src = buildCloudinaryUrl(photos.photos[0]['public_id'])

// console.log(photos.photos[0]['public_id']);
