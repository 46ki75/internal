<template>
  <div class="todo-create">
    <ElmTextField
      v-model="title"
      label="Title"
      :loading="todoStore.createState.loading"
      icon="pen"
    />

    <ElmTextField
      v-model="description"
      label="Description"
      :loading="todoStore.createState.loading"
      icon="archive"
    />

    <ElmButton @click="handleCreate" :loading="todoStore.createState.loading">
      <Icon icon="mdi:task-add" class="icon" />
      <span>Create ToDo</span>
    </ElmButton>
  </div>
</template>

<script setup lang="ts">
import { ElmTextField, ElmButton } from "@elmethis/core";
import { Icon } from "@iconify/vue";

const title = ref<string | undefined>();
const description = ref<string | undefined>();

const todoStore = useToDoStore();

const handleCreate = async () => {
  if (title.value != null) {
    await todoStore.create({
      title: title.value,
      description: description.value,
    });

    title.value = undefined;
    description.value = undefined;
  }
};
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
