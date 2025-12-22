"use client";

import { Loader2 } from "lucide-react";
import { ReactNode } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface TableStateProps {
  isLoading?: boolean;
  error?: string | null;
  isEmpty: boolean;
  emptyMessage: string;
  className?: string;
  children: ReactNode;
}

export function TableState({
  isLoading = false,
  error = null,
  isEmpty,
  emptyMessage,
  className,
  children,
}: TableStateProps) {
  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center py-8", className)}>
        <Loader2 className="mr-2 h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Cargando...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (isEmpty) {
    return (
      <div className={cn("flex items-center justify-center py-8", className)}>
        <span className="text-sm text-muted-foreground">{emptyMessage}</span>
      </div>
    );
  }

  return <>{children}</>;
}
