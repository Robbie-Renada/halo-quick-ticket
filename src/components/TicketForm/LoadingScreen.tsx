function LoadingScreen() {
  return (
    <div className="w-full min-h-[470px] text-sm flex flex-col items-center justify-center">
      <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-teal-700" />
      <p className="text-xs text-stone-500">Connecting to Halo…</p>
    </div>
  );
}

export default LoadingScreen;
