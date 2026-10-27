"use client";

import * as React from "react";
import {
  flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel,
  getSortedRowModel, useReactTable,
  type ColumnDef, type ColumnFiltersState, type ColumnPinningState, type SortingState,
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
  onRowClick?: (row: TData) => void;
  /** Controlled global search (useful when the caller also exports filtered rows). */
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  /** Window rows instead of rendering every row of the current page. */
  virtualized?: boolean;
};

/** Row window for the virtualized body: viewport plus overscan, clamped to the row count. */
export function computeRowWindow(total: number, scrollTop: number, viewportHeight: number, rowHeight: number, overscan = 8) {
  if (total <= 0 || rowHeight <= 0) return { start: 0, end: 0 };
  const rawStart = Math.floor(Math.max(scrollTop, 0) / rowHeight) - overscan;
  const start = Math.max(0, Math.min(rawStart, total - 1));
  const end = Math.min(total, Math.ceil((Math.max(scrollTop, 0) + Math.max(viewportHeight, 1)) / rowHeight) + overscan);
  return { start, end: Math.max(end, start + 1) };
}

export function DataTable<TData, TValue>({
  columns, data, searchPlaceholder = "Filter records…", filterColumnId,
  pageSize = 10, onPageSizeChange, loading = false,
  emptyTitle = "No records found", emptyDescription = "Try changing your search or filters.",
  emptyAction, className, onRowClick, searchValue, onSearchChange, virtualized = false,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [internalFilter, setInternalFilter] = React.useState("");
  const globalFilter = searchValue ?? internalFilter;
  const updateGlobalFilter = onSearchChange ?? setInternalFilter;
  const [columnPinning, setColumnPinning] = React.useState<ColumnPinningState>({ left: [], right: [] });
  const [internalPageSize, setInternalPageSize] = React.useState(pageSize);
  const [pageIndex, setPageIndex] = React.useState(0);

  React.useEffect(() => setInternalPageSize(pageSize), [pageSize]);

  const table = useReactTable({
    data, columns,
    state: { sorting, columnFilters, globalFilter, columnPinning, pagination: { pageIndex, pageSize: internalPageSize } },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: updateGlobalFilter,
    onColumnPinningChange: setColumnPinning,
    onPaginationChange: (updater) => {
      const currentState = { pageIndex, pageSize: internalPageSize };
      const nextState = typeof updater === "function" ? updater(currentState) : updater;
      setPageIndex(nextState.pageIndex);
      setInternalPageSize(nextState.pageSize);
      if (nextState.pageSize !== currentState.pageSize) onPageSizeChange?.(nextState.pageSize);
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableColumnPinning: true,
  });

  const rows = table.getRowModel().rows;
  const visibleColumnCount = table.getVisibleLeafColumns().length;

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = React.useState({ top: 0, height: 0 });
  const [measuredRowHeight, setMeasuredRowHeight] = React.useState(0);
  // Callback ref so the window re-measures whenever a different row becomes the first one.
  const measureRow = React.useCallback((node: HTMLTableRowElement | null) => {
    const height = node?.getBoundingClientRect().height ?? 0;
    if (height > 0) setMeasuredRowHeight((previous) => (Math.abs(previous - height) > 0.5 ? height : previous));
  }, []);
  const virtual = virtualized && !loading && rows.length > 0;
  // Until a row height is measured, render the whole page and window from the next paint.
  const windowed = virtual && measuredRowHeight > 0;
  const { start, end } = windowed
    ? computeRowWindow(rows.length, scrollState.top, scrollState.height, measuredRowHeight)
    : { start: 0, end: rows.length };
  const visibleRows = windowed ? rows.slice(start, end) : rows;

  // Viewport height drives how many rows sit in the window.
  React.useEffect(() => {
    if (!virtual) return;
    const element = scrollRef.current;
    if (!element) return;
    const sync = () => setScrollState((state) => (state.height === element.clientHeight ? state : { ...state, height: element.clientHeight }));
    sync();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(sync);
    observer.observe(element);
    return () => observer.disconnect();
  }, [virtual]);

  // New data (filters, sorting, pagination) restarts the window at the top.
  React.useEffect(() => {
    const element = scrollRef.current;
    if (element && element.scrollTop > 0) element.scrollTop = 0;
    setScrollState((state) => (state.top === 0 ? state : { ...state, top: 0 }));
  }, [data]);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label={searchPlaceholder}
            placeholder={searchPlaceholder}
            value={filterColumnId ? String(table.getColumn(filterColumnId)?.getFilterValue() ?? "") : globalFilter}
            onChange={(event) => {
              if (filterColumnId) table.getColumn(filterColumnId)?.setFilterValue(event.target.value);
              else updateGlobalFilter(event.target.value);
              setPageIndex(0);
            }}
            className="pl-9"
          />
        </label>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <label htmlFor="data-table-page-size">Rows</label>
          <select id="data-table-page-size" className="h-9 rounded-md border border-input bg-background px-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={internalPageSize} onChange={(event) => {
            const nextSize = Number(event.target.value);
            setInternalPageSize(nextSize); setPageIndex(0); onPageSizeChange?.(nextSize);
          }}>
            {[5, 10, 20, 50].map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
        </div>
      </div>

      <div
        ref={scrollRef}
        className={cn("overflow-auto rounded-lg border border-border", virtual && "max-h-[560px]")}
        onScroll={virtual ? (event) => {
          // Read the offset now: React may run the state updater after the handler
          // returns, when event.currentTarget is already null.
          const top = event.currentTarget.scrollTop;
          setScrollState((state) => (state.top === top ? state : { ...state, top }));
        } : undefined}
      >
        <table className="w-full caption-bottom text-sm">
          <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur">
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  const sortIcon = sorted === "asc" ? <ArrowUp className="size-3.5" /> : sorted === "desc" ? <ArrowDown className="size-3.5" /> : <ArrowUpDown className="size-3.5 opacity-50" />;
                  const label = typeof header.column.columnDef.header === "string" ? header.column.columnDef.header : header.id;
                  return (
                    <th key={header.id} className="h-11 whitespace-nowrap border-b border-border px-4 text-left align-middle font-medium text-muted-foreground">
                      {header.isPlaceholder ? null : (
                        <button type="button" className={cn("inline-flex items-center gap-2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", header.column.getCanSort() ? "cursor-pointer" : "cursor-default")} onClick={header.column.getToggleSortingHandler()} aria-label={header.column.getCanSort() ? "Sort by " + label : undefined}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() ? sortIcon : null}
                        </button>
                      )}
                      {header.column.getCanPin() ? (
                        <button type="button" className="ml-2 rounded px-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={header.column.getIsPinned() ? "Unpin column" : "Pin column left"} onClick={() => header.column.pin(header.column.getIsPinned() ? false : "left")}>
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
            {loading ? Array.from({ length: Math.min(internalPageSize, 5) }, (_, rowIndex) => (
              <tr key={rowIndex} className="border-b border-border last:border-0">
                {Array.from({ length: visibleColumnCount }, (_, columnIndex) => <td key={columnIndex} className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>)}
              </tr>
            )) : rows.length > 0 ? <>
              {start > 0 ? <tr aria-hidden="true" style={{ height: start * measuredRowHeight }}><td className="p-0" colSpan={Math.max(visibleColumnCount, 1)} /></tr> : null}
              {visibleRows.map((row, index) => (
              <tr key={row.id} ref={virtual && index === 0 ? measureRow : undefined} onClick={onRowClick ? () => onRowClick(row.original) : undefined} onKeyDown={onRowClick ? (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onRowClick(row.original); } } : undefined} tabIndex={onRowClick ? 0 : undefined} aria-label={onRowClick ? "Open row details" : undefined} className={"border-b border-border transition-colors hover:bg-muted/40 last:border-0 " + (onRowClick ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring" : "")}>
                {row.getVisibleCells().map((cell) => <td key={cell.id} className="px-4 py-3 align-middle">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}
              </tr>
              ))}
              {end < rows.length ? <tr aria-hidden="true" style={{ height: (rows.length - end) * measuredRowHeight }}><td className="p-0" colSpan={Math.max(visibleColumnCount, 1)} /></tr> : null}
            </> : (
              <tr><td colSpan={Math.max(visibleColumnCount, 1)} className="p-8"><EmptyState title={emptyTitle} description={emptyDescription} />{emptyAction}</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>{table.getFilteredRowModel().rows.length} result(s)</span>
        <div className="flex gap-2">
          <button type="button" className="rounded-md border border-border px-3 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Previous</button>
          <button type="button" className="rounded-md border border-border px-3 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</button>
        </div>
      </div>
    </div>
  );
}
