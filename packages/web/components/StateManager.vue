<template>
  <transition>
    <div class="fix" v-if="refreshing">
      <ElmDotLoadingIcon /><ElmInlineText text="アクセストークンを更新中" />
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ElmDotLoadingIcon, ElmInlineText } from "@elmethis/core";
import { useWindowFocus } from "@vueuse/core";

const router = useRouter();
const authStore = useAuthStore();

const timerId = ref<number | null>(null);

const refreshing = ref(false);

const callback = async () => {
  try {
    refreshing.value = true;
    const isInSession = await authStore.refresh();
    if (!isInSession) {
      await router.push("/login");
    }
  } catch {
    await router.push("/login");
  } finally {
    refreshing.value = false;
  }
};

const focused = useWindowFocus();
watch(focused, async () => {
  if (focused.value) {
    await callback();
  }
});

onMounted(async () => {
  await callback();
  timerId.value = window.setInterval(callback, 1000 * 60 * 5); // 5 minutes
});

onUnmounted(() => {
  if (timerId.value) {
    window.clearInterval(timerId.value);
  }
});
</script>

<style scoped lang="scss">
.v-enter-to,
.v-leave-from {
  opacity: 1;
}

.v-enter-active,
.v-leave-active {
  transition: opacity 300ms;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}

.fix {
  margin: 0.5rem;
  position: fixed;
  bottom: 0;
  right: 0;
}
</style>
