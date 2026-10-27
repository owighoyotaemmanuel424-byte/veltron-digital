"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnPinningState,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

export type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchPlaceholder?: string;
  filterColumnId?: string;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  className?: string;
};

export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = "Filter records…",
  filterColumnId,
  pageSize = 10,
  onPageSizeChange,
  loading = false,
  emptyTitle = "No records found",
  emptyDescription = "Try changing your search or filters.",
  emptyAction,
  className,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [columnPinning, setColumnPinning] = React.useState<ColumnPinningState>({
    left: [],
    right: [],
  });
  const [internalPageSize, setInternalPageSize] = React.useState(pageSize);
  const [pageIndex, setPageIndex] = React.useState(0);

  React.useEffect(() => {
    setInternalPageSize(pageSize);
  }, [pageSize]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnPinning,
      pagination: { pageIndex, pageSize: internalPageSize },
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnPinningChange: setColumnPinning,
    onPaginationChange: (updater) => {
      const current = { pageIndex, pageSize: internalPageSize };
      const next = typeof updater === "function" ? updater(current) : updater;
      setPageIndex(next.pageIndex);
      setInternalPageSize(next.pageSize);
      onPageSizeChange?.(next.pageSize);
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableColumnPinning: true,
  });

  const headers = table.getHeaderGroups();
  const rows = table.getRowModel().rows;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label={searchPlaceholder}
            placeholder={searchPlaceholder}
            value={
              filterColumnId
                ? String(table.getColumn(filterColumnId)?.getFilterValue() ?? "")
                : globalFilter
            }
            onChange={(event) => {
              if (filterColumnId) {
                table.getColumn(filterColumnId)?.setFilterValue(event.target.value);
              } else {
                setGlobalFilter(event.target.value);
              }
              setPageIndex(0);
            }}
            className="pl-9"
          />
        </label>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <label htmlFor="data-table-page-size">Rows</label>
          <select
            id="data-table-page-size"
            className="h-9 rounded-md border border-input bg-background px-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={internalPageSize}
            onChange={(event) => {
              const nextSize = Number(event.target.value);
              setInternalPageSize(nextSize);
              setPageIndex(0);
              onPageSizeChange?.(nextSize);
            }}
          >
            {[5, 10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-auto rounded-lg border border-border">
        <table className="w-full caption-bottom text-sm">
          <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur">
            {headers.map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  const sortIcon =
                    sorted === "asc" ? (
                      <ArrowUp className="size-3.5" />
                    ) : sorted === "desc" ? (
                      <ArrowDown className="size-3.5" />
                    ) : (
                      <ArrowUpDown className="size-3.5 opacity-50" />
                    );

                  return (
                    <th
                      key={header.id}
                      className="h-11 whitespace-nowrap border-b border-border px-4 text-left align-middle font-medium text-muted-foreground"
                    >
                      {header.isPlaceholder ? null : (
                        <button
                          type="button"
                          className={cn(
                            "inline-flex items-center gap-2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            header.column.getCanSort() ? "cursor-pointer" : "cursor-default",
                          )}
                          onClick={header.column.getToggleSortingHandler()}
                          aria-label={
                            header.column.getCanSort()
                              ? `Sort by ${typeof header.column.columnDef.header === "string" ? header.column.columnDef.header : header.id}`
                              : undefined
                          }
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() ? sortIcon : null}
                        </button>
                      )}
                      {header.column.getCanPin() ? (
                        <button
                          type="button"
                          className="ml-2 rounded px-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          aria-label={header.column.getIsPinned() ? "Unpin column" : "Pin column left"}
                          title={header.column.getIsPinned() ? "Unpin column" : "Pin column left"}
                          onClick={() => header.column.pin(header.column.getIsPinned() ? false : "left")}
                        >
                          {header.column.getIsPinned() ? "Unpin" : "Pin"}
                        </button>
                      ) : null}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          <tbody>
            {loading ? (
              Array.from({ length: Math.min(internalPageSize, 5) }, (_, rowIndex) => (
                <tr key={rowIndex} className="border-b border-border last:border-0">
                  {columns.map((_, columnIndex) => (
                    <td key={columnIndex} className="px-4 py-3">
                      <Skeleton className="h-4 w-24" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length > 0 ? (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border transition-colors hover:bg-muted/40 last:border-0"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={Math.max(columns.length, 1)} className="p-8">
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                  {emptyAction}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>{table.getFilteredRowModel().rows.length} result(s)</span>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-md border border-border px-3 py-1.5 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </button>
          <button
            type="button"
            className="rounded-md border border-border px-3 py-1.5 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
