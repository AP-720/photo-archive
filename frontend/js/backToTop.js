const SCREENS_BEFORE_BUTTON = 7;
const backToTop = document.querySelector("#to_top");

window.addEventListener("scroll", () => {
	const triggerDistance = window.innerHeight * SCREENS_BEFORE_BUTTON;
	backToTop.classList.toggle("visible", window.scrollY > triggerDistance);
});

backToTop.addEventListener("click", () => {
	window.scrollTo({ top: 0, behavior: "smooth" });
});
