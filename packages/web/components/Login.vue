<template>
  <div class="wrapper">
    <div>
      <p>username</p>
      <input class="input" type="text" ref="username" />

      <p>password</p>
      <input class="input" type="password" ref="password" />
    </div>

    <ElmButton block :loading="authStore.signIn.loading" @click="handleSignIn">
      <ElmInlineText text="LOGIN" />
    </ElmButton>

    <p v-if="error" :style="{ color: 'red' }">{{ error }}</p>

    <hr />

    <p><button @click="authStore.signOut">Sign Out</button></p>
  </div>
</template>

<script setup lang="ts">
import { ElmButton, ElmInlineText } from '@elmethis/core'

const authStore = useAuthStore()
const router = useRouter()

const username = ref<HTMLInputElement>()
const password = ref<HTMLInputElement>()
const error = ref<string | null>(null)

const handleSignIn = async () => {
  if (
    username.value?.value == null ||
    password.value?.value == null ||
    username.value.value == '' ||
    password.value.value == ''
  ) {
    console.log('password is empty')
    error.value = 'Please enter username and password'
  } else {
    await authStore.signin({
      username: username.value.value,
      password: password.value.value
    })

    if (authStore.session.inSession) {
      router.push('/')
    }
  }
}

onMounted(async () => {
  await authStore.checkSession()
})
</script>

<style scoped lang="scss">
.wrapper {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 1.5rem;

  max-width: 400px;
  width: 100%;
}

.input {
  all: unset;
  width: 100%;
  border-bottom: solid 1px rgba(gray, 0.5);
}
</style>
