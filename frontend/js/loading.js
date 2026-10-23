const button = document.querySelector("#button_dice");
const loadingSpinner = document.querySelector("#loader_container");
const photoGrid = document.querySelector("#photo_grid");


export function setLoading(isLoading) {
	loadingSpinner.style.display = isLoading ? "block" : "none";
	button.disabled = isLoading;
    photoGrid.classList.toggle("busy", isLoading);
}
