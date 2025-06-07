function hasStringKey<T extends object>(
  obj: unknown,
  key: keyof any
): obj is T & Record<string, string> {
  return (
    typeof obj === "object" &&
    obj !== null &&
    key in obj &&
    typeof (obj as any)[key] === "string"
  );
}

interface UseFunctionArgs<F> {
  fn: F;
}

export const useFunction = <F extends (...args: any) => any>(
  args: UseFunctionArgs<F>
) => {
  const data = ref<Awaited<ReturnType<F>> | null>(null);
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);

  const execute = async (...fnArgs: Parameters<F>): Promise<void> => {
    loading.value = true;
    error.value = null;

    try {
      data.value = await args.fn(...fnArgs);
    } catch (e) {
      if (
        (e instanceof Error && typeof e.message === "string") ||
        hasStringKey(e, "message")
      ) {
        error.value = e.message;
      } else {
        error.value = String(e);
      }
    } finally {
      loading.value = false;
    }
  };

  return {
    data,
    loading,
    error,
    execute,
  };
};
