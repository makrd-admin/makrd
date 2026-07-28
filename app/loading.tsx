import SkipperLoadingScene from "@/components/skipper-loading-scene";

export default function Loading() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <SkipperLoadingScene size={280} />
      <p className="text-sm text-neutral-500 dark:text-neutral-400" role="status">
        Warming up the nozzle…
      </p>
    </main>
  );
}
