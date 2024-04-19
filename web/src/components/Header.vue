<template>
  <header>
    <v-btn v-if="isPending" :loading="true">...</v-btn>
    <v-btn v-else-if="data !== 200" @click="router.push('/login')">LOGIN</v-btn>
    <v-btn v-else @click="logout">LOGOUT</v-btn>
  </header>
</template>

<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import axios from 'axios'
import { watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const { data, isPending, refetch } = useQuery({
  queryKey: ['/api/auth/verify'],
  queryFn: async () => (await axios.get('/api/auth/verify')).status,
  staleTime: 0,
  retry: 0
})

const logout = async () => {
  await axios.get('/api/auth/logout')
  await refetch()
  router.push('/login')
}

watch(route, async () => {
  await refetch()
})
</script>

<style scoped lang="scss">
header {
  position: sticky;
  top: 0;

  width: 100%;
  height: 3rem;

  box-shadow: 0 0 0.25rem rgba(0, 0, 0, 0.2);

  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
