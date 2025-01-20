<template>
  <div class="wrapper">
    <ElmTextField
      v-model="username"
      label="username"
      required
      :icon="UserCircleIcon"
    />
    <ElmTextField
      v-model="password"
      label="password"
      required
      :icon="LockClosedIcon"
      is-password
    />

    <ElmButton block :loading="authStore.signIn.loading" @click="handleSignIn">
      <ArrowLeftEndOnRectangleIcon class="icon" />
      <ElmInlineText text="LOGIN" />
    </ElmButton>

    <p v-if="error" :style="{ color: 'red' }">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { ElmButton, ElmInlineText, ElmTextField } from '@elmethis/core'
import {
  ArrowLeftEndOnRectangleIcon,
  LockClosedIcon,
  UserCircleIcon
} from '@heroicons/vue/24/outline'

const authStore = useAuthStore()
const router = useRouter()

const username = ref<string>('')
const password = ref<string>('')
const error = ref<string | null>(null)

const handleSignIn = async () => {
  if (
    username.value == null ||
    password.value == null ||
    username.value == '' ||
    password.value == ''
  ) {
    console.log('password is empty')
    error.value = 'Please enter username and password'
  } else {
    await authStore.signin({
      username: username.value,
      password: password.value
    })

    if (authStore.session.inSession) {
      router.push('/')
    }
  }
}

onMounted(async () => {
  await authStore.refreshAccessToken()
})
</script>

<style scoped lang="scss">
@use '../scss/mixins';

.icon {
  @include mixins.icon;
}

.wrapper {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 1.5rem;

  max-width: 400px;
  width: 100%;

  div {
    width: 100%;
  }
}

.input {
  all: unset;
  box-sizing: border-box;
  width: 100%;
  padding: 0.5rem;
  border-bottom: solid 1px rgba(gray, 0.5);
}
</style>
