<template>
  <div class="container">
    <v-textarea label="Japanese" variant="outlined" v-model="message">
    </v-textarea>
    <v-btn
      style="margin-bottom: 1rem"
      width="100%"
      color="primary"
      @click="mutate(message)"
      :loading="isPending"
      >translate
    </v-btn>
    <CodeBlock v-if="data != null && 'result' in data" :code="data.result" />
  </div>
</template>

<script setup lang="ts">
import { useMutation } from '@tanstack/vue-query'
import axios from 'axios'
import { CodeBlock } from 'elmethis'

const message = ref('')

const { mutate, data, isPending } = useMutation({
  mutationFn: async (message: string) =>
    (await axios.post('/api/translate', { message })).data
})
</script>

<style scoped lang="scss">
.container {
  margin-top: 2rem;
  max-width: 820px;
  width: 100%;
}
</style>
