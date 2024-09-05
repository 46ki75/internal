<template>
  <div class="card-container">
    <div style="width: 100%">
      <elm-divider
        :text="
          countQuery.isPending.value && countQuery.data.value == null
            ? '???'
            : `${countQuery.data.value!.count === 100 ? '100+' : countQuery.data.value!.count}`
        "
        color="rgb(111,111,111)"
      />
    </div>

    <div class="tag-container">
      <div
        v-if="ankiCardQuery.data.value != null"
        v-for="tag in ankiCardQuery.data.value.tags"
      >
        <font-awesome-icon :icon="['fas', 'tags']" />
        <div>{{ tag.name }}</div>
      </div>

      <div v-else>
        <elm-triangle-loading-icon :size="16" />
        <div>LOADING</div>
      </div>
    </div>

    <div style="width: 100%; gap: 1rem; display: flex">
      <v-btn
        @click="
          async () => {
            await navigateTo(
              ankiCardQuery.data.value?.url.replace('https://', 'notion://'),
              {
                external: true,
                open: { target: '_blank' }
              }
            )
          }
        "
      >
        <font-awesome-icon :icon="['fas', 'edit']" />&nbsp; EDIT
      </v-btn>
      <v-btn
        @click="createAnkiCardMutation.mutate"
        :loading="createAnkiCardMutation.isPending.value"
      >
        <font-awesome-icon :icon="['fas', 'plus']" />&nbsp; NEW
      </v-btn>
    </div>

    <div class="front">
      <h2>front</h2>
      <elm-divider margin="0.5rem" />
      <div class="fallback" v-if="ankiCardQuery.isPending.value">
        <elm-grid-loading-icon :size="32" />
        <span>LOADING</span>
      </div>
      <elm-json-component
        v-else
        :components="ankiCardQuery.data.value!.front"
      />
    </div>

    <v-btn
      v-if="!isShownAnswer"
      color="primary"
      style="width: 100%; max-width: 820px"
      @click="() => (isShownAnswer = !isShownAnswer)"
    >
      show answer</v-btn
    >

    <div v-if="isShownAnswer" class="back">
      <h2>back</h2>
      <elm-divider margin="0.5rem" />
      <div class="fallback" v-if="ankiCardQuery.isPending.value">
        <elm-grid-loading-icon :size="32" />
        <span>LOADING</span>
      </div>
      <elm-json-component v-else :components="ankiCardQuery.data.value!.back" />
    </div>

    <div v-if="isShownAnswer" class="explanation">
      <h2>explanation</h2>
      <elm-divider margin="0.5rem" />
      <div class="fallback" v-if="ankiCardQuery.isPending.value">
        <elm-grid-loading-icon :size="32" />
        <span>LOADING</span>
      </div>
      <elm-json-component
        v-else
        :components="ankiCardQuery.data.value!.explanation"
      />
    </div>

    <div
      v-if="isShownAnswer && !mutation.isPending.value"
      class="button-container"
    >
      <v-btn color="secondary" @click="mutation.mutate(0)">forgetful</v-btn>
      <v-btn color="secondary" @click="mutation.mutate(1)">incorrect</v-btn>
      <v-btn color="secondary" @click="mutation.mutate(2)">almost</v-btn>
      <v-btn color="primary" @click="mutation.mutate(3)">lucky guess</v-btn>
      <v-btn color="primary" @click="mutation.mutate(4)">correct</v-btn>
      <v-btn color="primary" @click="mutation.mutate(5)">confident</v-btn>
    </div>

    <div class="fallback" v-if="isShownAnswer && mutation.isPending.value">
      <elm-dot-loading-icon :size="32" />
      <elm-turn-text text="UPDATING ANKI CARD" :size="16" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMutation, useQuery } from '@tanstack/vue-query'
import { useDark } from '@vueuse/core'
import axios from 'axios'
import type { Component } from 'json-component-spec'

import {
  ElmDivider,
  ElmJsonComponent,
  ElmDotLoadingIcon,
  ElmTurnText
} from 'elmethis'

const isDark = useDark()

interface AnkiCardResponse {
  id: string
  front: Component[]
  back: Component[]
  explanation: Component[]
  title: string
  tags: Array<{
    id: string
    name: string
    color: string
  }>
  nextReviewAt: string
  easeFactor: number
  repetitionCount: number
  createdAt: string
  updatedAt: string
  url: string
}

const isShownAnswer = ref(false)

const ankiCardQuery = useQuery<AnkiCardResponse>({
  queryKey: ['/api/anki/learn'],
  queryFn: async () => {
    const res = await axios.get('/api/anki/learn')
    countQuery.refetch()
    return res.data
  },
  staleTime: 0
})

const countQuery = useQuery<{ count: number }>({
  queryKey: ['/api/anki/count'],
  queryFn: async () => (await axios.get('/api/anki/count')).data,
  staleTime: 0,
  refetchOnMount: false
})

const mutation = useMutation({
  mutationFn: updateAnkiCard,
  onSuccess: async () => {
    await ankiCardQuery.refetch()
    isShownAnswer.value = false
  }
})

const createAnkiCardMutation = useMutation({
  mutationFn: async () => (await axios.post('/api/anki')).data,
  onSuccess: async (data: any) => {
    await navigateTo(data.url.replace('https://', 'notion://'), {
      external: true,
      open: { target: '_blank' }
    })
  }
})

async function updateAnkiCard(performanceRating: number) {
  const card = { ...ankiCardQuery.data!.value! }

  const maxInterval = 365
  const minInterval = 0.5

  if (performanceRating < 3) {
    card.easeFactor = Math.max(1.3, card.easeFactor * 0.85)
    card.repetitionCount = 0
  } else {
    card.easeFactor +=
      0.1 - (5 - performanceRating) * (0.08 + (5 - performanceRating) * 0.02)
    card.repetitionCount += 1
  }

  let newInterval
  if (performanceRating === 0) {
    newInterval = minInterval
  } else if (performanceRating === 1) {
    newInterval = minInterval
  } else if (performanceRating === 2) {
    newInterval = Math.max(minInterval, card.repetitionCount)
  } else {
    let multiplier = 1
    if (performanceRating === 3) {
      multiplier = 1
    } else if (performanceRating === 4) {
      multiplier = 1.5
    } else if (performanceRating === 5) {
      multiplier = 2
    }
    newInterval = Math.min(
      maxInterval,
      Math.pow(card.easeFactor, card.repetitionCount) * multiplier
    )
  }

  card.nextReviewAt = new Date(
    Date.now() + newInterval * 24 * 60 * 60 * 1000
  ).toISOString()

  await axios.patch('/api/anki/learn', {
    id: card.id,
    nextReviewAt: card.nextReviewAt,
    repetitionCount: card.repetitionCount,
    easeFactor: card.easeFactor
  })
}
</script>

<style scoped lang="scss">
.tag-container {
  width: 100%;

  display: flex;
  flex-direction: row;

  gap: 1rem;

  div {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.25rem;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.card-container {
  width: 100%;
  max-width: 820px;

  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  align-items: center;

  margin-top: 1rem;

  .front,
  .back,
  .explanation {
    width: 100%;

    padding: 1rem;

    border-radius: 0.25rem;
    box-shadow: 0 0 0.25rem rgba($color: #000000, $alpha: 0.2);

    animation-name: fadeIn;
    animation-fill-mode: both;
    animation-duration: 0.6s;

    background-color: rgba($color: #ffffff, $alpha: 0.05);
  }

  .button-container {
    width: 100%;

    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 1rem;
  }
}

.fallback {
  margin: 1.5rem 0;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
}
</style>
