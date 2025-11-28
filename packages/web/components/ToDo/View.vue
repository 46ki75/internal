<template>
  <ElmHeading :level="1" text="ToDo" />

  <ElmBlockFallback v-if="todoStore.toDoList.length === 0" />

  <table
    class="todo"
    v-else
    :style="{ '--opacity': todoStore.updateState.loading ? 0.25 : 1 }"
  >
    <thead>
      <tr>
        <th>
          <ElmInlineText text="SRC" />
        </th>
        <th></th>
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
          <Icon
            v-if="todo.is_recurring"
            class="recurring"
            icon="mdi:sync"
            color="#59b57c"
            height="1.25rem"
          />
        </td>

        <td>
          <a
            class="title-description"
            :href="
              todo.source.toLocaleLowerCase().includes('notion')
                ? todo.url.replace('https://', 'notion://')
                : todo.url
            "
            target="_blank"
            rel="noopener norefferer"
          >
            <ElmInlineText
              :text="
                todo.title.length > 50
                  ? todo.title.slice(0, 50) + '...'
                  : todo.title
              "
              color="#6987b8"
            />
            <div class="description">
              <ElmInlineText
                v-if="todo.description"
                :text="todo.description"
                size=".75rem"
              />
            </div>
          </a>
        </td>

        <td>
          <Icon
            v-if="todo.source === 'Notion:todo'"
            class="check"
            icon="mdi:check"
            height="1.25rem"
            @click="handleCheck(todo.id)"
          />
          <ElmInlineText v-else text="-" />
        </td>

        <td>
          <ToDoSeverity :level="todo.severity" />
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">
import { ElmBlockFallback, ElmHeading, ElmInlineText } from "@elmethis/core";
import { Icon } from "@iconify/vue";
import { useWindowFocus } from "@vueuse/core";
import { ToDoSeverity } from "../../../components/src";

const todoStore = useToDoStore();

onMounted(() => {
  todoStore.fetch();
});

const colorMap: Record<
  (typeof todoStore)["toDoList"][number]["severity"],
  string
> = {
  Unknown: "#868e9c",
  Info: "#59b57c",
  Warn: "#cdb57b",
  Error: "#c56565",
};

const handleCheck = async (id: string) => {
  if (!todoStore.updateState.loading) {
    await todoStore.update({ id, isDone: true });
  }
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
  opacity: var(--opacity);
  transition: opacity 100ms;

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

.title-description {
  all: unset;
  box-sizing: border-box;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  border-radius: 0.25rem;
  transition: background-color 100ms;

  cursor: pointer;

  &:hover {
    background-color: rgba(#6987b8, 0.15);
  }
}

.description {
  box-sizing: border-box;
  padding-left: 0.5rem;
}

.check {
  color: #868e9c;
  padding: 0.25rem;
  border-radius: 0.125rem;
  transition: background-color 100ms;
  cursor: pointer;

  &:hover {
    background-color: rgba(#868e9c, 0.2);
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
