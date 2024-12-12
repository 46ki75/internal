<template>
  <div>Hello</div>
  <div>{{ greetStore.result?.greet }}</div>
</template>

<script setup lang="ts">
const greetStore = useGreetStore()
</script>

<style scoped lang="scss"></style>
