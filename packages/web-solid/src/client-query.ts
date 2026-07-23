import {
  hashKey,
  useIsRestoring,
  useQueryClient,
  type QueryFunction,
  type QueryKey,
} from "@tanstack/solid-query";
import { createEffect, createSignal, onCleanup, type Accessor } from "solid-js";

import { QUERY_CACHE_DURATION } from "~/query-client";

interface ClientQueryOptions<TData, TQueryKey extends QueryKey> {
  queryKey: TQueryKey;
  enabled: Accessor<boolean>;
  queryFn: QueryFunction<TData, TQueryKey>;
}

export const createClientQuery = <TData, TQueryKey extends QueryKey>(
  options: ClientQueryOptions<TData, TQueryKey>,
) => {
  const queryClient = useQueryClient();
  const isRestoring = useIsRestoring();
  const queryHash = hashKey(options.queryKey);
  const [data, setData] = createSignal<TData | undefined>(
    queryClient.getQueryData<TData>(options.queryKey),
  );
  const [error, setError] = createSignal<Error>();
  const [isFetching, setIsFetching] = createSignal(false);

  const execute = async (force = false) => {
    if (!options.enabled()) return;

    setIsFetching(true);
    setError(undefined);
    try {
      const value = await queryClient.fetchQuery({
        queryKey: options.queryKey,
        queryFn: options.queryFn,
        staleTime: force ? 0 : QUERY_CACHE_DURATION,
      });
      setData(() => value);
    } catch (cause) {
      setError(cause instanceof Error ? cause : new Error(String(cause)));
    } finally {
      setIsFetching(false);
    }
  };

  const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
    if (event.query.queryHash !== queryHash) return;
    setData(() => event.query.state.data as TData | undefined);
  });
  onCleanup(unsubscribe);

  createEffect(() => {
    if (isRestoring() || !options.enabled()) return;
    void execute();
  });

  return {
    data,
    error,
    isFetching,
    isPending: () => data() === undefined,
    refetch: () => execute(true),
  };
};
