<template>
  <ElmCheckbox
    label=""
    v-model="isDone"
    :loading="todoStore.updateState.loading"
  />
</template>

<script setup lang="ts">
import { ElmCheckbox } from '@elmethis/core'

const todoStore = useToDoStore()

const props = defineProps<{
  id: string
}>()

const isDone = defineModel<boolean>()

watch(isDone, async (nextValue) => {
  if (nextValue) {
    if (!todoStore.fetchState.loading && !todoStore.createState.loading) {
      await todoStore.update({ id: props.id, isDone: true })
    }
  }
})
</script>

<style scoped lang="scss"></style>
