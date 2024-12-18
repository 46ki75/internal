<template>
  <div>
    <span>
      <ElmInlineText
        v-for="(target, index) in targetArray"
        :key="`${currentIndex}-${index}-${target.char}`"
        :text="target.char"
        :style="{
          fontFamily: 'Source Code Pro',
          fontSize: '1.5rem',
          textDecoration: target.status === 'current' ? 'underline' : 'none',
          color:
            target.status === 'incorrect'
              ? 'red'
              : target.status === 'typed'
              ? 'gray'
              : 'black'
        }"
      />
    </span>

    <div>{{ seeds[currentIndex].description }}</div>

    <div>Mistakes: {{ mistakes }}</div>
  </div>
</template>

<script setup lang="ts">
import { ElmInlineText, useTyping } from '@elmethis/core'

const seeds = [
  {
    text: 'Hello, World!',
    description: 'The first program you write in any language.'
  },
  {
    text: 'add documentation regarding',
    description: 'This is a test sentence for typing.'
  },
  {
    text: 'This is a test sentence for typing.',
    description: 'This is a test sentence for typing.'
  }
]

function shuffleArrayInPlaceMut<T>(array: T[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[randomIndex]] = [array[randomIndex], array[i]]
  }
  return array
}

shuffleArrayInPlaceMut(seeds)

const data = ref<
  {
    text: string
    description: string
  }[]
>([])

const currentIndex = ref(0)

const { start, targetArray, isFinished, mistakes } = useTyping()

const init = () => {
  currentIndex.value = 0
  data.value = shuffleArrayInPlaceMut(seeds)
  start(data.value[currentIndex.value].text)
}

onMounted(() => {
  init()
})

watch(isFinished, async () => {
  if (isFinished.value) {
    currentIndex.value = currentIndex.value + 1
    start(data.value[currentIndex.value].text)
  }
})

watch(currentIndex, () => {
  if (currentIndex.value === data.value.length) {
    init()
  }
})
</script>

<style scoped lang="scss"></style>
