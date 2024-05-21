<template>
  <v-text-field
    label="password"
    type="password"
    v-model="password"
  ></v-text-field>
  <v-btn @click="mutate(password)">login</v-btn>
</template>

<script setup lang="ts">
import { useMutation } from '@tanstack/vue-query'
import axios from 'axios'

const router = useRouter()
const auth = useAuthStore()
const password = ref('')

onMounted(() => {
  if (auth.isLogin) router.push('/')
})

const { mutate } = useMutation({
  mutationFn: async (password: string) => {
    auth.setIsLoading(true)
    await axios.post('/api/auth/login', { password })
  },
  onSuccess: () => {
    auth.setIsLogin(true)
    router.push('/')
  },
  onError: () => {
    auth.setIsLogin(false)
  },
  onSettled: () => {
    auth.setIsLoading(false)
  }
})
</script>

<style scoped lang="scss"></style>
