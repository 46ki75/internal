<template>
  <div class="container">
    <v-text-field
      label="Commit Message"
      variant="outlined"
      v-model="message"
    ></v-text-field>
    <v-btn
      style="margin-bottom: 1rem"
      width="100%"
      color="primary"
      @click="mutate(message)"
      :loading="isPending"
      >convert
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
    (await axios.post('/api/git', { message })).data
})
</script>

<style scoped lang="scss">
.container {
  margin-top: 2rem;
  max-width: 820px;
  width: 100%;
}
</style>
