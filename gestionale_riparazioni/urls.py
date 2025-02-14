from django.contrib import admin
from django.urls import path, include
from django.shortcuts import render
from django.contrib.auth.decorators import login_required

@login_required
def home_view(request):
    return render(request, 'home.html')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('anagrafiche/', include('anagrafiche.urls', namespace='anagrafiche')),
    path('', home_view, name='home'),  # Cambiato da 'home/' a '' per la root
    path('auth/', include('authsystem.urls')),
]