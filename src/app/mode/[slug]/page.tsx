import Link from "next/link";

export default function DeviceModePage({
  params,
}: {
  params: { slug: string };
}) {
  const slug = params.slug;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-16">
        <p className="text-sm uppercase tracking-[0.3em] text-teal-600">
          HostFlow
        </p>
        <h1 className="mt-4 text-4xl font-semibold text-slate-900 sm:text-5xl">
          Choose device mode
        </h1>
        <p className="mt-3 max-w-2xl text-base text-slate-600">
          This tablet is for {slug}. Pick a mode and bookmark the URL for
          future use.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-900">
              Host dashboard
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              For the host stand. Seat parties and manage the queue.
            </p>
            <Link
              href={`/host/${slug}`}
              className="mt-6 inline-flex rounded-2xl bg-teal-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-400"
            >
              Open host mode
            </Link>
            <p className="mt-4 text-xs text-slate-500">
              /host/{slug}
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-900">
              Guest kiosk
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Full-screen sign-up for walk-ins or QR scans.
            </p>
            <Link
              href={`/kiosk/${slug}`}
              className="mt-6 inline-flex rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-300"
            >
              Open kiosk mode
            </Link>
            <p className="mt-4 text-xs text-slate-500">
              /kiosk/{slug}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
