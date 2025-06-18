import { createApp } from "vue";
import App from "./App.vue";

const id = "internal-extension-command-palette";

const body = document.querySelector("body");
const child = document.createElement("div");
child.setAttribute("id", id);
body?.appendChild(child);

createApp(App).mount(`#${id}`);
