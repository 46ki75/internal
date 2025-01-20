<template>
  <div class="wrapper">
    <AnkiControl />

    <ElmBlockFallback v-if="ankiStore.ankiList.length === 0" />
    <template v-else>
      <AnkiMeta />

      <div>
        <AnkiView />
        <AnkiUpdate v-if="ankiStore.isShowAnswer" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ElmBlockFallback } from '@elmethis/core'
import { onKeyStroke } from '@vueuse/core'

const router = useRouter()
const ankiStore = useAnkiStore()

onMounted(async () => {
  if (ankiStore.ankiList.length === 0) {
    await ankiStore.init()
  }
})

watch(
  () => ankiStore.getCurrentAnki?.pageId,
  () => {
    router.push({ hash: '#button-container' })
  }
)

onKeyStroke(['Enter', ' '], (e) => {
  e.preventDefault()
  ankiStore.setIsShowAnswer(true)
})
</script>

<style scoped lang="scss">
.wrapper {
  width: 100%;
  max-width: 800px;
  margin-bottom: 100vh;
}
</style>
