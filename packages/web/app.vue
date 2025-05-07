<template>
  <NuxtLayout>
    <NuxtPage
      :transition="{
        enterActiveClass: 'fade-enter-active',
        leaveActiveClass: 'fade-leave-active',
        enterFromClass: 'fade-enter-from',
        leaveToClass: 'fade-leave-to',
        mode: 'out-in',
      }"
    />
  </NuxtLayout>
  <StateManager />
</template>

<style lang="scss">
@keyframes global-fade-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.global-fade-in {
  animation: global-fade-in 300ms;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: ui-sans-serif, sans-serif;
  margin: 0;
  transition: background-color 300ms;
  background-color: #eff0f2;
  [data-theme="dark"] & {
    background-color: #25282e;
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
