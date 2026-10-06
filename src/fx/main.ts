import { initScroll, initCursor, initSplitCopy, initNavTheme, tilt } from "./core";
import { initPreloader } from "./preloader";
import { initMenu } from "./menu";
import { initParticleLogo } from "./particles";
import { initServices, initWhiteLabel, initPhases, initMarquees } from "./sections";

initScroll();
initCursor();
const preloading = initPreloader();
initSplitCopy(preloading);
initMenu();
initNavTheme();
tilt(document.querySelector(".fx-hero"), document.querySelector(".fx-hero-title"));
tilt(document.querySelector(".fx-particles"), document.querySelector(".fx-particles-title"), 10);
initParticleLogo(document.querySelector<HTMLCanvasElement>("#fx-particle-canvas"));
initServices();
initWhiteLabel();
initPhases();
initMarquees();
