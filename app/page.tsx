import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const STEPS = [
  {
    title: "Submit a job",
    body: "Upload a model, pick a material and quantity, see the points cost up front.",
  },
  {
    title: "A nearby member prints it",
    body: "Providers with a registered printer browse open jobs and accept one that fits.",
  },
  {
    title: "Earn or spend points",
    body: "Printing for others earns points; getting something printed spends them. No cash changes hands.",
  },
];

const ROADMAP = [
  "Filament recycling — turning failed prints and waste into cheap material",
  "Automated print finishing — resin-coating and polishing to a professional finish",
  "A fully-modular, ultra-affordable printer for the network",
];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex flex-1 flex-col">
      <section className="flex flex-col items-center gap-6 px-8 py-24 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">makrd</h1>
        <p className="max-w-xl text-lg text-neutral-600 dark:text-neutral-400">
          A community-owned, peer-to-peer 3D printing network. Get anything printed by a member near
          you — pay in points, earned by printing for others.
        </p>
        <a
          href="/login"
          className="rounded-md bg-neutral-900 px-6 py-3 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Sign in with Google
        </a>
      </section>

      <section className="border-t border-neutral-200 px-8 py-16 dark:border-neutral-800">
        <div className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <div key={step.title} className="flex flex-col gap-2">
              <span className="text-sm font-medium text-neutral-400">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h2 className="font-semibold">{step.title}</h2>
              <p className="text-sm text-neutral-500">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-neutral-200 px-8 py-16 dark:border-neutral-800">
        <div className="mx-auto flex max-w-2xl flex-col gap-4 text-center">
          <h2 className="text-lg font-semibold">Where this is headed</h2>
          <p className="text-sm text-neutral-500">
            The marketplace is the first piece of a bigger loop — more members means more waste to
            recycle back into cheap material, which means cheaper prints for everyone.
          </p>
          <ul className="mx-auto flex max-w-md flex-col gap-2 text-left text-sm text-neutral-500">
            {ROADMAP.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-neutral-300 dark:text-neutral-700">—</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="flex flex-col items-center gap-4 border-t border-neutral-200 px-8 py-16 text-center dark:border-neutral-800">
        <h2 className="text-lg font-semibold">Own a printer? Put it to work.</h2>
        <p className="max-w-md text-sm text-neutral-500">
          Register it, set your materials, and start earning points fulfilling jobs from members
          near you.
        </p>
        <a
          href="/login"
          className="rounded-md border border-neutral-300 px-5 py-2.5 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          Get started
        </a>
      </section>
    </main>
  );
}
