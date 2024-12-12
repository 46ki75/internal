<template>
  <div>Hello</div>
  <div>{{ greetStore.result }}</div>
</template>

<script setup lang="ts">
const greetStore = useGreetStore()
</script>

<style scoped lang="scss"></style>
