<template>
  <div :class="$style.wrapper">
    <header :class="$style.header">
      <a
        :href="notionUrl.replace('https://', 'notion://')"
        target="_blank"
        rel="noopener norefferer"
      >
        <ElmMdiIcon
          :class="$style.edit"
          :d="mdiTagEditOutline"
          size="1.25rem"
        />
      </a>
      <ElmMdiIcon
        v-if="nsfw"
        :d="mdiEmoticonLolOutline"
        size="1.25rem"
        color="#c56565"
        style="padding: 0.25rem"
      />
    </header>
    <a
      :class="$style.container"
      :href="href"
      target="_blank"
      rel="noopener noreferrer"
    >
      <img
        v-if="favicon != null"
        :class="$style.favicon"
        :src="favicon"
        :alt="`favicon of ${name ?? href}`"
      />

      <ElmMdiIcon v-else :d="mdiEarth" size="2.5rem" style="opacity: 0.7" />

      <div :class="$style.text">
        <ElmInlineText :text="name ?? href" size=".6rem" />
      </div>
    </a>
  </div>
</template>

<script setup lang="ts">
import { mdiTagEditOutline } from "@mdi/js";

import { ElmInlineText, ElmMdiIcon } from "@elmethis/core";

import { mdiEmoticonLolOutline, mdiEarth } from "@mdi/js";

export interface ElmBookmarkIconProps {
  name?: string;

  href: string;

  favicon?: string | null;

  notionUrl: string;

  nsfw: boolean;
}

withDefaults(defineProps<ElmBookmarkIconProps>(), {});
</script>

<style module lang="scss">
.wrapper {
  padding: 0.125rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border: solid 1px rgba(#788191, 0.3);
  border-radius: 0.25rem;
}

.header {
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

.edit {
  padding: 0.25rem;
  border-radius: 0.125rem;
  cursor: pointer;
  transition: background-color 100ms;
  &:hover {
    background-color: rgba(black, 0.1);
    [data-theme="dark"] & {
      background-color: rgba(white, 0.1);
    }
  }
}

.container {
  all: unset;
  box-sizing: border-box;
  padding: 0.5rem;
  width: 5rem;
  height: 5.5rem;
  border-radius: 0.25rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-around;
  cursor: pointer;
  transition: background-color 100ms;
  &:hover {
    background-color: rgba(black, 0.1);
    [data-theme="dark"] & {
      background-color: rgba(white, 0.1);
    }
  }
}

.favicon {
  width: 2.5rem;
  height: 2.5rem;
}

.text {
  width: 4rem;
  text-align: center;
  vertical-align: middle;
  line-height: 0.75rem;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
