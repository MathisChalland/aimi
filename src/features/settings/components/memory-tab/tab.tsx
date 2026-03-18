import { api } from "@/trpc/react";
import {
  Setting,
  SettingsContent,
  SettingsGroup,
} from "../settings-components";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { DataTable, EMPTY_DATA } from "@/components/table";
import { useEffect, useMemo, useState } from "react";
import { SearchInput } from "@/components/basic/search-input";
import { memoryColumns } from "./memory-cols";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

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

  const { data: allMemories } = api.memory.getAll.useQuery();
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

  return (
    <SettingsContent>
      <SettingsGroup title="Memory">
        <Setting
          title="Query"
          description="Enter a prompt to see how memories are retrieved."
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
        <DataTable table={table} />
      </SettingsGroup>
    </SettingsContent>
  );
}
