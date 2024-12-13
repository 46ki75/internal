<template>
  <NuxtLayout>
    <NuxtPage
      :transition="{
        enterActiveClass: 'fade-enter-active',
        leaveActiveClass: 'fade-leave-active',
        enterFromClass: 'fade-enter-from',
        leaveToClass: 'fade-leave-to',
        mode: 'out-in'
      }"
    />
  </NuxtLayout>
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

.fade-enter-active,
.fade-leave-active {
  transition: opacity 100ms;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
