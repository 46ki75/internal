<template>
  <div class="main">
    <div class="child">
      <Typing />

      <div :style="{ margin: '10rem 0' }"></div>

      <TypingCreate />
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped lang="scss">
.main {
  margin: 3rem;
  display: flex;
  justify-content: center;
  align-items: center;
}

.child {
  width: 100%;
  max-width: 1000px;
}
</style>
