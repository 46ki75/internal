<template>
  <div>
    <ElmButton block primary @click="handleRegisterPasskey">
      <Icon icon="mdi:key-plus" class="icon passkey" />
      <ElmInlineText text="Registar Passkey" class="passkey" />
    </ElmButton>
  </div>
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
</style>
