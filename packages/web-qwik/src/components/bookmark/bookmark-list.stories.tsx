import type { Meta, StoryObj } from "storybook-framework-qwik";
import { BookmarkList, type BookmarkListProps } from "./bookmark-list";

import icon from "../../../public/favicon.svg?url";

const meta: Meta<BookmarkListProps> = {
  title: "Components/Bookmark/bookmark-list",
  component: BookmarkList,
  tags: ["autodocs"],
  args: {},
};

export default meta;
type Story = StoryObj<BookmarkListProps>;

const TAG_FRONTEND = { id: "925b3496-680f-4c6d-8b01-04a6367d0f71", name: "Frontend", color: "#c56565" };
const TAG_BACKEND = { id: "b2e4f123-1a2b-3c4d-5e6f-7a8b9c0d1e2f", name: "Backend", color: "#65a8c5" };
const TAG_DEVOPS = { id: "d3f5a678-2b3c-4d5e-6f7a-8b9c0d1e2f3a", name: "DevOps", color: "#65c583" };
const TAG_TOOLS = { id: "e4a6b789-3c4d-5e6f-7a8b-9c0d1e2f3a4b", name: "Tools", color: "#c5a265" };
const TAG_DOCS = { id: "f5b7c890-4d5e-6f7a-8b9c-0d1e2f3a4b5c", name: "Docs", color: "#a265c5" };

export const Primary: Story = {
  args: {
    bookmarks: [
      {
        id: "338f8817-9da1-47c8-b459-5a41ee853090",
        icon: icon,
        label: "Qwik",
        favorite: true,
        url: "https://qwik.dev/",
        editUrl: "https://github.com/QwikDev/qwik",
        tag: TAG_FRONTEND,
      },
      {
        id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        icon: icon,
        label: "React",
        favorite: true,
        url: "https://react.dev/",
        editUrl: "https://github.com/facebook/react",
        tag: TAG_FRONTEND,
      },
      {
        id: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
        icon: icon,
        label: "Vue.js",
        favorite: false,
        url: "https://vuejs.org/",
        editUrl: "https://github.com/vuejs/vue",
        tag: TAG_FRONTEND,
      },
      {
        id: "c3d4e5f6-a7b8-9012-cdef-123456789012",
        icon: icon,
        label: "Tailwind CSS",
        favorite: true,
        url: "https://tailwindcss.com/",
        editUrl: "https://github.com/tailwindlabs/tailwindcss",
        tag: TAG_FRONTEND,
      },
      {
        id: "d4e5f6a7-b8c9-0123-defa-234567890123",
        icon: icon,
        label: "Vite",
        favorite: false,
        url: "https://vitejs.dev/",
        editUrl: "https://github.com/vitejs/vite",
        tag: TAG_FRONTEND,
      },
      {
        id: "e5f6a7b8-c9d0-1234-efab-345678901234",
        icon: icon,
        label: "Node.js",
        favorite: true,
        url: "https://nodejs.org/",
        editUrl: "https://github.com/nodejs/node",
        tag: TAG_BACKEND,
      },
      {
        id: "f6a7b8c9-d0e1-2345-fabc-456789012345",
        icon: icon,
        label: "Hono",
        favorite: false,
        url: "https://hono.dev/",
        editUrl: "https://github.com/honojs/hono",
        tag: TAG_BACKEND,
      },
      {
        id: "a7b8c9d0-e1f2-3456-abcd-567890123456",
        icon: icon,
        label: "Prisma",
        favorite: false,
        url: "https://www.prisma.io/",
        editUrl: "https://github.com/prisma/prisma",
        tag: TAG_BACKEND,
      },
      {
        id: "b8c9d0e1-f2a3-4567-bcde-678901234567",
        icon: icon,
        label: "PostgreSQL",
        favorite: true,
        url: "https://www.postgresql.org/",
        editUrl: "https://github.com/postgres/postgres",
        tag: TAG_BACKEND,
      },
      {
        id: "c9d0e1f2-a3b4-5678-cdef-789012345678",
        icon: icon,
        label: "Redis",
        favorite: false,
        url: "https://redis.io/",
        editUrl: "https://github.com/redis/redis",
        tag: TAG_BACKEND,
      },
      {
        id: "d0e1f2a3-b4c5-6789-defa-890123456789",
        icon: icon,
        label: "Docker",
        favorite: true,
        url: "https://www.docker.com/",
        editUrl: "https://github.com/docker",
        tag: TAG_DEVOPS,
      },
      {
        id: "e1f2a3b4-c5d6-7890-efab-901234567890",
        icon: icon,
        label: "GitHub Actions",
        favorite: false,
        url: "https://github.com/features/actions",
        editUrl: "https://github.com/actions",
        tag: TAG_DEVOPS,
      },
      {
        id: "f2a3b4c5-d6e7-8901-fabc-012345678901",
        icon: icon,
        label: "Terraform",
        favorite: false,
        url: "https://www.terraform.io/",
        editUrl: "https://github.com/hashicorp/terraform",
        tag: TAG_DEVOPS,
      },
      {
        id: "a3b4c5d6-e7f8-9012-abcd-123456789012",
        icon: icon,
        label: "VS Code",
        favorite: true,
        url: "https://code.visualstudio.com/",
        editUrl: "https://github.com/microsoft/vscode",
        tag: TAG_TOOLS,
      },
      {
        id: "b4c5d6e7-f8a9-0123-bcde-234567890123",
        icon: icon,
        label: "Storybook",
        favorite: false,
        url: "https://storybook.js.org/",
        editUrl: "https://github.com/storybookjs/storybook",
        tag: TAG_TOOLS,
      },
      {
        id: "c5d6e7f8-a9b0-1234-cdef-345678901234",
        icon: icon,
        label: "Biome",
        favorite: false,
        url: "https://biomejs.dev/",
        editUrl: "https://github.com/biomejs/biome",
        tag: TAG_TOOLS,
      },
      {
        id: "d6e7f8a9-b0c1-2345-defa-456789012345",
        icon: icon,
        label: "Vitest",
        favorite: false,
        url: "https://vitest.dev/",
        editUrl: "https://github.com/vitest-dev/vitest",
        tag: TAG_TOOLS,
      },
      {
        id: "e7f8a9b0-c1d2-3456-efab-567890123456",
        icon: icon,
        label: "MDN Web Docs",
        favorite: true,
        url: "https://developer.mozilla.org/",
        editUrl: "https://github.com/mdn/content",
        tag: TAG_DOCS,
      },
      {
        id: "f8a9b0c1-d2e3-4567-fabc-678901234567",
        icon: icon,
        label: "TypeScript Handbook",
        favorite: false,
        url: "https://www.typescriptlang.org/docs/",
        editUrl: "https://github.com/microsoft/TypeScript-Website",
        tag: TAG_DOCS,
      },
      {
        id: "a9b0c1d2-e3f4-5678-abcd-789012345678",
        icon: icon,
        label: "Can I use",
        favorite: false,
        url: "https://caniuse.com/",
        editUrl: "https://github.com/nicowillis/caniuse",
        tag: TAG_DOCS,
      },
    ],
  },
};
