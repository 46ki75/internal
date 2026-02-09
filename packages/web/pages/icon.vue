<template>
  <div :class="$style.wrapper">
    <div>
      <ElmSquareLoadingIcon v-if="!data" />

      <div v-for="icon of data" :key="icon.id" :class="$style['icon-box']">
        <ElmInlineText>{{ icon.id }}</ElmInlineText>
        <img :src="icon.url" :alt="icon.id" />
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
  display: flex;
  justify-content: center;
  align-items: center;
}

.icon-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}
</style>
