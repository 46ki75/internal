<template>
  <div>
    <table
      class="todo"
      v-if="!todoStore.loading && todoStore.todoList.length > 0"
    >
      <thead>
        <tr>
          <th>
            <ElmInlineText text="Title" />
          </th>
          <th>
            <ElmInlineText text="Is Done" />
          </th>
          <th>
            <ElmInlineText text="Source" />
          </th>
          <th>
            <ElmInlineText text="Severity" />
          </th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="todo in todoStore.todoList" :key="todo.id">
          <td>
            <div>
              <ElmInlineLink
                :text="todo.title"
                :href="
                  todo.source.toLocaleLowerCase().includes('notion')
                    ? todo.url.replace('https://', 'notion://')
                    : todo.url
                "
              />
            </div>
          </td>
          <td>
            <ElmCheckbox
              v-if="todo.source === 'Notion:todo'"
              :isChecked="todo.isDone"
              label=""
            />
            <ElmInlineText v-else text="-" />
          </td>
          <td>
            <img
              v-if="todo.source.toLocaleLowerCase().includes('notion')"
              class="favicon"
              src="https://www.notion.so/images/favicon.ico"
              alt="notion"
            />
          </td>
          <td>
            <ElmBadge :color="colorMap[todo.severity]">
              <template #left>
                <BellIcon class="icon" />
              </template>
              <template #right>
                <ElmInlineText :text="todo.severity" />
              </template>
            </ElmBadge>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import {
  ElmBadge,
  ElmCheckbox,
  ElmInlineLink,
  ElmInlineText
} from '@elmethis/core'
import { ArrowTopRightOnSquareIcon, BellIcon } from '@heroicons/vue/24/solid'

const todoStore = useToDoStore()

onMounted(() => {
  console.log('fetching todos')
  todoStore.fetch()
})

const colorMap: Record<
  (typeof todoStore)['todoList'][number]['severity'],
  string
> = {
  UNKNOWN: '#868e9c',
  INFO: '#59b57c',
  WARN: '#cdb57b',
  ERROR: '#c56565',
  FATAL: 'red'
}
</script>

<style scoped lang="scss">
.todo {
  width: 100%;

  thead {
    text-align: left;
  }
}

.favicon {
  height: 24px;
  opacity: 0.8;
}

.icon {
  height: 16px;
  width: 16px;
}
</style>
