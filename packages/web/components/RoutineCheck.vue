<template>
  <ElmCheckbox label="" v-model:is-checked="isDone" />
</template>

<script setup lang="ts">
import { ElmCheckbox } from '@elmethis/core'

const routineStore = useRoutineStore()

const props = defineProps<{
  id: string
  isDone: boolean
}>()

const isDone = defineModel({ default: false })

onMounted(async () => {
  isDone.value = props.isDone
})

watch(isDone, async () => {
  console.log('props', props)
  await routineStore.update({
    id: props.id,
    isDone: isDone.value
  })
})
</script>

<style scoped></style>
