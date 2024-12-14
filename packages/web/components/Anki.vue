<template>
  <div class="wrapper">
    <div class="button-container" id="button-container">
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
      <div class="queue" id="queue">
        <AcademicCapIcon class="icon" />
        <ElmInlineText
          :text="`Should Learn: ${ankiStore.getShouldLearnCount}`"
        />

        <QueueListIcon class="icon" />
        <ElmInlineText :text="`Queue: ${ankiStore.ankiList.length}`" />
      </div>

      <template v-if="ankiStore.getCurrentAnki?.blockList != null">
        <div>
          <ElmHeading1 text="front" id="front" />
          <ElmJsonRendererAsync
            :key="`${ankiStore.getCurrentAnki.pageId}:front`"
            :json="ankiStore.getCurrentAnki.blockList.front"
          />

          <template v-if="ankiStore.isShowAnswer">
            <ElmHeading1 text="back" id="back" />
            <ElmJsonRendererAsync
              :key="`${ankiStore.getCurrentAnki.pageId}:back`"
              :json="ankiStore.getCurrentAnki.blockList.back"
            />

            <ElmHeading1 text="explanation" id="explanation" />
            <ElmJsonRendererAsync
              :key="`${ankiStore.getCurrentAnki.pageId}:explanation`"
              :json="ankiStore.getCurrentAnki.blockList.explanation"
            />

            <ElmBlockFallback v-if="ankiStore.updateLoading" />

            <div v-else class="update-button">
              <ElmButton
                @click="ankiStore.updateAnkiByPerformanceRating(0)"
                :loading="ankiStore.updateLoading"
                block
              >
                <span>
                  {{ `× FORGETFUL${shift ? ' [A]' : ''}` }}
                </span>
              </ElmButton>

              <ElmButton
                @click="ankiStore.updateAnkiByPerformanceRating(1)"
                :loading="ankiStore.updateLoading"
                block
              >
                <span>
                  {{ `× INCORRECT${shift ? ' [S]' : ''}` }}
                </span>
              </ElmButton>

              <ElmButton
                @click="ankiStore.updateAnkiByPerformanceRating(2)"
                :loading="ankiStore.updateLoading"
                block
              >
                <span> </span>
                {{ `× ALMOST${shift ? ' [D]' : ''}` }}
              </ElmButton>

              <ElmButton
                @click="ankiStore.updateAnkiByPerformanceRating(3)"
                :loading="ankiStore.updateLoading"
                block
                primary
              >
                <span>
                  {{ `✓ LUCKY${!shift ? ' [a]' : ''}` }}
                </span>
              </ElmButton>

              <ElmButton
                @click="ankiStore.updateAnkiByPerformanceRating(4)"
                :loading="ankiStore.updateLoading"
                block
                primary
              >
                <span>
                  {{ `✓ CORRECT${!shift ? ' [s]' : ''}` }}
                </span>
              </ElmButton>

              <ElmButton
                @click="ankiStore.updateAnkiByPerformanceRating(5)"
                :loading="ankiStore.updateLoading"
                block
                primary
              >
                <span>
                  {{ `✓ CONFIDENT${!shift ? ' [d]' : ''}` }}
                </span>
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
	ElmBlockFallback,
	ElmButton,
	ElmHeading1,
	ElmInlineText,
	ElmJsonRendererAsync,
} from "@elmethis/core";
import {
	AcademicCapIcon,
	ArrowTurnDownLeftIcon,
	PencilSquareIcon,
	QueueListIcon,
	SparklesIcon,
} from "@heroicons/vue/24/solid";
import { onKeyStroke, useMagicKeys } from "@vueuse/core";

const router = useRouter();
const ankiStore = useAnkiStore();

onMounted(async () => {
	if (ankiStore.ankiList.length === 0) {
		await ankiStore.init();
	}
});

watch(
	() => ankiStore.getCurrentAnki?.pageId,
	() => {
		router.push({ hash: "#button-container" });
	},
);

onKeyStroke(["Enter", " "], (e) => {
	e.preventDefault();
	ankiStore.setIsShowAnswer(true);
});

const { shift } = useMagicKeys();

onKeyStroke(["a", "s", "d"], (e) => {
	e.preventDefault();
	if (shift.value) {
		const rating = e.key === "a" ? 0 : e.key === "s" ? 1 : 2;
		ankiStore.updateAnkiByPerformanceRating(rating);
	} else {
		const rating = e.key === "a" ? 4 : e.key === "s" ? 3 : 5;
		ankiStore.updateAnkiByPerformanceRating(rating);
	}
});
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
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, auto);
  gap: 0.5rem;
  font-size: 0.85rem !important;
}
</style>
