<template>
  <ElmHeading :level="1" text="ToDo" />

  <ElmBlockFallback v-if="todoStore.toDoList.length === 0" />

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
        v-for="(todo, index) in todoStore.toDoList"
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
            <ElmInlineText
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
          <ToDoCheck
            v-if="todo.source === 'Notion:todo'"
            :id="todo.id"
            v-model="todo.isDone"
          />
          <ElmInlineText v-else text="-" />
        </td>

        <td>
          <Icon icon="mdi:notifications-active" class="icon" />
          <ElmInlineText :text="todo.severity" />
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">
import { ElmBlockFallback, ElmHeading, ElmInlineText } from "@elmethis/core";
import { Icon } from "@iconify/vue";
import { useWindowFocus } from "@vueuse/core";

const todoStore = useToDoStore();

onMounted(() => {
  todoStore.fetch();
});

const colorMap: Record<
  (typeof todoStore)["toDoList"][number]["severity"],
  string
> = {
  UNKNOWN: "#868e9c",
  INFO: "#59b57c",
  WARN: "#cdb57b",
  ERROR: "#c56565",
  FATAL: "red",
};

const focused = useWindowFocus();
watch(focused, async () => {
  if (focused.value) {
    await todoStore.fetch();
  }
});
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
  [data-theme="dark"] & {
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
