import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen text-slate-900">
      <main className="mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 gap-12 px-6 py-16 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="flex flex-col justify-center">
          <p className="text-xs uppercase tracking-[0.3em] text-teal-600">
            HostFlow
          </p>
          <h1 className="mt-6 text-5xl font-semibold text-slate-900 sm:text-6xl">
            A waitlist system built for the host stand.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-slate-600">
            Restaurants run two devices: Host Mode behind the stand and Guest
            Kiosk Mode for walk-ins. Everything stays in sync in real time.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/login"
              className="rounded-full bg-teal-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal-400"
            >
              Restaurant login
            </Link>
            <a
              href="#pricing"
              className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
            >
              Pricing
            </a>
          </div>
        </section>

        <section className="grid gap-6">
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Device mode
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-900">
              Host dashboard
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Seat, remove, or edit parties instantly. The queue adjusts in
              real time.
            </p>
            <ul className="mt-4 grid gap-2 text-sm text-slate-700">
              <li>Add walk-ins</li>
              <li>Seat with a tap</li>
              <li>Remove no-shows</li>
            </ul>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Device mode
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-900">
              Guest kiosk
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Full-screen sign-up for walk-ins. No menus. No distractions.
            </p>
            <ul className="mt-4 grid gap-2 text-sm text-slate-700">
              <li>Large, touch-first inputs</li>
              <li>Instant confirmation</li>
              <li>Runs on tablet or QR link</li>
            </ul>
          </div>
        </section>
      </main>

      <section
        id="pricing"
        className="mx-auto w-full max-w-6xl px-6 pb-20"
      >
        <div className="rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Pricing
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-900">
            Simple, restaurant-ready licensing.
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <p className="text-sm text-slate-500">Monthly</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                $19
                <span className="text-base font-medium text-slate-500">
                  /mo
                </span>
              </p>
              <p className="mt-3 text-sm text-slate-600">
                Unlimited devices, guest kiosk, and live queue.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <p className="text-sm text-slate-500">Annual</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                $199
                <span className="text-base font-medium text-slate-500">
                  /yr
                </span>
              </p>
              <p className="mt-3 text-sm text-slate-600">
                Best value for year-round service and support.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
