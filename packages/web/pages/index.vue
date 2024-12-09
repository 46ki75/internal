<template>
  <div>USER</div>
  <button @click="handleLogin">SIGN IN</button>
  <button @click="authStore.signout">SIGN OUT</button>
  <p>
    <span v-if="authStore.inSession == undefined">Checking Sessin...</span>
    <span v-else-if="authStore.inSession" :style="{ color: 'green' }"
      >In Session
    </span>
    <span v-else :style="{ color: 'red' }">Not In Session</span>
  </p>
  <ul>
    <li>LOADING: {{ authStore.isSignInLoading }}</li>
    <li>ERROR: {{ authStore.isSingInError }}</li>
    <li>user id: {{ authStore.useId }}</li>
    <li>username: {{ authStore.username }}</li>
  </ul>
  <p>{{ authStore.signInStep }}</p>
</template>

<script setup lang="ts">
import { useAuthStore } from '#build/imports'

const authStore = useAuthStore()

onMounted(async () => {
  await authStore.checkSession()
})

const handleLogin = async () => {
  await authStore.signin({
    username: 'shirayuki',
    password: 'MyCognitoAwesomePassword123456DoIT!'
  })
}
</script>

<style scoped></style>
