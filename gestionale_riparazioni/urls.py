from django.contrib import admin
from django.urls import path, include
from django.http import Http404, HttpResponse

SERVICE_DETAILS = {
    "sostituzione-display": {
        "title": "Sostituzione display",
        "summary": "Diagnosi avanzata e sostituzione display per smartphone.",
        "description": "Ricambi originali, test touch e luminosita con collaudo finale.",
        "price_from": "da 99 EUR",
        "average_duration": "2-3 giorni",
    }
}

INACTIVE_SERVICE_SLUGS = {"riparazione-legacy"}

def home_view(request):
    return HttpResponse(
        """
<!doctype html>
<html lang="it">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Gestionale Riparazioni - Home Pubblica</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 0; background: #f8fafc; color: #0f172a; }
      main { max-width: 960px; margin: 0 auto; padding: 2rem 1rem; }
      section { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem; margin-bottom: 1rem; }
      .cta-row a { display: inline-block; margin-right: 0.75rem; margin-top: 0.5rem; }
    </style>
  </head>
  <body>
    <main>
      <section>
        <h1>Riparazioni rapide e trasparenti</h1>
        <p>Servizi in evidenza per diagnosi, sostituzioni e recupero dati.</p>
        <div class="cta-row">
          <a href="/richiedi-preventivo">Richiedi preventivo</a>
          <a href="/portale/login">Accedi al portale cliente</a>
        </div>
      </section>
      <section><h2>Recensioni</h2></section>
      <section><h2>FAQ</h2></section>
      <section><h2>Contatti</h2></section>
    </main>
  </body>
</html>
"""
    )

def service_detail_view(request, slug):
    normalized_slug = slug.strip().lower()
    if normalized_slug in INACTIVE_SERVICE_SLUGS:
        raise Http404("Service not found")

    service = SERVICE_DETAILS.get(normalized_slug)
    if service is None:
        raise Http404("Service not found")

    return HttpResponse(
        f"""
<!doctype html>
<html lang="it">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{service['title']} - Gestionale Riparazioni</title>
  </head>
  <body>
    <main>
      <h1>{service['title']}</h1>
      <p>{service['summary']}</p>
      <p>{service['description']}</p>
      <p>{service['price_from']}</p>
      <p>{service['average_duration']}</p>
    </main>
  </body>
</html>
"""
    )

urlpatterns = [
    path('admin/', admin.site.urls),
    path('anagrafiche/', include('anagrafiche.urls', namespace='anagrafiche')),
    path('', home_view, name='home'),  # Cambiato da 'home/' a '' per la root
    path('servizi/<slug:slug>', service_detail_view, name='service-detail'),
    path('servizi/<slug:slug>/', service_detail_view, name='service-detail-slash'),
    path('auth/', include('authsystem.urls')),
]
