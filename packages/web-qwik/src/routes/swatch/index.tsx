import { component$, type CSSProperties } from "@builder.io/qwik";

import styles from "./swatch.module.css";
import { ElmA2uiRenderer } from "@elmethis/qwik";

export interface IndexProps {
  class?: string;

  style?: CSSProperties;
}

export default component$<IndexProps>(({ class: className, style }) => {
  return (
    <div class={[styles["index"], className]} style={style}>
      <ElmA2uiRenderer
        messages={[
          {
            version: "v0.9",
            createSurface: {
              surfaceId: "typography",
              catalogId:
                "https://a2ui.org/specification/v0_9/basic_catalog.json",
            },
          },
          {
            version: "v0.9",
            updateComponents: {
              surfaceId: "typography",
              components: [
                {
                  component: "Column",
                  id: "root",
                  children: ["h1", "h2", "h3", "h4", "h5", "body", "caption"],
                },
                {
                  component: "Text",
                  id: "h1",
                  variant: "h1",
                  text: "Heading 1",
                },
                {
                  component: "Text",
                  id: "h2",
                  variant: "h2",
                  text: "Heading 2",
                },
                {
                  component: "Text",
                  id: "h3",
                  variant: "h3",
                  text: "Heading 3",
                },
                {
                  component: "Text",
                  id: "h4",
                  variant: "h4",
                  text: "Heading 4",
                },
                {
                  component: "Text",
                  id: "h5",
                  variant: "h5",
                  text: "Heading 5",
                },
                {
                  component: "Text",
                  id: "body",
                  variant: "body",
                  text: "Body text — the default paragraph style.",
                },
                {
                  component: "Text",
                  id: "caption",
                  variant: "caption",
                  text: "Caption text — small, muted.",
                },
              ],
            },
          },
        ]}
      />
    </div>
  );
});
