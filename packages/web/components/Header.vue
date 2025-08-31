<template>
  <header class="header">
    <div>
      <ElmSimpleTooltip text="Home">
        <NuxtLink to="/">
          <Icon icon="material-symbols:cottage" class="icon" />
        </NuxtLink>
      </ElmSimpleTooltip>

      <ElmSimpleTooltip text="Anki">
        <NuxtLink to="/anki">
          <Icon icon="mdi:tag" class="icon" />
        </NuxtLink>
      </ElmSimpleTooltip>

      <ElmSimpleTooltip text="Swatch">
        <NuxtLink to="/swatch">
          <Icon icon="mdi:color" class="icon" />
        </NuxtLink>
      </ElmSimpleTooltip>

      <ElmSimpleTooltip text="Typing">
        <NuxtLink to="/typing">
          <Icon icon="material-symbols:keyboard" class="icon" />
        </NuxtLink>
      </ElmSimpleTooltip>

      <ElmSimpleTooltip text="Profile">
        <NuxtLink to="/profile">
          <Icon icon="mdi:user" class="icon" />
        </NuxtLink>
      </ElmSimpleTooltip>
    </div>

    <div class="right">
      <transition mode="out-in">
        <Icon
          v-if="configStore.inWork"
          icon="ic:outline-work"
          class="icon"
          @click="configStore.toggleInWork()"
        />

        <Icon
          v-else
          icon="ic:outline-work-off"
          class="icon"
          @click="configStore.toggleInWork()"
        />
      </transition>

      <!-- <Icon
        :icon="configStore.inWork ? 'ic:outline-work' : 'ic:outline-work-off'"
        class="icon"
        @click="configStore.toggleInWork()"
      /> -->

      <ElmToggleTheme />

      <span @click="handleClick()">
        <ElmLoginIcon
          :is-loading="authStore.refreshState.loading"
          :is-login="authStore.inSession"
        />
      </span>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ElmLoginIcon, ElmToggleTheme, ElmSimpleTooltip } from "@elmethis/core";
import { Icon } from "@iconify/vue";

const router = useRouter();

const authStore = useAuthStore();
const configStore = useConfigStore();

const handleClick = async () => {
  if (authStore.inSession) {
    await authStore.signOut();
  }
  router.push("/login");
};
</script>

<style scoped lang="scss">
.header {
  top: 0;
  position: sticky;
  z-index: 1;
  box-sizing: border-box;
  width: 100%;
  height: 3.5rem;
  margin: 0;
  padding: 0.5rem;
  box-shadow: 0 0 0.25rem rgba(black, 0.25);
  display: flex;
  justify-content: space-between;
  align-items: center;

  backdrop-filter: blur(2px);
  background-color: rgba(#25282e, 0.05);
  [data-theme="dark"] & {
    background-color: rgba(#eff0f2, 0.1);
  }
}

.right {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 0.25rem;
}

.signin {
  width: 28px;
  padding: 0.25rem;
  border-radius: 0.25rem;
  cursor: pointer;
  color: #6987b8;
  transition: background-color 100ms;

  &:hover {
    background-color: rgba(gray, 0.25);
  }
}

.signout {
  width: 28px;
  padding: 0.25rem;
  border-radius: 0.25rem;
  cursor: pointer;
  color: #c56565;
  transition: background-color 100ms;

  &:hover {
    background-color: rgba(gray, 0.25);
  }
}

.icon {
  width: 28px;
  height: 28px;
  padding: 0.25rem;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: background-color 100ms;
  color: rgba(black, 0.7);
  [data-theme="dark"] & {
    color: rgba(white, 0.7);
  }

  &:hover {
    background-color: rgba(gray, 0.25);
  }
}

.v-enter-to,
.v-leave-from {
  opacity: 1;
}

.v-enter-active,
.v-leave-active {
  transition: opacity 100ms;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>
