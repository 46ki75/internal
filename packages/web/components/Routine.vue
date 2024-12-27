<template>
  <div>
    <ElmHeading1 text="Routine" />

    <ElmBlockFallback
      v-if="routineStore.loading || routineStore.routineList.length === 0"
    />

    <table v-else>
      <thead>
        <tr>
          <th><ElmInlineText text="Dome" /></th>
          <th><ElmInlineText text="Name" /></th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="routine in routineStore.routineList">
          <td>
            <ElmCheckbox label="" :is-checked="routine.isDone" />
          </td>
          <td><ElmInlineText :text="routine.name" /></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import {
  ElmBlockFallback,
  ElmCheckbox,
  ElmHeading1,
  ElmInlineText
} from '@elmethis/core'

const routineStore = useRoutineStore()

onMounted(async () => {
  await routineStore.fetch()
})
</script>

<style scoped lang="scss"></style>
