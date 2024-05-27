<template>
  <div class="container">
    <div class="login">
      <v-text-field
        label="username"
        variant="underlined"
        placeholder="example@46ki75.com"
      ></v-text-field>

      <v-text-field
        label="password"
        type="password"
        variant="underlined"
        v-model="password"
      ></v-text-field>

      <v-btn
        width="100%"
        :disabled="password.length <= 0"
        :loading="isPending"
        @click="mutate(password)"
        >login
      </v-btn>
    </div>
  </div>
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

const { mutate, isPending } = useMutation({
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

<style scoped lang="scss">
.container {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;

  .login {
    width: 520px;
    max-width: 90%;
  }
}
</style>
