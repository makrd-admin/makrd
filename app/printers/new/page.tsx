import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import PrinterForm from "./printer-form";

export const metadata: Metadata = { title: "Register a Printer · maKrd" };

export default async function NewPrinterPage() {
  await requireUser();

  return (
    <main className="mx-auto w-full max-w-2xl p-6 sm:p-10">
      <h1 className="mb-6 text-xl font-semibold">Register a printer</h1>
      <PrinterForm />
    </main>
  );
}
