<template>
  <Header />
  <main class="main">
    <slot />
  </main>
</template>

<style scoped lang="scss">
.main {
  box-sizing: border-box;
  padding: 0.5rem;
}
</style>
