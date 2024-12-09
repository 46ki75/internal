<template>
  <div>
    <p>
      <span v-if="authStore.inSession == undefined">Checking Sessin...</span>
      <span v-else-if="authStore.inSession" :style="{ color: 'green' }"
        >In Session
      </span>
      <span v-else :style="{ color: 'red' }">Not In Session</span>
    </p>

    <p>username</p>
    <input type="text" ref="username" />
    <p>password</p>
    <input type="password" ref="password" />

    <p><button @click="handleSignIn">LOGIN</button></p>

    <p v-if="error" :style="{ color: 'red' }">{{ error }}</p>

    <hr />

    <p><button @click="authStore.signout">Sign Out</button></p>
  </div>
</template>

<script setup lang="ts">
const authStore = useAuthStore()

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
  }
}

onMounted(async () => {
  await authStore.checkSession()
})
</script>

<style scoped></style>
