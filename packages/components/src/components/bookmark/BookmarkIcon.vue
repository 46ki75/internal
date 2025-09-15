<template>
  <div :class="$style.wrapper">
    <header :class="$style.header">
      <a
        :href="notionUrl.replace('https://', 'notion://')"
        target="_blank"
        rel="noopener noreferrer"
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
      :class="$style['link-container']"
      :href="href"
      target="_self"
      rel="noopener noreferrer"
    >
      <img
        v-if="favicon != null"
        :class="$style.favicon"
        :src="favicon"
        :alt="`favicon of ${name ?? href}`"
      />

      <ElmMdiIcon v-else :d="mdiEarth" size="2rem" style="opacity: 0.7" />

      <div :class="$style.text">
        <ElmInlineText :text="name ?? href" size="0.5em" />
      </div>
    </a>
  </div>
</template>

<script setup lang="ts">
import { ElmInlineText, ElmMdiIcon } from "@elmethis/core";

import { mdiEmoticonLolOutline, mdiEarth, mdiTagEditOutline } from "@mdi/js";

export interface BookmarkIconProps {
  name?: string;

  href: string;

  favicon?: string | null;

  notionUrl: string;

  nsfw: boolean;
}

withDefaults(defineProps<BookmarkIconProps>(), {});
</script>

<style module lang="scss">
.wrapper {
  max-width: 4rem;
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

.link-container {
  all: unset;
  overflow: hidden;
  box-sizing: border-box;
  padding: 0.5rem;
  width: 100%;
  height: 4rem;
  border-radius: 0.25rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
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
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
}

.text {
  flex-grow: 0;
  width: 4rem;
  text-align: center;
  vertical-align: middle;
  line-height: 0.75rem;
  text-overflow: ellipsis;
}
</style>
