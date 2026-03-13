function LoadingScreen() {
  return (
    <div className="w-full min-h-[470px] bg-white text-sm flex flex-col items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  );
}

export default LoadingScreen;
