import { createApp } from "vue";
import App from "./CommandPalette.vue";

const body = document.querySelector("body");
const child = document.createElement("div");
child.setAttribute("id", "app");
body?.appendChild(child);

createApp(App).mount("#app");
