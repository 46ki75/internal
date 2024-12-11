<template>
  <div class="wrapper">
    <ElmButton @click="handleCreate" block>CREATE</ElmButton>
    <div v-if="ankiStore.ankiList.length === 0">LOADING</div>

    <template v-else>
      <div class="queue">
        <AcademicCapIcon class="icon" />
        <ElmInlineText
          :text="`Should Learn: ${ankiStore.getShouldLearnCount}`"
        />

        <QueueListIcon class="icon" />
        <ElmInlineText :text="`Queue: ${ankiStore.ankiList.length}`" />
      </div>

      <template v-if="ankiStore.getCurrentAnki?.blockList != null">
        <div>
          <ElmHeading1 text="front" />
          <ElmJsonRendererAsync
            :key="`${ankiStore.getCurrentAnki.pageId}:front`"
            :json="ankiStore.getCurrentAnki.blockList.front"
          />

          <ElmHeading1 text="back" />
          <ElmJsonRendererAsync
            :key="`${ankiStore.getCurrentAnki.pageId}:back`"
            :json="ankiStore.getCurrentAnki.blockList.back"
          />

          <ElmHeading1 text="explanation" />
          <ElmJsonRendererAsync
            :key="`${ankiStore.getCurrentAnki.pageId}:explanation`"
            :json="ankiStore.getCurrentAnki.blockList.explanation"
          />
        </div>

        <ElmButton @click="handleNext">NEXT</ElmButton>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import {
  ElmButton,
  ElmHeading1,
  ElmInlineText,
  ElmJsonRendererAsync
} from '@elmethis/core'
import { AcademicCapIcon, QueueListIcon } from '@heroicons/vue/24/solid'

const ankiStore = useAnkiStore()

const handleNext = async () => {
  await ankiStore.next()
}

const handleCreate = async () => {
  await ankiStore.create()
}

onMounted(async () => {
  if (ankiStore.ankiList.length === 0) {
    await ankiStore.init()
  }
})
</script>

<style scoped lang="scss">
.wrapper {
  max-width: 1000px;
}

.queue {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 0.5rem;
}

.icon {
  width: 20px;
  color: rgba(black, 0.8);
  [data-theme='dark'] & {
    color: rgba(white, 0.8);
  }
}
</style>
