import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PrinterLoader from "@/components/printer-loader";
import OnboardingTour from "@/components/onboarding-tour";

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
      <section className="flex flex-col items-center gap-6 px-8 py-20 text-center">
        <PrinterLoader size={140} />
        <h1 className="text-5xl font-semibold tracking-tight">
          <span className="text-gradient">makrd</span>
        </h1>
        <p className="max-w-xl text-lg text-neutral-600 dark:text-neutral-400">
          A community-owned, peer-to-peer 3D printing network. Get anything printed by a member near
          you — pay in points, earned by printing for others.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href="/login"
            className="btn-gradient rounded-full px-6 py-3 text-sm font-medium text-white transition-transform hover:scale-[1.03] active:scale-[0.98]"
          >
            Sign in with Google
          </a>
          <OnboardingTour />
        </div>
      </section>

      <section className="px-8 py-16">
        <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <div key={step.title} className="glass flex flex-col gap-2 rounded-2xl p-6">
              <span className="text-gradient text-sm font-semibold">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h2 className="font-semibold">{step.title}</h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-8 py-16">
        <div className="glass mx-auto flex max-w-2xl flex-col gap-4 rounded-2xl p-8 text-center">
          <h2 className="text-lg font-semibold">Where this is headed</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            The marketplace is the first piece of a bigger loop — more members means more waste to
            recycle back into cheap material, which means cheaper prints for everyone.
          </p>
          <ul className="mx-auto flex max-w-md flex-col gap-2 text-left text-sm text-neutral-500 dark:text-neutral-400">
            {ROADMAP.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-neutral-300 dark:text-neutral-700">—</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="flex flex-col items-center gap-4 px-8 py-20 text-center">
        <div className="glass-strong flex max-w-md flex-col items-center gap-4 rounded-3xl p-10">
          <h2 className="text-lg font-semibold">Own a printer? Put it to work.</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Register it, set your materials, and start earning points fulfilling jobs from members
            near you.
          </p>
          <a
            href="/login"
            className="btn-gradient rounded-full px-6 py-2.5 text-sm font-medium text-white transition-transform hover:scale-[1.03] active:scale-[0.98]"
          >
            Get started
          </a>
        </div>
      </section>
    </main>
  );
}
