import { Skeleton } from "@/components/ui/skeleton"

export default function TiposVarianteLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-[190px]" />
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-10 w-full max-w-sm" />
        <Skeleton className="h-10 w-[160px]" />
      </div>
      <div className="rounded-md border p-4 space-y-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
      <Skeleton className="h-8 w-[250px]" />
    </div>
  )
}
