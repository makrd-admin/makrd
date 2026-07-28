import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PrinterLoader from "@/components/printer-loader";
import LogoMark from "@/components/logo-mark";

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
    body: "Printing for others earns points; getting something printed spends them. Need more? Top up anytime.",
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
      <section className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-16 sm:px-10 sm:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="flex flex-col items-start gap-6">
          <div className="flex items-center gap-2">
            <LogoMark size={32} />
            <span className="text-gradient text-lg font-semibold">maKrd</span>
          </div>
          <h1 className="text-5xl leading-[1.05] font-semibold tracking-tight sm:text-6xl">
            Get anything <span className="text-gradient">3D printed</span> by someone near you.
          </h1>
          <p className="max-w-xl text-lg text-neutral-600 dark:text-neutral-400">
            A community-owned, peer-to-peer printing network. Pay in points — earn them by printing
            for others, or top up anytime.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/login"
              className="btn-gradient rounded-full px-6 py-3 text-sm font-medium text-white transition-transform hover:scale-[1.03] active:scale-[0.98]"
            >
              Sign in with Google
            </a>
            <a
              href="/announcements"
              className="rounded-full px-5 py-3 text-sm font-medium text-neutral-600 underline underline-offset-4 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
            >
              See what&apos;s coming
            </a>
          </div>
        </div>
        <div className="flex justify-center lg:justify-end">
          <PrinterLoader size={220} />
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-16 sm:px-10">
        <h2 className="mb-8 text-sm font-semibold tracking-wide text-neutral-400 uppercase dark:text-neutral-500">
          How it works
        </h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <div key={step.title} className="glass flex flex-col gap-2 rounded-2xl p-6">
              <span className="text-gradient text-sm font-semibold">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="font-semibold">{step.title}</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-6 py-16 sm:px-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <h2 className="mb-3 text-lg font-semibold">Where this is headed</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            The marketplace is the first piece of a bigger loop — more members means more waste to
            recycle back into cheap material, which means cheaper prints for everyone.
          </p>
        </div>
        <ul className="flex flex-col gap-3">
          {ROADMAP.map((item) => (
            <li
              key={item}
              className="glass rounded-xl px-4 py-3 text-sm text-neutral-600 dark:text-neutral-300"
            >
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-16 sm:px-10">
        <div className="glass-strong flex flex-col items-start gap-4 rounded-3xl p-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Own a printer? Put it to work.</h2>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Register it, set your materials, and start earning points fulfilling jobs from members
              near you.
            </p>
          </div>
          <a
            href="/login"
            className="btn-gradient shrink-0 rounded-full px-6 py-2.5 text-sm font-medium whitespace-nowrap text-white transition-transform hover:scale-[1.03] active:scale-[0.98]"
          >
            Get started
          </a>
        </div>
      </section>
    </main>
  );
}
