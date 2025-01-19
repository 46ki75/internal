<template>
  <div class="todo-create">
    <ElmTextField
      v-model="title"
      label="Title"
      :loading="todoStore.updateLoading"
      :icon="PencilIcon"
    />
    <ElmTextField
      v-model="description"
      label="Description (optional)"
      :loading="todoStore.updateLoading"
      :icon="AdjustmentsHorizontalIcon"
    />
    <ElmButton @click="handleCreate" :loading="todoStore.updateLoading">
      <ListBulletIcon class="icon" />
      <span>Create ToDo</span>
    </ElmButton>
  </div>
</template>

<script setup lang="ts">
import { ElmTextField, ElmButton } from '@elmethis/core'
import {
  AdjustmentsHorizontalIcon,
  PencilIcon,
  ListBulletIcon
} from '@heroicons/vue/24/outline'

const title = ref<string | undefined>()
const description = ref<string | undefined>()

const todoStore = useToDoStore()

const handleCreate = async () => {
  if (title.value != null) {
    await todoStore.create({
      title: title.value,
      description: description.value
    })

    title.value = undefined
    description.value = undefined
  }
}
</script>

<style scoped lang="scss">
.todo-create {
  margin-block: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.icon {
  width: 24px;
  height: 24px;
}
</style>
