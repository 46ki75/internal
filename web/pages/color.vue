<template>
  <div>
    <h2>LIGHT</h2>
    <table
      style="
        background-color: aliceblue;
        color: black;
        padding: 0.5rem;
        border-radius: 0.25rem;
      "
    >
      <thead>
        <tr>
          <th>color</th>
          <th v-for="coefficient in coefficients">{{ coefficient }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(color, index) in Object.values(colors)">
          <td>{{ Object.keys(colors)[index] }}</td>
          <td
            v-for="coefficient in coefficients"
            :style="{ color: darken(coefficient, color) }"
          >
            {{ darken(coefficient, color) }}
          </td>
        </tr>
      </tbody>
    </table>

    <h2>DARK</h2>
    <table
      style="
        background-color: rgba(0, 0, 0, 0.8);
        color: aliceblue;
        padding: 0.5rem;
        border-radius: 0.25rem;
      "
    >
      <thead>
        <tr>
          <th>color</th>
          <th v-for="coefficient in coefficients">{{ coefficient }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(color, index) in Object.values(colors)">
          <td>{{ Object.keys(colors)[index] }}</td>
          <td
            v-for="coefficient in coefficients"
            :style="{ color: darken(coefficient, color) }"
          >
            {{ darken(coefficient, color) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { darken } from 'polished'
const coefficients = [-0.2, -0.15, -0.1, -0.05, 0, 0.05, 0.1, 0.15, 0.2]
const colors = {
  crimson: 'rgb(179, 100, 114)',
  amber: 'rgb(191, 126, 113)',
  gold: 'rgb(184, 163, 110)',
  emerald: 'rgb(89, 181, 124)',
  blue: 'rgb(105, 135, 184)',
  purple: 'rgb(151, 113, 189)',
  pink: 'rgb(201, 105, 158)',
  slate: 'rgb(134, 142, 156)'
}
</script>

<style scoped lang="scss"></style>
