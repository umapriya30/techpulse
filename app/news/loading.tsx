import { GridSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="container-page py-10">
      <div className="mb-8 space-y-3">
        <div className="h-4 w-24 rounded skeleton" />
        <div className="h-9 w-2/3 rounded skeleton" />
        <div className="h-4 w-1/2 rounded skeleton" />
      </div>
      <GridSkeleton count={9} />
    </div>
  );
}
