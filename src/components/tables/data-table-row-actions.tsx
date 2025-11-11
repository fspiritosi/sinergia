"use client"

import { Row } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface DataTableRowActionsProps<TData> {
    row: Row<TData>
    actions?: {
        label: string
        onClick: (row: TData) => void
        variant?: "default" | "destructive"
    }[]
}

export function DataTableRowActions<TData>({
    row,
    actions = [
        {
            label: "Editar",
            onClick: () => console.log("Editar", row.original),
        },
        {
            label: "Copiar",
            onClick: () => console.log("Copiar", row.original),
        },
        {
            label: "Eliminar",
            onClick: () => console.log("Eliminar", row.original),
            variant: "destructive" as const,
        },
    ],
}: DataTableRowActionsProps<TData>) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
                >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Abrir menú</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
                {actions.map((action, index) => (
                    <div key={index}>
                        <DropdownMenuItem
                            onClick={() => action.onClick(row.original)}
                            className={
                                action.variant === "destructive"
                                    ? "text-destructive focus:text-destructive"
                                    : ""
                            }
                        >
                            {action.label}
                        </DropdownMenuItem>
                        {index < actions.length - 1 && action.variant === "destructive" && (
                            <DropdownMenuSeparator />
                        )}
                    </div>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}