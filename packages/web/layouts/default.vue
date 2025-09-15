<script setup lang="ts">
import { ElmInlineText } from "@elmethis/core";
</script>

<template>
  <NuxtLoadingIndicator
    color="#cdb57b"
    :height="4"
    :duration="2000"
    :throttle="50"
  />
  <Header />

  <main class="main">
    <slot />
  </main>

  <footer class="footer">
    <ElmInlineText text="FOOTER" />
  </footer>
</template>

<style scoped lang="scss">
@keyframes fade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.main {
  box-sizing: border-box;
  padding: 0.5rem;
  min-height: calc(100vh - 24rem);
  animation-name: fade;
  animation-duration: 500ms;
  animation-fill-mode: both;
  animation-iteration-count: 1;
}

.footer {
  margin-block-start: 8rem;
  height: 20rem;
  width: 100%;
  box-shadow: 0 0 0.25rem rgba(black, 0.15);

  display: flex;
  justify-content: center;
  align-items: center;

  background-color: rgba(white, 0.2);

  [data-theme="dark"] & {
    background-color: rgba(black, 0.1);
  }
}
</style>
