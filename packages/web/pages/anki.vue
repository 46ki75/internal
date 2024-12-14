<template>
  <main class="main">
    <div class="translate">
      <ElmToggle summary="Translation">
        <Translate />
      </ElmToggle>
    </div>
    <Anki />
  </main>
</template>

<script setup lang="ts">
import { ElmToggle } from "@elmethis/core";
</script>

<style scoped lang="scss">
.main {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.translate {
  width: 100%;
  max-width: 800px;
  margin-bottom: 2rem;
}
</style>
