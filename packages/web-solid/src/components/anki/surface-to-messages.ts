const BLOCK_CATALOG_ID =
  "https://46ki75.github.io/elmethis/a2ui/v0_9/block_catalog.json";

interface A2uiSurface {
  root: string;
  components: Record<string, { id: string; component: string }>;
}

export function surfaceToMessages(raw: unknown, surfaceId: string): object[] {
  if (!raw || typeof raw !== "object") return [];
  const surface = raw as A2uiSurface;
  const components = surface.components ?? {};

  return [
    {
      version: "v0.9",
      createSurface: { surfaceId, catalogId: BLOCK_CATALOG_ID },
    },
    {
      version: "v0.9",
      updateComponents: { surfaceId, components: Object.values(components) },
    },
  ];
}
