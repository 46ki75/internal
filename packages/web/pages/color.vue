<template>
  <main class="main">
    <ElmColorTable
      :colors="[
        { name: 'brown', code: '#a17c5b' },
        { name: 'crimson', code: '#c56565' },
        { name: 'amber', code: '#d48b70' },
        { name: 'gold', code: '#cdb57b' },
        { name: 'emerald', code: '#59b57c' },
        { name: 'blue', code: '#6987b8' },
        { name: 'purple', code: '#9771bd' },
        { name: 'pink', code: '#c9699e' },
        { name: 'slate', code: '#868e9c' }
      ]"
    />
  </main>
</template>

<script setup lang="ts">
import { ElmColorTable } from '@elmethis/core'
</script>

<style scoped lang="scss">
.main {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
