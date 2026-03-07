export function FlowConnector() {
  return (
    <div className="flex items-center justify-center w-8 shrink-0 self-center mt-3">
      <div className="relative w-full flex items-center">
        {/* Conveyor dots */}
        <div className="flex items-center gap-[3px]">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[3px] w-[3px] rounded-full bg-muted-foreground/40" />
          ))}
        </div>
        <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-muted-foreground/50 ml-0.5" />
      </div>
    </div>
  );
}
