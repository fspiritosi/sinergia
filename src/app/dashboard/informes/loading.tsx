import { Skeleton } from "@/components/ui/skeleton"

export default function InformesLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-[180px]" />
        <Skeleton className="h-4 w-[280px]" />
      </div>

      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-10 w-full max-w-sm" />
        <Skeleton className="h-10 w-[130px]" />
      </div>

      <div className="rounded-md border">
        <div className="p-4 space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-2">
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-[150px]" />
        <Skeleton className="h-8 w-[250px]" />
      </div>
    </div>
  )
}
