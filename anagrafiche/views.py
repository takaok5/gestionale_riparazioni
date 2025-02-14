from django.views.generic import ListView, DetailView, CreateView, UpdateView, DeleteView
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.urls import reverse_lazy
from django.shortcuts import redirect, render
from django.contrib import messages
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from django.core.exceptions import ValidationError
from django.db import transaction, DatabaseError
from django.db.models import Q
import logging

from .models import Cliente, Fornitore
from authsystem.models import User

logger = logging.getLogger(__name__)

def handle_db_error(func):
    """Decoratore per gestire gli errori del database"""
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except DatabaseError as e:
            logger.error(f"Database error: {e}")
            request = args[0] if len(args) > 0 else None
            if request and request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'status': 'error',
                    'message': 'Errore database. Riprova più tardi.'
                }, status=503)
            messages.error(request, 'Errore database. Riprova più tardi.')
            return redirect('home')
    return wrapper

class BaseListView(LoginRequiredMixin, ListView):
    paginate_by = 10
    
    def get_queryset(self):
        queryset = super().get_queryset()
        q = self.request.GET.get('q', '')
        if q:
            return self.get_search_results(queryset, q)
        return queryset
    
    @handle_db_error
    def get(self, request, *args, **kwargs):
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            queryset = self.get_queryset()
            data = list(queryset.values(*self.get_json_fields()))
            return JsonResponse({'results': data})
        return super().get(request, *args, **kwargs)

class BaseDetailView(LoginRequiredMixin, DetailView):
    @handle_db_error
    def get(self, request, *args, **kwargs):
        self.object = self.get_object()
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse(self.get_json_data())
        return super().get(request, *args, **kwargs)

class BaseCreateUpdateMixin:
    @transaction.atomic
    @handle_db_error
    def form_valid(self, form):
        self.object = form.save()
        if self.request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({
                'status': 'success',
                'message': f'{self.model.__name__} salvato con successo',
                'id': self.object.id
            })
        messages.success(self.request, f'{self.model.__name__} salvato con successo')
        return super().form_valid(form)

    def form_invalid(self, form):
        if self.request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({
                'status': 'error',
                'errors': form.errors
            }, status=400)
        return super().form_invalid(form)

class PermissionMixin(UserPassesTestMixin):
    def test_func(self):
        user = self.request.user
        if not user.is_authenticated:
            return False
        
        # Admin può fare tutto
        if user.role == User.ADMIN:
            return True
            
        # Tecnico può solo visualizzare
        if user.role == User.TECNICO:
            return self.request.method in ['GET', 'HEAD']
            
        return False

# Views Cliente
@method_decorator(ensure_csrf_cookie, name='dispatch')
class ClienteListView(BaseListView):
    model = Cliente
    context_object_name = 'clienti'
    template_name = 'anagrafiche/cliente_list.html'
    
    def get_json_fields(self):
        return ['id', 'nome', 'cognome', 'ragione_sociale', 'codice_cliente']
    
    def get_search_results(self, queryset, q):
        return queryset.filter(
            Q(nome__icontains=q) |
            Q(cognome__icontains=q) |
            Q(ragione_sociale__icontains=q) |
            Q(codice_cliente__icontains=q)
        )

class ClienteDetailView(BaseDetailView):
    model = Cliente
    context_object_name = 'cliente'
    template_name = 'anagrafiche/cliente_detail.html'
    
    def get_json_data(self):
        return {
            'cliente': {
                'id': self.object.id,
                'nome': self.object.nome,
                'cognome': self.object.cognome,
                'ragione_sociale': self.object.ragione_sociale,
                'codice_cliente': self.object.codice_cliente,
                'indirizzo': self.object.indirizzo,
                'citta': self.object.citta,
                'provincia': self.object.provincia,
            }
        }

class ClienteCreateView(PermissionMixin, BaseCreateUpdateMixin, CreateView):
    model = Cliente
    fields = ['nome', 'cognome', 'ragione_sociale', 'tipologia', 'partita_iva',
             'codice_fiscale', 'indirizzo', 'citta', 'cap', 'provincia',
             'telefono', 'email', 'note', 'codice_cliente']
    template_name = 'anagrafiche/cliente_form.html'
    success_url = reverse_lazy('anagrafiche:cliente-list')

