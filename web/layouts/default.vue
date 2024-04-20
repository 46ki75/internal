<template>
  <Header />
  <div class="container">
    <slot />
  </div>
</template>

<style scoped lang="scss">
.container {
  box-sizing: border-box;
  width: 100%;

  display: flex;
  justify-content: center;
  align-items: center;

  padding: 0.25rem;
}
</style>
