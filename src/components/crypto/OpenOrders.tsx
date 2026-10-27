"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { X } from "lucide-react";

import { DataTable } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatClock, formatPrice, formatQty, type OpenOrder } from "@/lib/demo/crypto";

type OpenOrdersProps = { orders: OpenOrder[]; onCancel: (order: OpenOrder) => void };

export function OpenOrders({ orders, onCancel }: OpenOrdersProps) {
  const columns = React.useMemo<ColumnDef<OpenOrder>[]>(
    () => [
      {
        accessorKey: "symbol",
        header: "Pair",
        cell: ({ row }) => (
          <span className="whitespace-nowrap font-medium">
            {row.original.symbol}
            <span className="text-muted-foreground">/USD</span>
          </span>
        ),
      },
      {
        accessorKey: "side",
        header: "Side",
        cell: ({ row }) => <Badge variant={row.original.side === "Buy" ? "success" : "danger"}>{row.original.side}</Badge>,
      },
      { accessorKey: "kind", header: "Type", cell: ({ row }) => <span className="whitespace-nowrap text-muted-foreground">{row.original.kind}</span> },
      {
        accessorKey: "price",
        header: "Price",
        cell: ({ row }) => <span className="whitespace-nowrap font-mono text-xs tabular-nums">{formatPrice(row.original.price, row.original.price < 1 ? 4 : 2)}</span>,
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => (
          <span className="whitespace-nowrap font-mono text-xs tabular-nums">
            {formatQty(row.original.amount, 6)} {row.original.symbol}
          </span>
        ),
      },
      {
        accessorKey: "filled",
        header: "Filled",
        cell: ({ row }) => {
          const percent = Math.min(100, Math.round((row.original.filled / row.original.amount) * 100));
          return (
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary" aria-hidden="true">
                <span className="block h-full rounded-full bg-brand transition-[width] duration-500" style={{ width: `${percent}%` }} />
              </span>
              <span className="font-mono text-[11px] tabular-nums text-muted-foreground">{percent}%</span>
              <span className="sr-only">{percent}% filled</span>
            </span>
          );
        },
      },
      {
        accessorKey: "placedAt",
        header: "Placed",
        cell: ({ row }) => <span className="whitespace-nowrap text-xs text-muted-foreground">{formatClock(row.original.placedAt)}</span>,
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={`Cancel order ${row.original.id}`}
            onClick={(event) => {
              event.stopPropagation();
              onCancel(row.original);
            }}
            className="text-muted-foreground hover:text-danger"
          >
            <X aria-hidden="true" />
            Cancel
          </Button>
        ),
      },
    ],
    [onCancel],
  );

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Open orders</CardTitle>
        <p className="text-xs text-muted-foreground">Simulated fills update while the workspace is open. Cancel any order to release the row instantly.</p>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={orders}
          searchPlaceholder="Search open orders…"
          pageSize={5}
          emptyTitle="No open orders"
          emptyDescription="Place a limit order to see it resting here."
        />
      </CardContent>
    </Card>
  );
}
