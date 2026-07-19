import {
  createHandler,
  StartServer,
  type DocumentComponentProps,
} from "@solidjs/start/server";

const Document = (props: DocumentComponentProps) => (
  <html lang="en-us" class="transition">
    <head>{props.assets}</head>
    <body lang="en">
      <div id="app">{props.children}</div>
      {props.scripts}
    </body>
  </html>
);

export default createHandler(() => <StartServer document={Document} />);
