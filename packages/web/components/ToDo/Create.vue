<template>
  <div class="todo-create">
    <ElmTextField
      v-model="title"
      label="Title"
      :loading="todoStore.createState.loading"
      :icon="PencilIcon"
    />

    <ElmButton @click="handleCreate" :loading="todoStore.createState.loading">
      <ListBulletIcon class="icon" />
      <span>Create ToDo</span>
    </ElmButton>
  </div>
</template>

<script setup lang="ts">
import { ElmTextField, ElmButton } from '@elmethis/core'
import { PencilIcon, ListBulletIcon } from '@heroicons/vue/24/outline'

const title = ref<string | undefined>()

const todoStore = useToDoStore()

const handleCreate = async () => {
  if (title.value != null) {
    await todoStore.create({
      title: title.value
    })

    title.value = undefined
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
