<template>
  <transition>
    <div class="fix" v-if="refreshing">
      <ElmDotLoadingIcon /><ElmInlineText text="アクセストークンを更新中" />
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ElmDotLoadingIcon, ElmInlineText } from "@elmethis/vue";
import { useWindowFocus } from "@vueuse/core";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const ankiStore = useAnkiStore();

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
  ankiStore.idempotentFetch();
});

onUnmounted(() => {
  if (timerId.value) {
    window.clearInterval(timerId.value);
  }
});

watch(
  [() => route.fullPath, () => authStore.refreshState.loading],
  async () => {
    await nextTick();
    if (!authStore.refreshState.loading && !authStore.inSession) {
      await router.push("/login");
    }
  }
);
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
