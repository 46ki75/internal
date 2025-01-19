<template>
  <ElmCheckbox :label="label" v-model="isDone" />
</template>

<script setup lang="ts">
import { ElmCheckbox } from '@elmethis/core'

const routineStore = useRoutineStore()

const props = defineProps<{
  id: string
  isDone: boolean
  label: string
}>()

const isDone = defineModel<boolean>({})

onMounted(async () => {
  isDone.value = props.isDone
})

watch(isDone, async () => {
  console.log('props', props)

  if (isDone.value != null) {
    await routineStore.update({
      id: props.id,
      isDone: isDone.value
    })
  }
})
</script>

<style scoped></style>
