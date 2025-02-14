from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm, PasswordResetForm
from django.contrib.auth.views import PasswordResetView
from django.urls import reverse_lazy
from django.contrib import messages
from django.views.generic.edit import CreateView
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.core.exceptions import ValidationError
from django import forms
from django.db import DatabaseError
from django.conf import settings

from .models import User, Role

def is_database_ready():
    """Verifica se il database è pronto e le tabelle esistono"""
    try:
        # Verifica se la tabella User esiste facendo una query semplice
        User.objects.first()
        return True
    except DatabaseError:
        return False

# Form per Role
class RoleForm(forms.ModelForm):
    class Meta:
        model = Role
        fields = ['name', 'description']

    def clean_name(self):
        if not is_database_ready():
            return self.cleaned_data.get('name')
            
        name = self.cleaned_data.get('name')
        if not name:
            raise ValidationError('Il nome del ruolo è obbligatorio.')
        if Role.objects.filter(name=name).exists():
            raise ValidationError('Questo nome di ruolo esiste già.')
        return name

class RoleCreateView(LoginRequiredMixin, UserPassesTestMixin, CreateView):
    model = Role
    form_class = RoleForm
    template_name = 'authsystem/role_form.html'
    success_url = reverse_lazy('role-list')

    def test_func(self):
        if not is_database_ready():
            return False
        return self.request.user.role == User.ADMIN

    def form_invalid(self, form):
        messages.error(self.request, 'Si prega di correggere gli errori nel form.')
        return super().form_invalid(form)

    def form_valid(self, form):
        try:
            response = super().form_valid(form)
            messages.success(self.request, 'Ruolo creato con successo!')
            return response
        except DatabaseError:
            messages.error(self.request, 'Errore durante il salvataggio. Riprova più tardi.')
            return self.form_invalid(form)

def login_view(request):
    """Vista di login."""
    if not is_database_ready():
        messages.error(request, "Sistema in manutenzione. Riprova più tardi.")
        return render(request, 'authsystem/login.html', {'form': AuthenticationForm()})

    if request.method == 'POST':
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            try:
                user = form.get_user()
                login(request, user)
                messages.success(request, "Login effettuato con successo!")
                return redirect('home')
            except DatabaseError:
                messages.error(request, "Errore di connessione. Riprova più tardi.")
    else:
        form = AuthenticationForm()
    return render(request, 'authsystem/login.html', {'form': form})

def logout_view(request):
    """Vista di logout."""
    if not is_database_ready():
        messages.error(request, "Sistema in manutenzione. Riprova più tardi.")
        return redirect('login')

    try:
        logout(request)
        messages.info(request, "Logout effettuato correttamente.")
    except DatabaseError:
        messages.error(request, "Errore durante il logout. Riprova più tardi.")
    return redirect('login')

def register_view(request):
    """Vista di registrazione utente."""
    if not is_database_ready():
        messages.error(request, "Sistema in manutenzione. Riprova più tardi.")
        return render(request, 'authsystem/register.html', {'form': UserCreationForm()})

    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            try:
                user = form.save()
                messages.success(request, "Registrazione effettuata con successo!")
                return redirect('login')
            except DatabaseError:
                messages.error(request, "Errore durante la registrazione. Riprova più tardi.")
    else:
        form = UserCreationForm()
    return render(request, 'authsystem/register.html', {'form': form})

class MyPasswordResetView(PasswordResetView):
    """Vista di reset password."""
    template_name = 'authsystem/password_reset.html'
    email_template_name = 'authsystem/password_reset_email.html'
    success_url = reverse_lazy('password_reset_done')

    def dispatch(self, request, *args, **kwargs):
        if not is_database_ready():
            messages.error(request, "Sistema in manutenzione. Riprova più tardi.")
            return redirect('login')
        return super().dispatch(request, *args, **kwargs)

    def form_valid(self, form):
        try:
            return super().form_valid(form)
        except DatabaseError:
            messages.error(self.request, "Errore durante il reset della password. Riprova più tardi.")
            return self.form_invalid(form)

def restricted_view(request):
    """Vista che richiede ruoli specifici."""
    if not is_database_ready():
        messages.error(request, "Sistema in manutenzione. Riprova più tardi.")
        return redirect('login')

    try:
        if not request.user.is_authenticated:
            messages.error(request, "Devi effettuare il login per accedere a questa pagina.")
            return redirect('login')
        
        if request.user.role not in ['admin', 'commerciale']:
            messages.error(request, "Non hai i permessi necessari per accedere a questa pagina.")
            return redirect('home')
            
        return render(request, 'authsystem/restricted.html')
    except DatabaseError:
        messages.error(request, "Errore di connessione. Riprova più tardi.")
        return redirect('login')