import PrinterLoader from "@/components/printer-loader";

export default function Loading() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center p-8">
      <PrinterLoader caption="Warming up the nozzle…" />
    </main>
  );
}
