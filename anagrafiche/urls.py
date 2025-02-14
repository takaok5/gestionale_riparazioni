from django.urls import path
from . import views

app_name = 'anagrafiche'

urlpatterns = [
    # URLs per Cliente
    path('clienti/', views.ClienteListView.as_view(), name='cliente-list'),
    path('clienti/new/', views.ClienteCreateView.as_view(), name='cliente-create'),
    path('clienti/<int:pk>/', views.ClienteDetailView.as_view(), name='cliente-detail'),
    path('clienti/<int:pk>/edit/', views.ClienteUpdateView.as_view(), name='cliente-update'),
    path('clienti/<int:pk>/delete/', views.ClienteDeleteView.as_view(), name='cliente-delete'),
    
    # URLs per Fornitore
    path('fornitori/', views.FornitoreListView.as_view(), name='fornitore-list'),
    # ... [Altri URL per Fornitore]
]