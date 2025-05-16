<template>
  <main class="main">
    <div class="center">
      <div>
        <Bookmark />
      </div>

      <div>
        <ToDo />
      </div>

      <ElmButton block primary @click="handleRegisterPasskey">
        <Icon icon="mdi:key-plus" class="icon passkey" />
        <ElmInlineText text="Registar Passkey" class="passkey" />
      </ElmButton>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ElmButton, ElmInlineText } from "@elmethis/core";
import { Icon } from "@iconify/vue";

const authStore = useAuthStore();

const handleRegisterPasskey = async () => {
  await authStore.registerPasskey();
};
</script>

<style scoped lang="scss">
@use "../scss/mixins";

.icon {
  @include mixins.icon;
}

.passkey {
  filter: invert(1);
}

.main {
  display: flex;
  justify-content: center;
}

.center {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  flex-wrap: wrap;
  width: 100%;
  margin-block-end: 20rem;
  gap: 0.5rem;

  @media screen and (max-width: 1200px) {
    flex-direction: column;
  }

  div {
    flex: 1;
  }
}
</style>
