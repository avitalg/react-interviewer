export function WorkspaceSkeleton() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="h-14 border-b border-border bg-surface" />
      <div className="grid flex-1 grid-cols-1 gap-px bg-border lg:grid-cols-2">
        <div className="animate-pulse bg-surface" />
        <div className="animate-pulse bg-surface" />
      </div>
    </div>
  );
}
