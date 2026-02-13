from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse

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

urlpatterns = [
    path('admin/', admin.site.urls),
    path('anagrafiche/', include('anagrafiche.urls', namespace='anagrafiche')),
    path('', home_view, name='home'),  # Cambiato da 'home/' a '' per la root
    path('auth/', include('authsystem.urls')),
]