class ClienteUpdateView(PermissionMixin, BaseCreateUpdateMixin, UpdateView):
    model = Cliente
    fields = ['nome', 'cognome', 'ragione_sociale', 'tipologia', 'partita_iva',
             'codice_fiscale', 'indirizzo', 'citta', 'cap', 'provincia',
             'telefono', 'email', 'note']
    template_name = 'anagrafiche/cliente_form.html'
    success_url = reverse_lazy('anagrafiche:cliente-list')

class ClienteDeleteView(PermissionMixin, DeleteView):
    model = Cliente
    template_name = 'anagrafiche/cliente_confirm_delete.html'
    success_url = reverse_lazy('anagrafiche:cliente-list')

    @handle_db_error
    def delete(self, request, *args, **kwargs):
        self.object = self.get_object()
        success_url = self.get_success_url()
        
        with transaction.atomic():
            self.object.delete()
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'status': 'success',
                    'message': 'Cliente eliminato con successo'
                })
            messages.success(request, 'Cliente eliminato con successo')
            return redirect(success_url)

# Views Fornitore
class FornitoreListView(BaseListView):
    model = Fornitore
    context_object_name = 'fornitori'
    template_name = 'anagrafiche/fornitore_list.html'
    
    def get_json_fields(self):
        return ['id', 'nome', 'cognome', 'ragione_sociale', 'codice_fornitore']
    
    def get_search_results(self, queryset, q):
        return queryset.filter(
            Q(nome__icontains=q) |
            Q(cognome__icontains=q) |
            Q(ragione_sociale__icontains=q) |
            Q(codice_fornitore__icontains=q)
        )

class FornitoreDetailView(BaseDetailView):
    model = Fornitore
    context_object_name = 'fornitore'
    template_name = 'anagrafiche/fornitore_detail.html'
    
    def get_json_data(self):
        return {
            'fornitore': {
                'id': self.object.id,
                'nome': self.object.nome,
                'cognome': self.object.cognome,
                'ragione_sociale': self.object.ragione_sociale,
                'codice_fornitore': self.object.codice_fornitore,
                'indirizzo': self.object.indirizzo,
                'citta': self.object.citta,
                'provincia': self.object.provincia,
            }
        }

class FornitoreCreateView(PermissionMixin, BaseCreateUpdateMixin, CreateView):
    model = Fornitore
    fields = ['nome', 'cognome', 'ragione_sociale', 'categoria', 'partita_iva',
             'codice_fiscale', 'indirizzo', 'citta', 'cap', 'provincia',
             'telefono', 'email', 'note', 'codice_fornitore']
    template_name = 'anagrafiche/fornitore_form.html'
    success_url = reverse_lazy('anagrafiche:fornitore-list')

class FornitoreUpdateView(PermissionMixin, BaseCreateUpdateMixin, UpdateView):
    model = Fornitore
    fields = ['nome', 'cognome', 'ragione_sociale', 'categoria', 'partita_iva',
             'codice_fiscale', 'indirizzo', 'citta', 'cap', 'provincia',
             'telefono', 'email', 'note']
    template_name = 'anagrafiche/fornitore_form.html'
    success_url = reverse_lazy('anagrafiche:fornitore-list')

class FornitoreDeleteView(PermissionMixin, DeleteView):
    model = Fornitore
    template_name = 'anagrafiche/fornitore_confirm_delete.html'
    success_url = reverse_lazy('anagrafiche:fornitore-list')

    @handle_db_error
    def delete(self, request, *args, **kwargs):
        self.object = self.get_object()
        success_url = self.get_success_url()
        
        with transaction.atomic():
            self.object.delete()
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'status': 'success',
                    'message': 'Fornitore eliminato con successo'
                })
            messages.success(request, 'Fornitore eliminato con successo')
            return redirect(success_url)