import type { Meta, StoryObj } from "@storybook/vue3-vite";
import TypingTable from "./TypingTable.vue";

const meta: Meta<typeof TypingTable> = {
  title: "Components/Typing/TypingTable",
  component: TypingTable,
  tags: ["autodocs"],
  args: {},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    data: [
      {
        id: "0b497824-4474-415d-8d8e-c74a3c1e3050",
        text: "docs: fix typo in the MyService doc comment",
        description: "MySercice の documentation comment のタイポを修正",
      },
      {
        id: "9ec4975d-6c25-495b-aee5-482ef6b3006c",
        text: "Occurs when sending HTTP requests fails",
        description:
          "(このエラーは) HTTPリクエストの送信に失敗したときに発生する",
      },
      {
        id: "e0103d4f-438e-4319-98d7-014192534034",
        text: "please set the following environment variables in the .env file:",
        description: "以下の環境変数を.envファイルに用意してください",
      },
      {
        id: "20c01fe2-5dab-4079-8618-c23ba89ad8a6",
        text: "infrared",
        description: "赤外線",
      },
      {
        id: "75ee12bb-3021-47a6-b702-21dd7a2c1921",
        text: "migrate lambda code under monorepo management",
        description: "Lambda コードをモノレポ管理に移行",
      },
      {
        id: "7f3a94d0-60d0-4bea-b053-fb20864a8b72",
        text: "Hey",
        description: "やあ",
      },
      {
        id: "a9d84358-241c-4d96-8a26-e48524820b27",
        text: "Hi",
        description: "こんにちは",
      },
    ],
  },
};
