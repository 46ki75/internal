<template>
  <div>Hello</div>
  <div>{{ result }}</div>
</template>

<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { parse } from 'graphql'
parse('query SampleQuery { greet }')

const GET_HELLO = gql`
  query SampleQuery {
    greet
  }
` as unknown as any

const { result } = useQuery(GET_HELLO)
</script>

<style scoped lang="scss"></style>
