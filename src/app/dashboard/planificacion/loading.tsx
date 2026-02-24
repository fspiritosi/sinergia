import { Skeleton } from "@/components/ui/skeleton";

export default function PlanificacionLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-[220px]" />
      <div className="flex gap-4">
        <Skeleton className="h-10 w-[200px]" />
        <Skeleton className="h-10 w-[200px]" />
        <Skeleton className="h-10 w-[200px]" />
      </div>
      <div className="rounded-md border p-6">
        <div className="grid grid-cols-7 gap-2">
          {[...Array(35)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
