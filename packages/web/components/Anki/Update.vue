<template>
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

<script setup lang="ts">
import { onKeyStroke, useMagicKeys } from '@vueuse/core'
import { ElmButton, ElmBlockFallback } from '@elmethis/core'

const ankiStore = useAnkiStore()

const { shift } = useMagicKeys()

onKeyStroke(['a', 's', 'd'], (e) => {
  if (ankiStore.isShowAnswer) {
    e.preventDefault()
    if (shift.value) {
      const rating = e.key === 'a' ? 0 : e.key === 's' ? 1 : 2
      ankiStore.updateAnkiByPerformanceRating(rating)
    } else {
      const rating = e.key === 'a' ? 4 : e.key === 's' ? 3 : 5
      ankiStore.updateAnkiByPerformanceRating(rating)
    }
  }
})
</script>

<style scoped lang="scss">
.update-button {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, auto);
  gap: 0.5rem;
  font-size: 0.85rem !important;
}
</style>
