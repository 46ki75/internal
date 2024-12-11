<template>
  <div class="wrapper">
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

      <ElmHeading1 text="front" />
      <ElmJsonRendererAsync
        :key="String(key)"
        v-if="ankiStore.getCurrentAnki?.blockList != null"
        :json="ankiStore.getCurrentAnki.blockList.front"
      />

      <ElmHeading1 text="back" />
      <ElmJsonRendererAsync
        :key="String(key)"
        v-if="ankiStore.getCurrentAnki?.blockList != null"
        :json="ankiStore.getCurrentAnki.blockList.back"
      />

      <ElmHeading1 text="explanation" />
      <ElmJsonRendererAsync
        :key="String(key)"
        v-if="ankiStore.getCurrentAnki?.blockList != null"
        :json="ankiStore.getCurrentAnki.blockList.explanation"
      />

      <ElmButton @click="handleNext">NEXT</ElmButton>
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

const key = ref(true)

const handleNext = () => {
  ankiStore.next()
  key.value = !key.value
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
