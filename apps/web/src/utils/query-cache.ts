import { queryClient } from "@/lib/query-client";

const tableQueryPredicate =
  (table: string, keys: string[] = []) =>
  (query: { queryKey: readonly unknown[] }) =>
    query.queryKey.some((key) => typeof key === "string" && key === table) &&
    keys.every((k) => JSON.stringify(query.queryKey).includes(k));

export const invalidateQueriesForTable = (
  table: string,
  keys: string[] = [],
) => {
  queryClient.invalidateQueries({
    predicate: tableQueryPredicate(table, keys),
  });
};

export const setQueryDataForTable = (
  table: string,
  updater: (old: unknown) => unknown,
  keys: string[] = [],
) => {
  queryClient.setQueriesData(
    { predicate: tableQueryPredicate(table, keys) },
    updater,
  );
};

export const refetchQueriesForTable = (table: string, keys: string[] = []) => {
  queryClient.refetchQueries({ predicate: tableQueryPredicate(table, keys) });
};
