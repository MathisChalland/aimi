import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

interface MemoryRow {
  id: string;
  content: string;
  updatedAt: Date;
  score?: number;
}

export const memoryColumns: ColumnDef<MemoryRow>[] = [
  // {
  //   id: "select",
  //   header: "",
  //   //cell: ({ row }) => <div className="flex items-center gap-2">-</div>,
  // },
  {
    id: "memory",
    header: "Memory",
    cell: ({ row }) => <span>{row.original.content}</span>,
  },
  {
    id: "updatedAt",
    header: "Updated At",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {format(row.original.updatedAt, "PP")}
      </span>
    ),
  },
  {
    id: "score",
    header: "Similarity",
    cell: ({ row }) => {
      const score = row.original.score;
      return (
        <span className="w-full text-end font-medium tabular-nums">
          {score ? Math.round(score * 100) + "%" : "-"}
        </span>
      );
    },
  },
];
