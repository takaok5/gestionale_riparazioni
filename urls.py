from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse

def home_view(request):
    # Esempio di una vista semplice inline. In un progetto reale,
    # potresti spostarla in un'app dedicata (es: core/views.py)
    return HttpResponse("<h1>Benvenuto nella Home del Gestionale Riparazioni!</h1>")

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Definisci la pagina principale /home/
    path('home/', home_view, name='home'),
    
    # Includi le rotte dell'app authsystem sotto il prefisso /auth/
    path('auth/', include('authsystem.urls')),
]
