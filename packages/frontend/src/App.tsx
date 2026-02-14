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

const publicContactsPage = {
  phone: "+39 02 1234 5678",
  email: "info@centrotest.it",
  openingHours: "Lun-Ven 09:00-18:30; Sab 09:00-13:00",
  mapPlaceholder: "Mappa in aggiornamento",
} as const;

const publicFaqSections = [
  {
    category: "Accettazione",
    items: [
      {
        question: "Quanto dura una diagnosi?",
        answer: "24-48 ore",
      },
    ],
  },
  {
    category: "Preventivi",
    items: [
      {
        question: "Il preventivo e gratuito?",
        answer: "Si, salvo guasti non standard",
      },
    ],
  },
] as const;

const hasPublicFaqEntries = publicFaqSections.some((section) => section.items.length > 0);

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

function normalizePath(path: string): string {
  if (path.length > 1 && path.endsWith("/")) {
    return path.slice(0, -1);
  }

  return path;
}

function App({ path = "/" }: AppProps) {
  const normalizedPath = normalizePath(path);
  const detailSlug = getServiceSlugFromPath(normalizedPath);
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

  if (normalizedPath === "/contatti") {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <main className="mx-auto max-w-screen-md px-4 py-10 sm:px-6 lg:px-8">
          <nav className="text-sm text-slate-500">
            <a href="/" className="hover:text-slate-700">
              Home
            </a>{" "}
            / Contatti
          </nav>

          <section className="mt-5 rounded-3xl bg-white p-7 shadow-sm ring-1 ring-slate-100 sm:p-10">
            <h1 className="text-3xl font-bold">Contatti</h1>
            <p className="mt-3 text-sm text-slate-600">
              Canali diretti per supporto rapido e aggiornamenti sulla tua richiesta.
            </p>

            <dl className="mt-6 grid gap-4 rounded-2xl bg-slate-100 p-5 text-sm text-slate-800 sm:grid-cols-2">
              <div>
                <dt className="font-semibold">Telefono</dt>
                <dd>
                  <a href="tel:+390212345678" className="underline hover:text-slate-600">
                    {publicContactsPage.phone}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="font-semibold">Email</dt>
                <dd>
                  <a
                    href="mailto:info@centrotest.it"
                    className="underline hover:text-slate-600"
                  >
                    {publicContactsPage.email}
                  </a>
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="font-semibold">Orari</dt>
                <dd>{publicContactsPage.openingHours}</dd>
              </div>
            </dl>

            <section className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Mappa
              </h2>
              <p className="mt-2 text-sm text-slate-700">{publicContactsPage.mapPlaceholder}</p>
            </section>
          </section>
        </main>
      </div>
    );
  }

  if (normalizedPath === "/faq") {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <main className="mx-auto max-w-screen-md px-4 py-10 sm:px-6 lg:px-8">
          <nav className="text-sm text-slate-500">
            <a href="/" className="hover:text-slate-700">
              Home
            </a>{" "}
            / FAQ
          </nav>

          <section className="mt-5 rounded-3xl bg-white p-7 shadow-sm ring-1 ring-slate-100 sm:p-10">
            <h1 className="text-3xl font-bold">FAQ</h1>
            <p className="mt-3 text-sm text-slate-600">
              Domande frequenti su diagnosi, tempi e processo preventivo.
            </p>

            <div className="mt-6 space-y-6">
              {hasPublicFaqEntries ? (
                publicFaqSections.map((section) => (
                  <section key={section.category}>
                    <h2 className="text-lg font-semibold">{section.category}</h2>
                    <div className="mt-3 space-y-3">
                      {section.items.map((item) => (
                        <details
                          key={item.question}
                          open
                          className="rounded-2xl bg-slate-100 p-4 text-sm text-slate-800"
                        >
                          <summary className="cursor-pointer font-semibold">
                            {item.question}
                          </summary>
                          <p className="mt-2">{item.answer}</p>
                        </details>
                      ))}
                    </div>
                  </section>
                ))
              ) : (
                <p className="rounded-2xl bg-slate-100 p-4 text-sm text-slate-700">
                  Nessuna FAQ disponibile
                </p>
              )}
            </div>
          </section>
        </main>
      </div>
    );
  }

  if (normalizedPath === "/richiedi-preventivo") {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <main className="mx-auto max-w-screen-md px-4 py-10 sm:px-6 lg:px-8">
          <nav className="text-sm text-slate-500">
            <a href="/" className="hover:text-slate-700">
              Home
            </a>{" "}
            / Richiedi preventivo
          </nav>

          <section className="mt-5 rounded-3xl bg-white p-7 shadow-sm ring-1 ring-slate-100 sm:p-10">
            <h1 className="text-3xl font-bold">Richiedi preventivo o appuntamento</h1>
            <p className="mt-3 text-sm text-slate-600">
              Invia i dati principali e ti contatteremo con conferma e ticket.
            </p>

            <form className="mt-6 grid gap-4">
              <label className="grid gap-1 text-sm">
                <span className="font-semibold text-slate-700">Nome e cognome</span>
                <input
                  type="text"
                  name="nome"
                  className="rounded-xl border border-slate-300 px-3 py-2"
                  placeholder="Mario Rossi"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-semibold text-slate-700">Email</span>
                <input
                  type="email"
                  name="email"
                  className="rounded-xl border border-slate-300 px-3 py-2"
                  placeholder="mario@test.it"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-semibold text-slate-700">Problema</span>
                <textarea
                  name="problema"
                  className="min-h-24 rounded-xl border border-slate-300 px-3 py-2"
                  placeholder="Descrivi il guasto principale"
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" name="consensoPrivacy" />
                Acconsento al trattamento privacy
              </label>
              <button
                type="submit"
                className="inline-flex w-fit items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Invia richiesta
              </button>
            </form>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-screen-xl max-w-screen items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Gestionale Riparazioni
          </p>
          <nav className="flex items-center gap-4 text-sm text-slate-600">
            <a href="/servizi/sostituzione-display" className="hover:text-slate-900">
              Servizi
            </a>
            <a href="/faq" className="hover:text-slate-900">
              FAQ
            </a>
            <a href="/contatti" className="hover:text-slate-900">
              Contatti
            </a>
          </nav>
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
