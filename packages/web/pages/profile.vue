<template>
  <div class="profile">
    <div class="inner">
      <div class="device-container">
        <ElmButton block primary @click="handleRegisterPasskey">
          <Icon icon="mdi:key-plus" class="icon passkey" />
          <ElmInlineText text="Registar Passkey" class="passkey" />
        </ElmButton>

        <ProfileDevice
          v-for="device in authStore.devicesState.results"
          :key="device.id"
          :name="device.name"
          :create-date="device.createDate"
          :last-authenticated-date="device.lastAuthenticatedDate"
          :ip="(device.attributes as any).last_ip_used"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElmButton, ElmInlineText } from "@elmethis/core";
import { Icon } from "@iconify/vue";

const authStore = useAuthStore();

const handleRegisterPasskey = async () => {
  await authStore.registerPasskey();
};

onMounted(async () => {
  await authStore.fetchDevices();
});
</script>

<style scoped lang="scss">
@use "../scss/mixins";

.icon {
  @include mixins.icon;
}

.passkey {
  filter: invert(1);
}

.device-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.profile {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.inner {
  width: 100%;
  max-width: 1000px;
}
</style>
