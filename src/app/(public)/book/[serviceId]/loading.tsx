import { Skeleton } from "@/components/ui/skeleton";

export default function BookLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Memuat jadwal">
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-64 max-w-full" />
        <Skeleton className="h-4 w-40" />
      </div>
      <Skeleton className="h-36" />
      <Skeleton className="h-96" />
    </div>
  );
}
