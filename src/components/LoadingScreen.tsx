export function LoadingScreen({ progress: _progress }: { progress: number }) {
  return (
    <div className="fixed inset-0 z-0 flex items-center justify-center overflow-hidden bg-stone-950">
      <img
        src="/images/loading-pic.png"
        alt="Loading..."
        className="absolute inset-0 w-full h-full object-cover opacity-100"
      />
    </div>
  )
}
