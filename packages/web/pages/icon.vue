<template>
  <div>
    <div>
      <h1>Icon Page</h1>

      <div v-for="icon of data">
        <p>Icon Data:</p>
        <pre>{{ icon.id }}</pre>
        <img :src="icon.url" :alt="icon.id" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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

<style module lang="scss"></style>
