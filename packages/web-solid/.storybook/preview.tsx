import { createDecorator, type Preview } from "storybook-solidjs-vite";
import { Router } from "@solidjs/router";

import "@elmethis/core/tokens.css";
import "@elmethis/solid/style.css";
import "../src/global.css";
import "./sb.css";

const preview: Preview = {
  parameters: {
    a11y: {
      options: {
        checks: { "color-contrast": { options: { noScroll: true } } },
        restoreScroll: true,
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  globalTypes: {
    theme: {
      description: "Global theme for components",
      toolbar: {
        title: "Theme",
        icon: "circlehollow",
        items: ["light", "dark"],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: "light" },
  decorators: [
    createDecorator((Story, context) => {
      const theme = context.globals.theme || "light";
      document.documentElement.style.colorScheme = theme;
      document.documentElement.setAttribute("data-theme", theme);
      return <Router>{Story()}</Router>;
    }),
  ],
};

export default preview;
