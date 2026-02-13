const highlightedServices = [
  {
    title: "Diagnosi smartphone e tablet",
    description: "Check completo hardware/software con report chiaro dei guasti.",
    estimatedPrice: "da 29 EUR",
    averageTime: "24-48 ore",
  },
  {
    title: "Sostituzione display e batterie",
    description:
      "Ricambi selezionati con collaudo finale e controllo funzionale completo.",
    estimatedPrice: "da 59 EUR",
    averageTime: "1-2 giorni",
  },
  {
    title: "Recupero dati e messa in sicurezza",
    description:
      "Backup assistito, recupero da dispositivi danneggiati e protezione account.",
    estimatedPrice: "da 79 EUR",
    averageTime: "2-3 giorni",
  },
] as const;

const trustBlocks = [
  {
    title: "Recensioni",
    text: "Valutazione media 4.8/5 con feedback verificati da clienti reali.",
  },
  {
    title: "FAQ",
    text: "Risposte rapide su tempi, garanzia e processo di presa in carico.",
  },
  {
    title: "Contatti",
    text: "Telefono, email e orari aggiornati per richiedere supporto immediato.",
  },
] as const;

const serviceDetails = {
  "sostituzione-display": {
    slug: "sostituzione-display",
    title: "Sostituzione display",
    summary: "Diagnosi avanzata e sostituzione display per smartphone e laptop.",
    description:
      "Ricambi originali, test touch e luminosita, collaudo finale su sensori e fotocamere.",
    priceFrom: "da 99 EUR",
    averageDuration: "2-3 giorni",
    categoria: "smartphone",
  },
} as const;

type AppProps = {
  path?: string;
};

function getServiceSlugFromPath(path: string): string | null {
  const match = /^\/servizi\/([^/]+)\/?$/.exec(path);
  if (!match) {
    return null;
  }

  return decodeURIComponent(match[1]);
}

function App({ path = "/" }: AppProps) {
  const detailSlug = getServiceSlugFromPath(path);
  if (detailSlug) {
    const detail = serviceDetails[detailSlug as keyof typeof serviceDetails];
    if (!detail) {
      return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
          <main className="mx-auto max-w-screen-md px-4 py-16 sm:px-6 lg:px-8">
            <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-100">
              <h1 className="text-2xl font-bold">Servizio non disponibile</h1>
              <p className="mt-3 text-sm text-slate-600">
                Il servizio richiesto non e disponibile pubblicamente.
              </p>
            </section>
          </main>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <main className="mx-auto max-w-screen-md px-4 py-12 sm:px-6 lg:px-8">
          <section className="rounded-3xl bg-white p-7 shadow-sm ring-1 ring-slate-100 sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              servizio: {detail.slug}
            </p>
            <h1 className="mt-3 text-3xl font-bold">{detail.title}</h1>
            <p className="mt-4 text-base text-slate-600">{detail.summary}</p>
            <p className="mt-4 text-sm text-slate-700">{detail.description}</p>
            <dl className="mt-6 grid gap-4 rounded-2xl bg-slate-100 p-5 text-sm text-slate-800 sm:grid-cols-2">
              <div>
                <dt className="font-semibold">Prezzo indicativo</dt>
                <dd>{detail.priceFrom}</dd>
              </div>
              <div>
                <dt className="font-semibold">Tempo medio</dt>
                <dd>{detail.averageDuration}</dd>
              </div>
            </dl>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-screen-xl max-w-screen px-4 py-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Gestionale Riparazioni
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-screen-xl max-w-screen px-4 py-10 sm:px-6 lg:px-8">
        <section className="grid gap-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 lg:grid-cols-[2fr_1fr] lg:p-10">
          <div>
            <p className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Assistenza certificata
            </p>
            <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">
              Riparazioni rapide e trasparenti
            </h1>
            <p className="mt-4 text-base text-slate-600 sm:text-lg">
              Gestiamo diagnosi, riparazioni e aggiornamenti con tempi chiari e
              preventivi leggibili prima di ogni intervento.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="/richiedi-preventivo"
                className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Richiedi preventivo
              </a>
              <a
                href="/portale/login"
                className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-500"
              >
                Accedi al portale cliente
              </a>
            </div>
          </div>

          <aside className="rounded-2xl bg-slate-100 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Impegno tempi medi
            </p>
            <p className="mt-3 text-sm text-slate-700">
              85% delle riparazioni chiuse entro 48 ore con aggiornamenti stato
              notificati in tempo reale.
            </p>
          </aside>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold">Servizi in evidenza</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {highlightedServices.map((service) => (
              <article
                key={service.title}
                className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100"
              >
                <h3 className="text-lg font-semibold">{service.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{service.description}</p>
                <dl className="mt-4 space-y-1 text-sm text-slate-700">
                  <div>
                    <dt className="font-medium">prezzo indicativo</dt>
                    <dd>{service.estimatedPrice}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">tempo medio</dt>
                    <dd>{service.averageTime}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold">Perche sceglierci</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {trustBlocks.map((block) => (
              <article
                key={block.title}
                className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100"
              >
                <h3 className="text-lg font-semibold">{block.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{block.text}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export { App };
