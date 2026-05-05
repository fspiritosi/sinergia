"use client";

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import { Toaster, toast } from "sonner";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Ocurrió un error inesperado.";
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
            retry: 1,
          },
          mutations: {
            retry: 1,
          },
        },
        mutationCache: new MutationCache({
          onError: (error) => {
            toast.error(getErrorMessage(error));
          },
        }),
        queryCache: new QueryCache({
          onError: (error) => {
            toast.error(getErrorMessage(error));
          },
        }),
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="top-right" richColors closeButton />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
