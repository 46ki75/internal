<template>
  <NuxtLayout><NuxtPage /></NuxtLayout>
  <StateManager />
</template>

<style lang="scss">
body {
  margin: 0;
  transition: background-color 300ms;
  background-color: rgba(black, 0.05);
  [data-theme='dark'] & {
    background-color: rgba(black, 0.85);
  }
}
</style>
