<template>
  <ElmCheckbox label="" v-model="isDone" />
</template>

<script setup lang="ts">
import { ElmCheckbox } from '@elmethis/core'

const todoStore = useToDoStore()

const isDone = defineModel<boolean>({})

watch(isDone, async (nextValue) => {
  if (nextValue) {
    if (!todoStore.fetchState.loading && todoStore.createState.loading) {
      //   await todoStore
    }
  }
})
</script>

<style scoped lang="scss"></style>
