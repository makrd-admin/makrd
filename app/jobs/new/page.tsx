import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import JobForm from "./job-form";

export const metadata: Metadata = { title: "Submit a Job · maKrd" };

export default async function NewJobPage() {
  await requireUser();

  return (
    <main className="mx-auto w-full max-w-2xl p-6 sm:p-10">
      <h1 className="mb-6 text-xl font-semibold">Submit a print job</h1>
      <JobForm />
    </main>
  );
}
