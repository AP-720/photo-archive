const photoGrid = document.querySelector("#photo_grid");

const styles = getComputedStyle(photoGrid);

const gap = parseFloat(styles.getPropertyValue("gap"));
const rowUnit = parseFloat(styles.getPropertyValue("grid-auto-rows"));

/**
 * Calculates and applies the correct grid-row span for a single photo tile, so its rendered height matches its true aspect 
 ratio (masonry layout).
 *
 * Formula 1: renderedHeight = columnWidth × (naturalHeight / naturalWidth)
 * Formula 2: rowSpan = ceil((renderedHeight + gap) / (rowUnit + gap))
 * Rounds up (ceil) so the tile is never shorter than the image — avoids cropping.
 *
 * Relies on `gap` and `rowUnit` from the module-level CSS read at the top of this file.
 *
 * @param {HTMLElement} tileElement - the rendered .tile div to measure and position
 * @param {Object} photo - the photo's data object, needs .width and .height (natural pixel dimensions)
 */
export function setTileGrid(tileElement, photo) {
	const columnWidth = tileElement.clientWidth;
	const renderedHeight = columnWidth * (photo.height / photo.width);
	const rowSpan = Math.ceil((renderedHeight + gap) / (rowUnit + gap));
	tileElement.style.gridRow = `span ${rowSpan}`;
}

export function processTiles(tiles, photos) {
	for (let i = 0; photos.length > i; i++) {
		setTileGrid(tiles[i], photos[i]);
	}
}
