import { requireUser } from "@/lib/auth";
import JobForm from "./job-form";

export default async function NewJobPage() {
  await requireUser();

  return (
    <main className="mx-auto max-w-lg p-8">
      <h1 className="mb-6 text-xl font-semibold">Submit a print job</h1>
      <JobForm />
    </main>
  );
}
