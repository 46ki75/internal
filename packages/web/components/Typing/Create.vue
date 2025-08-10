<template>
  <div>
    <div class="wrapper">
      <ElmTextField v-model="id" label="ID" :loading="typingStore.loading" />
      <ElmTextField
        v-model="text"
        label="Text"
        :loading="typingStore.loading"
      />
      <ElmTextField
        v-model="description"
        label="Description"
        :loading="typingStore.loading"
      />
      <ElmButton :loading="typingStore.loading" block @click="handleSubmit">
        UPSERT
      </ElmButton>

      <TypingTable
        v-if="typingStore.typingList"
        :data="typingStore.typingList"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElmButton, ElmTextField } from "@elmethis/core";
import TypingTable from "../../../components/src/components/typing/TypingTable.vue";

const typingStore = useTypingStore();

const id = ref("");
const text = ref("");
const description = ref("");

const handleSubmit = async () => {
  await typingStore.upsert();
  id.value = "";
  text.value = "";
  description.value = "";
  typingStore.setId("");
  typingStore.setText("");
  typingStore.setDescription("");
};

watch(id, () => {
  typingStore.setId(id.value);
});

watch(text, () => {
  typingStore.setText(text.value);
});

watch(description, () => {
  typingStore.setDescription(description.value);
});
</script>

<style scoped lang="scss">
.wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
