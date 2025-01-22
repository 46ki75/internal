<template>
  <div>
    <ElmHeading1 text="Routine" />

    <ElmParagraph><span>毎日0時に更新</span></ElmParagraph>

    <ElmBlockFallback
      v-if="routineStore.loading || routineStore.routineList.length === 0"
    />

    <div class="checkbox-container" v-else>
      <div v-for="routine in routineStore.routineList">
        <RoutineCheck
          :label="routine.name"
          :id="routine.id"
          :is-done="routine.isDone"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElmBlockFallback, ElmHeading1, ElmParagraph } from '@elmethis/core'

const routineStore = useRoutineStore()

onMounted(async () => {
  nextTick(async () => {
    await routineStore.fetch()
  })
})
</script>

<style scoped lang="scss">
.checkbox-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
</style>
