<template>
  <div>
    <div :class="$style.wrapper">
      <ElmSquareLoadingIcon v-if="!data" />

      <div v-for="icon of data" :key="icon.id" :class="$style['icon-box']">
        <img
          :class="$style.icon"
          width="48"
          height="48"
          :src="icon.url"
          :alt="icon.id"
        />
        <ElmInlineText size="0.8rem">{{ icon.name }}</ElmInlineText>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElmInlineText, ElmSquareLoadingIcon } from "@elmethis/vue";
import { openApiClient } from "~/openapi/client";

export interface IconProps {}

withDefaults(defineProps<IconProps>(), {});

const authStore = useAuthStore();

const { data } = useAsyncData("", async () => {
  await authStore.refreshIfNeed();

  if (authStore.session.accessToken == null) {
    throw new Error("No access token");
  }

  const response = await openApiClient.GET("/api/v1/icon", {
    params: {
      header: {
        Authorization: authStore.session.accessToken,
      },
    },
  });

  return response.data;
});
</script>

<style module lang="scss">
.wrapper {
  margin-block: 2rem;
  width: 100%;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  text-align: center;
  font-family: monospace;
}

.icon {
  width: 4rem;
  height: 4rem;
}

.icon-box {
  padding: 0.25rem;
  height: 8rem;
  width: 8rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  border: solid 1px rgba(gray, 0.25);
  border-radius: 0.5rem;
}
</style>
