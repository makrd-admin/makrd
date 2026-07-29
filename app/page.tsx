import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BenchyScrollScene from "@/components/benchy-scroll-scene";
import Reveal from "@/components/reveal";
import WaterFlow from "@/components/water-flow";
import LandingTheme from "@/components/landing-theme";
import { PRINTER_MODELS } from "@/lib/printer-models";

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
    body: "Printing for others earns points; getting something printed spends them.",
  },
];

const ROADMAP = [
  "Filament recycling — turning failed prints and waste into cheap material",
  "Automated print finishing — resin-coating and polishing to a professional finish",
  "A fully-modular, ultra-affordable printer for the network",
];

const FEATURED_PRINTERS = PRINTER_MODELS.slice(0, 4);

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
      <LandingTheme />
      <BenchyScrollScene />

      <section className="mx-auto w-full max-w-7xl px-6 py-16 sm:px-10">
        <Reveal>
          <h2 className="mb-8 text-sm font-semibold tracking-wide text-neutral-400 uppercase dark:text-neutral-500">
            The short version
          </h2>
        </Reveal>
        <div className="grid gap-6 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <Reveal key={step.title} delayMs={i * 120}>
              <div className="glass flex h-full flex-col gap-2 rounded-2xl p-6">
                <span className="text-gradient text-sm font-semibold">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">{step.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-16 sm:px-10">
        <Reveal>
          <h2 className="mb-2 text-lg font-semibold">Meet the network</h2>
          <p className="mb-8 max-w-2xl text-sm text-neutral-500 dark:text-neutral-400">
            Every printer on maKrd is owned and run by a real member — not a warehouse. Here&apos;s
            a slice of what&apos;s already registered.
          </p>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURED_PRINTERS.map((printer, i) => (
            <Reveal key={`${printer.make}-${printer.model}`} delayMs={i * 100}>
              <div className="glass flex h-full flex-col gap-1 rounded-2xl p-5">
                <p className="font-semibold">{printer.make}</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">{printer.model}</p>
                <p className="mt-2 text-xs text-neutral-400 dark:text-neutral-500">
                  Build volume: {printer.buildVolume}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-6 py-16 sm:px-10 lg:grid-cols-[0.9fr_1.1fr]">
        <Reveal>
          <h2 className="mb-3 text-lg font-semibold">Where this is headed</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            The marketplace is the first piece of a bigger loop — more members means more waste to
            recycle back into cheap material, which means cheaper prints for everyone.
          </p>
        </Reveal>
        <ul className="flex flex-col gap-3">
          {ROADMAP.map((item, i) => (
            <Reveal key={item} delayMs={i * 100}>
              <li className="glass rounded-xl px-4 py-3 text-sm text-neutral-600 dark:text-neutral-300">
                {item}
              </li>
            </Reveal>
          ))}
        </ul>
      </section>

      <WaterFlow>
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 text-center">
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">
            Your next print is one signup away.
          </h2>
          <p className="max-w-xl text-white/80">
            Register a printer, submit a job, or just come see who&apos;s already on the network.
          </p>
          <a
            href="/login"
            className="mt-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-neutral-900 transition-transform hover:scale-[1.03] active:scale-[0.98]"
          >
            Sign in with Google
          </a>
        </div>
      </WaterFlow>
    </main>
  );
}
