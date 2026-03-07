export function FlowConnector() {
  return (
    <div className="flex items-center justify-center w-12 shrink-0">
      <div className="relative w-full h-0.5 bg-border">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[8px] border-l-muted-foreground" />
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-muted border-2 border-border" />
      </div>
    </div>
  );
}
