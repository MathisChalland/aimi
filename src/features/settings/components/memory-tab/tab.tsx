import { api } from "@/trpc/react";
import {
  Setting,
  SettingsContent,
  SettingsGroup,
} from "../settings-components";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { DataTable, EMPTY_DATA } from "@/components/table";
import { useMemo, useState } from "react";
import { SearchInput } from "@/components/basic/search-input";
import { memoryColumns } from "./memory-cols";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { AsyncButton } from "@/components/basic/async-action-button";
import { Separator } from "@/components/ui/separator";
import { useConfirmationDialog } from "@/hooks/confirmation-dialog";

interface TableRow {
  id: string;
  content: string;
  updatedAt: Date;
  score?: number;
}

export function MemoryTab() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useDebouncedValue(
    query.trim(),
    1000,
  );

  const utils = api.useUtils();

  const { data: allMemories, isLoading } = api.memory.getAll.useQuery();
  const {
    data: searchResults,
    isFetching: isSearching,
    isError: isSearchError,
  } = api.memory.search.useQuery(
    { query: debouncedQuery, limit: 20 },
    {
      enabled: debouncedQuery.length > 0,
      refetchOnWindowFocus: false,
    },
  );

  const hasSearch = query.length > 0 && debouncedQuery.length > 0;

  const tableData = useMemo(() => {
    if (!hasSearch || !searchResults) return allMemories;
    return [...searchResults].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  }, [allMemories, hasSearch, searchResults]);

  const table = useReactTable<TableRow>({
    data: tableData ?? EMPTY_DATA,
    columns: memoryColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const deleteAllMemories = api.memory.deleteAll.useMutation({
    async onSuccess() {
      await utils.memory.getAll.cancel();
      utils.memory.getAll.setData(undefined, []);
      void utils.memory.invalidate();
    },
  });

  const { confirm } = useConfirmationDialog();

  const handleDeleteAll = async () => {
    const confirmed = await confirm({
      title: "Delete all memories?",
      description: "This action cannot be undone.",
      confirmText: "Delete",
      variant: "destructive",
    });
    if (confirmed) {
      deleteAllMemories.mutate();
    }
  };

  return (
    <SettingsContent>
      <SettingsGroup title="Memory">
        <Setting
          title="Query"
          description="Enter a query to see how memories are retrieved."
          className="items-center"
        >
          <SearchInput
            value={query}
            onChange={(value) => setQuery(value)}
            isLoading={isSearching}
            placeholder="Type to query..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                setDebouncedQuery(query.trim());
              }
            }}
          />
        </Setting>
        <DataTable table={table} isLoading={isLoading} />
        {allMemories && allMemories.length > 0 && (
          <>
            <Separator className="my-4" />
            <Setting
              title="Delete all"
              description="Permanently delete all memories your companion has about you."
            >
              <AsyncButton
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={handleDeleteAll}
                isLoading={deleteAllMemories.isPending}
              >
                Delete all
              </AsyncButton>
            </Setting>
          </>
        )}
      </SettingsGroup>
    </SettingsContent>
  );
}
