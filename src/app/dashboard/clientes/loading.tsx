import { Skeleton } from "@/components/ui/skeleton"

export default function ClientesLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-4 w-[300px]" />
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-10 w-full max-w-sm" />
        <Skeleton className="h-10 w-[120px]" />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <div className="p-4">
          {/* Table header */}
          <div className="grid grid-cols-5 gap-4 pb-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>

          {/* Table rows */}
          {[...Array(8)].map((_, i) => (
            <div key={i} className="grid grid-cols-5 gap-4 py-3 border-t">
              {[...Array(5)].map((_, j) => (
                <Skeleton key={j} className="h-4 w-full" />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-[150px]" />
        <Skeleton className="h-8 w-[250px]" />
      </div>
    </div>
  )
}
