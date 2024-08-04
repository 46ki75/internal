<template>
  <div class="container">
    <v-select
      v-model="type"
      label="type"
      :item-props="true"
      :items="[
        {
          title: 'feat',
          subtitle: 'Added new feature'
        },
        {
          title: 'fix',
          subtitle: 'Bug fix'
        },
        {
          title: 'docs',
          subtitle: 'Documentation only changes'
        },
        {
          title: 'style',
          subtitle: 'Changes in formatting that do not affect code behavior'
        },
        {
          title: 'refactor',
          subtitle:
            'Code restructuring that does not add new features or fix bugs'
        },
        {
          title: 'perf',
          subtitle: 'Changes to improve performance'
        },
        {
          title: 'test',
          subtitle: 'Adding or updating tests'
        },
        {
          title: 'build',
          subtitle:
            'Changes to the build system or external dependencies (e.g., gulp, npm)'
        },
        {
          title: 'ci',
          subtitle:
            'Changes to CI configuration files and scripts (e.g., CircleCI, BrowserStack)'
        },
        {
          title: 'chore',
          subtitle: 'Other changes that do not modify source or test files'
        },
        {
          title: 'revert',
          subtitle: 'Revert a previous commit'
        }
      ]"
    ></v-select>

    <v-text-field v-model="scope" label="scope (optional)"></v-text-field>

    <v-textarea
      label="Commit Changes"
      variant="outlined"
      v-model="message"
    ></v-textarea>
    <v-btn
      style="margin-bottom: 1rem"
      width="100%"
      color="primary"
      @click="mutate({ message, type, scope })"
      :loading="isPending"
      >convert
    </v-btn>
    <CodeBlock
      v-if="data != null && 'result' in data"
      :code="data.result"
      :theme="isDark ? 'dark' : 'light'"
    />
  </div>
</template>

<script setup lang="ts">
import { useMutation } from '@tanstack/vue-query'
import { useDark } from '@vueuse/core'
import axios from 'axios'
import { CodeBlock } from 'elmethis'

// # --------------------------------------------------------------------------------
//
// script
//
// # --------------------------------------------------------------------------------

const isDark = useDark()

const type = ref('feat')
const scope = ref('')
const message = ref('')

const { mutate, data, isPending } = useMutation({
  mutationFn: async ({
    message,
    type,
    scope
  }: {
    message: string
    type: string
    scope: string
  }) => (await axios.post('/api/git', { message, type, scope })).data
})
</script>

<style scoped lang="scss">
.container {
  margin-top: 2rem;
  max-width: 820px;
  width: 100%;
}
</style>
