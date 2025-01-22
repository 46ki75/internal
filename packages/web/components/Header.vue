<template>
  <header class="header">
    <div>
      <ElmTooltip>
        <template #original>
          <NuxtLink to="/">
            <Icon icon="material-symbols:cottage" class="icon" />
          </NuxtLink>
        </template>

        <template #tooltip>
          <span>HOME</span>
        </template>
      </ElmTooltip>

      <ElmTooltip>
        <template #original>
          <NuxtLink to="/anki"><Icon icon="mdi:tag" class="icon" /></NuxtLink>
        </template>

        <template #tooltip>
          <span>anki</span>
        </template>
      </ElmTooltip>

      <ElmTooltip>
        <template #original>
          <NuxtLink to="/translate">
            <Icon icon="mdi:language" class="icon" />
          </NuxtLink>
        </template>

        <template #tooltip>
          <span>Translate</span>
        </template>
      </ElmTooltip>

      <ElmTooltip>
        <template #original>
          <NuxtLink to="/color">
            <Icon icon="mdi:color" class="icon" />
          </NuxtLink>
        </template>

        <template #tooltip>
          <span>Color</span>
        </template>
      </ElmTooltip>

      <ElmTooltip>
        <template #original>
          <NuxtLink to="/typing">
            <Icon icon="material-symbols:keyboard" class="icon" />
          </NuxtLink>
        </template>

        <template #tooltip>
          <span>Typing</span>
        </template>
      </ElmTooltip>
    </div>

    <div>
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
import { ElmLoginIcon, ElmToggleTheme, ElmTooltip } from '@elmethis/core'
import { Icon } from '@iconify/vue'

const router = useRouter()

const authStore = useAuthStore()

const handleClick = async () => {
  if (authStore.inSession) {
    await authStore.signOut()

    router.push('/login')
  }
}
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
  background-color: rgba(black, 0.05);
  [data-theme='dark'] & {
    background-color: rgba(white, 0.1);
  }
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
  [data-theme='dark'] & {
    color: rgba(white, 0.7);
  }

  &:hover {
    background-color: rgba(gray, 0.25);
  }
}
</style>
