const button = document.querySelector("#button_dice");
const loadingSpinner = document.querySelector("#loader_container");
const photoGrid = document.querySelector("#photo_grid");

const messageBox = document.querySelector(
	"#message_container, #error_message_container",
);

if (messageBox) {
	messageBox.addEventListener("click", () => {
		clearMessage(messageBox)
	});
}

let timeoutId;

export function setLoading(isLoading, dimPanel = true) {
	if (button) {
		button.disabled = isLoading;
	}
	loadingSpinner.style.display = isLoading ? "block" : "none";
	photoGrid.classList.toggle("busy", isLoading && dimPanel);
}

export function setMessage(container, message) {
	clearTimeout(timeoutId);
	container.textContent = message;
	timeoutId = setTimeout(() => clearMessage(container), 4000);
}

export function clearMessage(container) {
	clearTimeout(timeoutId);
	container.textContent = "";
}
