const button = document.querySelector("#button_dice");
const loadingSpinner = document.querySelector("#loader_container");
const photoGrid = document.querySelector("#photo_grid");

export function setLoading(isLoading, dimPanel = true) {
	if (button) {
		button.disabled = isLoading;
	}
	loadingSpinner.style.display = isLoading ? "block" : "none";
	photoGrid.classList.toggle("busy", isLoading && dimPanel);
}
