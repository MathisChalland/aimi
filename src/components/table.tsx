import { flexRender, type Table as TableState } from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DataTableProps<TData extends { id: string }> {
  table: TableState<TData>;
  fixedCols?: string[];
  handleRowSelection?: (
    rowIndex: number,
    rowId: string,
    event: React.MouseEvent,
  ) => void;
  onItemClick?: (id: string) => void;
}

export function DataTable<TData extends { id: string }>({
  table,
  fixedCols,
  handleRowSelection,
  onItemClick,
}: DataTableProps<TData>) {
  return (
    <div className="w-full rounded-xl select-none">
      <Table className="w-full table-auto">
        <TableHeader className="group">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header, index) => {
                const isFixedColumn = fixedCols?.includes(header.id);

                return (
                  <TableHead
                    key={header.id}
                    style={
                      isFixedColumn
                        ? { width: header.getSize() }
                        : { minWidth: header.column.columnDef.minSize }
                    }
                    className={`${
                      index < headerGroup.headers.length - 1
                        ? "border-border border-r"
                        : ""
                    } px-2.5`}
                    onClick={() => {
                      if (header.id === "select") {
                        table.toggleAllPageRowsSelected(
                          !table.getIsAllPageRowsSelected(),
                        );
                      } else if (header.column.getCanSort()) {
                        header.column.toggleSorting();
                      }
                    }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row, rowIndex) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className="group px-0"
                onContextMenu={(e) => {
                  e.preventDefault();
                  row.toggleSelected(!row.getIsSelected());
                }}
              >
                {row.getVisibleCells().map((cell, index) => {
                  const isFixedColumn = fixedCols?.includes(cell.column.id);

                  return (
                    <TableCell
                      key={cell.id}
                      style={
                        isFixedColumn
                          ? { width: cell.column.getSize() }
                          : { minWidth: cell.column.columnDef.minSize }
                      }
                      className={`px-2.5 ${
                        index < row.getVisibleCells().length - 1
                          ? "border-border border-r"
                          : ""
                      }`}
                      onClick={(e) => {
                        if (cell.column.id === "select") {
                          handleRowSelection?.(rowIndex, row.id, e);
                        } else {
                          onItemClick?.(row.id);
                        }
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={table.getVisibleFlatColumns().length}
                className="h-24 text-center"
              >
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
