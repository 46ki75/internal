<template>
  <nuxt-link to="/login">Login</nuxt-link>

  <div>
    <button @click="handleSignOut">Sign Out</button>

    <ElmBulletedList>
      <ElmListItem>
        <ElmInlineText bold text="user id" />
        <ElmInlineText :text="`: ${authStore.session.useId}`" />
      </ElmListItem>

      <ElmListItem>
        <ElmInlineText bold text="username" />
        <ElmInlineText :text="`: ${authStore.session.username}`" />
      </ElmListItem>

      <ElmListItem>
        <ElmInlineText bold text="Remain" />
        <ElmInlineText :text="`: ${authStore.remainSeconds}[s]`" />
      </ElmListItem>
    </ElmBulletedList>

    <ElmHeading2 text="ID Token" />
    <ElmCodeBlock
      v-if="authStore.session.idToken != null"
      :code="authStore.session.idToken"
    />

    <ElmHeading2 text="Access Token" />
    <ElmCodeBlock
      v-if="authStore.session.accessToken != null"
      :code="authStore.session.accessToken"
    />
  </div>
</template>

<script setup lang="ts">
import {
  ElmBulletedList,
  ElmCodeBlock,
  ElmHeading2,
  ElmInlineText,
  ElmListItem
} from '@elmethis/core'

const authStore = useAuthStore()
const router = useRouter()
const handleSignOut = async () => {
  await authStore.signOut()
  router.push('/login')
}

onMounted(async () => {
  await authStore.checkSession()
})
</script>

<style scoped></style>
