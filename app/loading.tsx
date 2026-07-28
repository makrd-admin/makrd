import PrinterLoaderRealistic from "@/components/printer-loader-realistic";

export default function Loading() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center p-8">
      <PrinterLoaderRealistic caption="Warming up the nozzle…" />
    </main>
  );
}
