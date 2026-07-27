import { requireUser } from "@/lib/auth";
import PrinterForm from "./printer-form";

export default async function NewPrinterPage() {
  await requireUser();

  return (
    <main className="mx-auto max-w-lg p-8">
      <h1 className="mb-6 text-xl font-semibold">Register a printer</h1>
      <PrinterForm />
    </main>
  );
}
