<template>
  <div class="wrapper">
    <div class="button-container">
      <ElmButton
        @click="ankiStore.editCurrentAnki()"
        block
        :loading="ankiStore.ankiList.length === 0"
      >
        <PencilSquareIcon class="icon" />
        <ElmInlineText text="Edit" />
      </ElmButton>

      <ElmButton @click="ankiStore.create()" block>
        <SparklesIcon class="icon" />
        <ElmInlineText text="NEW" />
      </ElmButton>
    </div>
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

          <template v-if="ankiStore.isShowAnswer">
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

            <div class="update-button">
              <ElmButton
                @click="ankiStore.updateAnkiByPerformanceRating(0)"
                :loading="ankiStore.updateLoading"
                block
              >
                × FORGETFUL
              </ElmButton>

              <ElmButton
                @click="ankiStore.updateAnkiByPerformanceRating(1)"
                :loading="ankiStore.updateLoading"
                block
              >
                × INCORRECT
              </ElmButton>

              <ElmButton
                @click="ankiStore.updateAnkiByPerformanceRating(2)"
                :loading="ankiStore.updateLoading"
                block
              >
                × ALMOST
              </ElmButton>

              <ElmButton
                @click="ankiStore.updateAnkiByPerformanceRating(3)"
                :loading="ankiStore.updateLoading"
                block
                primary
              >
                ✓ LUCKY
              </ElmButton>

              <ElmButton
                @click="ankiStore.updateAnkiByPerformanceRating(4)"
                :loading="ankiStore.updateLoading"
                block
                primary
              >
                ✓ CORRECT
              </ElmButton>

              <ElmButton
                @click="ankiStore.updateAnkiByPerformanceRating(5)"
                :loading="ankiStore.updateLoading"
                block
                primary
              >
                ✓ CONFIDENT
              </ElmButton>
            </div>
          </template>

          <ElmButton v-else @click="ankiStore.setIsShowAnswer(true)" block>
            <ElmInlineText text="SHOW ANSWER" />
            <ArrowTurnDownLeftIcon class="icon" />
          </ElmButton>
        </div>
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
import {
  AcademicCapIcon,
  ArrowTurnDownLeftIcon,
  PencilSquareIcon,
  QueueListIcon,
  SparklesIcon
} from '@heroicons/vue/24/solid'

const ankiStore = useAnkiStore()

onMounted(async () => {
  if (ankiStore.ankiList.length === 0) {
    await ankiStore.init()
  }
})

watch(
  () => ankiStore.getCurrentAnki?.pageId,
  () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
)
</script>

<style scoped lang="scss">
.wrapper {
  width: 100%;
  max-width: 800px;
  margin-bottom: 100vh;
}

.button-container {
  box-sizing: border-box;
  display: flex;
  gap: 0.5rem;
  margin-block: 1.5rem;
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

.update-button {
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* 3列の設定 */
  grid-template-rows: repeat(2, auto); /* 2行の設定 */
  gap: 10px; /* アイテム間の余白 */
}
</style>
