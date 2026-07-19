import { MetaProvider, Link, Meta, Title } from "@solidjs/meta";
import { Router, useLocation } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense, type ParentProps } from "solid-js";

import "@elmethis/solid/style.css";
import "./global.css";

import { AppShell } from "~/container/app-shell";
import { AnkiProvider } from "~/context/anki-context";
import { AuthProvider } from "~/context/auth-context";

const Root = (props: ParentProps) => {
  const location = useLocation();
  const stage = import.meta.env.VITE_STAGE_NAME ?? "dev";
  const origin = `https://${stage === "prod" ? "internal" : `${stage}-internal`}.46ki75.com`;

  return (
    <MetaProvider>
      <Title>Internal</Title>
      <Meta name="description" content="46ki75 internal tools" />
      <Meta name="viewport" content="width=device-width, initial-scale=1" />
      <Link rel="canonical" href={`${origin}${location.pathname}`} />
      <Link rel="icon" href="/favicon.svg" />
      <Link rel="manifest" href="/manifest.json" />
      <Link rel="preconnect" href="https://fonts.googleapis.com" />
      <Link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
      <Link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@300..700&family=Fira+Sans:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
      />
      <AuthProvider>
        <AnkiProvider>
          <AppShell>
            <Suspense>{props.children}</Suspense>
          </AppShell>
        </AnkiProvider>
      </AuthProvider>
    </MetaProvider>
  );
};

export default function App() {
  return (
    <Router root={Root}>
      <FileRoutes />
    </Router>
  );
}
