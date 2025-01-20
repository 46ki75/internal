<template>
  <ElmHeading1 text="ToDo" />

  <ElmBlockFallback v-if="todoStore.todoList.length === 0" />

  <table class="todo global-fade-in" v-else>
    <thead>
      <tr>
        <th>
          <ElmInlineText text="SRC" />
        </th>
        <th>
          <ElmInlineText text="Title" />
        </th>
        <th>
          <ElmInlineText text="Is Done" />
        </th>
        <th>
          <ElmInlineText text="Severity" />
        </th>
      </tr>
    </thead>

    <tbody>
      <tr
        v-for="(todo, index) in todoStore.todoList"
        :key="todo.id"
        class="fade-in"
        :style="{ '--animation-delay': `${index * 50}ms` }"
      >
        <td>
          <img
            v-if="todo.source.toLocaleLowerCase().includes('notion')"
            class="favicon"
            src="https://www.notion.so/images/favicon.ico"
            alt="notion"
          />

          <img
            v-else-if="todo.source.toLocaleLowerCase().includes('github')"
            class="favicon"
            src="https://github.githubassets.com/favicons/favicon.svg"
            alt="notion"
          />
        </td>

        <td>
          <div>
            <ElmInlineLink
              :text="
                todo.title.length > 50
                  ? todo.title.slice(0, 50) + '...'
                  : todo.title
              "
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
</template>

<script setup lang="ts">
import {
  ElmBadge,
  ElmBlockFallback,
  ElmCheckbox,
  ElmHeading1,
  ElmInlineLink,
  ElmInlineText
} from '@elmethis/core'
import { BellIcon } from '@heroicons/vue/24/solid'

const todoStore = useToDoStore()

onMounted(() => {
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
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.fade-in {
  animation-name: fade-in;
  animation-duration: 500ms;
  animation-fill-mode: both;
  animation-delay: var(--animation-delay);
}

.todo {
  width: 100%;

  thead {
    text-align: left;
  }
}

.favicon {
  height: 24px;
  opacity: 0.8;
  color: black;
  [data-theme='dark'] & {
    filter: invert(1);
  }
}

.icon {
  height: 16px;
  width: 16px;
}

.v-enter-to,
.v-leave-from {
  opacity: 1;
}

.v-enter-active,
.v-leave-active {
  transition: opacity 300ms;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>
