const photoGrid = document.querySelector("#photo_grid");

const styles = getComputedStyle(photoGrid);

const gap = parseFloat(styles.getPropertyValue("gap"));
const rowUnit = parseFloat(styles.getPropertyValue("grid-auto-rows"));
let timer;

/**
 * Calculates and applies the correct grid-row span for a single photo tile, so its rendered
 * height matches its true aspect ratio (masonry layout).
 *
 * Formula 1: renderedHeight = columnWidth × (naturalHeight / naturalWidth)
 * Formula 2: rowSpan = ceil((renderedHeight + gap) / (rowUnit + gap))
 * Rounds up (ceil) so the tile is never shorter than the image — avoids cropping.
 *
 * Reads the natural size from the tile's data-width and data-height attributes.
 * Relies on `gap` and `rowUnit` from the module-level CSS read at the top of this file,
 * which are read once at load, so they must not change at different screen widths.
 *
 * @param {HTMLElement} tileElement - the rendered .tile div to position
 * @param {number} columnWidth - the rendered width of a column in pixels
 */
export function setTileGrid(tileElement, columnWidth) {
	const tileHeight = Number(tileElement.dataset.height);
	const tileWidth = Number(tileElement.dataset.width);
	const renderedHeight = columnWidth * (tileHeight / tileWidth);
	const rowSpan = Math.ceil((renderedHeight + gap) / (rowUnit + gap));
	tileElement.style.gridRow = `span ${rowSpan}`;
}

/**
 * Lays out every tile on the page. The column width is read once, because all columns are equal, which avoids forcing a layout recalculation for each tile.
 */

export function processTiles() {
	const tiles = document.querySelectorAll(".tile");
	if (tiles.length === 0) return;

	const width = tiles[0].clientWidth;
	for (const tile of tiles) {
		setTileGrid(tile, width);
	}
}

window.addEventListener("resize", () => {
	clearTimeout(timer);
	timer = setTimeout(() => {
		processTiles();
	}, 300);
});
