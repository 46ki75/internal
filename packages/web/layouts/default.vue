<template>
  <Header />

  <main class="main">
    <slot />
  </main>
</template>

<style scoped lang="scss">
@keyframes fade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.main {
  box-sizing: border-box;
  padding: 0.5rem;
  animation-name: fade;
  animation-duration: 500ms;
  animation-fill-mode: both;
  animation-iteration-count: 1;
}
</style>
