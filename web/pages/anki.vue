<template>
  <div class="card-container">
    <div class="front">
      <h2>front</h2>
      <Divider margin="0.5rem" />
      <NotionHTML v-if="!isPending" :domjson="data.front" />
    </div>
    <div class="back">
      <h2>back</h2>
      <Divider margin="0.5rem" />
      <NotionHTML v-if="!isPending" :domjson="data.back" />
    </div>
    <div class="explanation">
      <h2>explanation</h2>
      <Divider margin="0.5rem" />
      <NotionHTML v-if="!isPending" :domjson="data.explanation" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import axios from 'axios'
import { NotionHTML, Divider } from 'elmethis'

const { data, isPending } = useQuery({
  queryKey: ['/api/anki/learn'],
  queryFn: async () => (await axios.get('/api/anki/learn')).data
})
</script>

<style scoped lang="scss">
.card-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  align-items: center;

  margin-top: 1rem;

  .front,
  .back,
  .explanation {
    width: 100%;
    max-width: 820px;

    padding: 1rem;

    border-radius: 0.25rem;
    box-shadow: 0 0 0.25rem rgba($color: #000000, $alpha: 0.2);
  }
}
</style>
