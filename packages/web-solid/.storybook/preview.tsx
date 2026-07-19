import { MemoryRouter, Route } from "@solidjs/router";
import {
  createDecorator,
  createJSXDecorator,
  type Preview,
} from "storybook-solidjs-vite";

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
      return Story();
    }),
    createJSXDecorator((Story) => (
      <MemoryRouter>
        <Route path="*path" component={Story} />
      </MemoryRouter>
    )),
  ],
};

export default preview;
