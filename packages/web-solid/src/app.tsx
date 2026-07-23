import { MetaProvider, Link, Meta, Title } from "@solidjs/meta";
import { Router, useLocation } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import {
  IsRestoringProvider,
  QueryClientProvider,
} from "@tanstack/solid-query";
import { persistQueryClient } from "@tanstack/solid-query-persist-client";
import {
  createSignal,
  onCleanup,
  onMount,
  Suspense,
  type ParentProps,
} from "solid-js";
import { isServer } from "solid-js/web";

import "@elmethis/solid/style.css";
import "./global.css";

import { AppShell } from "~/container/app-shell";
import { AnkiProvider } from "~/context/anki-context";
import { AuthProvider } from "~/context/auth-context";
import {
  createQueryClient,
  QUERY_CACHE_DURATION,
  QUERY_CACHE_STORAGE_KEY,
  shouldPersistQuery,
} from "~/query-client";

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

const AppRouter = () => (
  <Router root={Root}>
    <FileRoutes />
  </Router>
);

const QueryProvider = (props: ParentProps) => {
  const queryClient = createQueryClient();
  const [isRestoring, setIsRestoring] = createSignal(!isServer);

  onMount(() => {
    const persister = createSyncStoragePersister({
      storage: window.localStorage,
      key: QUERY_CACHE_STORAGE_KEY,
    });
    const [unsubscribe, restore] = persistQueryClient({
      queryClient,
      persister,
      maxAge: QUERY_CACHE_DURATION,
      buster: "v2",
      dehydrateOptions: {
        shouldDehydrateMutation: () => false,
        shouldDehydrateQuery: shouldPersistQuery,
      },
    });
    void restore.finally(() => setIsRestoring(false));
    onCleanup(unsubscribe);
  });

  return (
    <QueryClientProvider client={queryClient}>
      <IsRestoringProvider value={isRestoring}>
        {props.children}
      </IsRestoringProvider>
    </QueryClientProvider>
  );
};

export default function App() {
  return (
    <QueryProvider>
      <AppRouter />
    </QueryProvider>
  );
}
