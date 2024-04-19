<template>
  <h1>Login</h1>
  <v-text-field
    label="password"
    type="password"
    v-model="password"
  ></v-text-field>
  <v-btn
    color="primary"
    :loading="mutation.isPending.value"
    @click="mutation.mutate(password)"
    >LOGIN</v-btn
  >
  <div v-if="mutation.isError.value">Password is invalid</div>
</template>

<script setup lang="ts">
import { useMutation } from '@tanstack/vue-query'
import axios from 'axios'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const password = ref('')

onMounted(async () => {
  const data = await axios.get('/api/auth/verify')
  if (data.status === 200) router.push('/')
})

const mutation = useMutation({
  mutationFn: async (password: string) =>
    await axios.post('/api/auth/login', { password }),
  onSuccess: () => {
    router.push('/')
  }
})
</script>

<style scoped lang="scss"></style>
