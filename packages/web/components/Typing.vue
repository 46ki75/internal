<template>
  <div>
    <div v-if="!typingStore.loading && typingStore.typingList.length > 0">
      <ElmInlineText
        v-for="(target, index) in targetArray"
        :key="`${currentIndex}-${index}-${target.char}`"
        :text="target.char"
        :style="{
          fontFamily: 'Source Code Pro',
          fontSize: '1.5rem',
          textDecoration: target.status === 'current' ? 'underline' : 'none',
          opacity: target.status === 'typed' ? 0.2 : 1
        }"
        :color="target.status === 'incorrect' ? 'red' : undefined"
      />
    </div>

    <div
      v-if="
        !typingStore.loading &&
        typingStore.typingList.length > 0 &&
        typingStore.typingList[currentIndex]?.description != null
      "
    >
      <ElmInlineText
        :text="typingStore.typingList[currentIndex].description.toString()"
      />
    </div>

    <div><ElmInlineText :text="`Mistakes: ${mistakes}`" /></div>
  </div>
</template>

<script setup lang="ts">
import { ElmInlineText, useTyping } from '@elmethis/core'

interface Typing {
  id: string
  text: string
  description: string
}

const typingStore = useTypingStore()

function shuffleArrayInPlaceMut<T>(array: T[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[randomIndex]] = [array[randomIndex], array[i]]
  }
  return array
}

const data = ref<Typing[]>([])

const currentIndex = ref(0)

const { start, targetArray, isFinished, mistakes } = useTyping()

const init = (typingList: Typing[]) => {
  currentIndex.value = 0
  data.value = shuffleArrayInPlaceMut(typingList)
  start(data.value[currentIndex.value].text.toString())
}

onMounted(async () => {
  await typingStore.fetch()
  init(typingStore.typingList as Typing[])
})

watch(isFinished, async () => {
  if (isFinished.value) {
    currentIndex.value = currentIndex.value + 1
    start(data.value[currentIndex.value].text.toString())
  }
})

watch(currentIndex, () => {
  if (currentIndex.value === data.value.length) {
    init(typingStore.typingList as Typing[])
  }
})
</script>

<style scoped lang="scss"></style>
