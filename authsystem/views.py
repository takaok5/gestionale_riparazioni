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
from django.contrib.auth import views as auth_views

from .models import User, Role

# Form per Role
class RoleForm(forms.ModelForm):
    class Meta:
        model = Role
        fields = ['name', 'description']

    def clean_name(self):
        name = self.cleaned_data.get('name')
        if not name:
            raise ValidationError('Il nome del ruolo è obbligatorio.')
        if Role.objects.filter(name=name).exists():
            raise ValidationError('Questo nome di ruolo esiste già.')
        return name

# Vista per la creazione dei ruoli
class RoleCreateView(LoginRequiredMixin, UserPassesTestMixin, CreateView):
    model = Role
    form_class = RoleForm
    template_name = 'authsystem/role_form.html'
    success_url = reverse_lazy('role-list')

    def test_func(self):
        return self.request.user.role == User.ADMIN

    def form_invalid(self, form):
        messages.error(self.request, 'Si prega di correggere gli errori nel form.')
        return super().form_invalid(form)

    def form_valid(self, form):
        messages.success(self.request, 'Ruolo creato con successo!')
        return super().form_valid(form)

class LoginView(auth_views.LoginView):
    template_name = 'authsystem/login.html'
    success_url = reverse_lazy('home')

    def form_valid(self, form):
        messages.success(self.request, "Login effettuato con successo!")
        return super().form_valid(form)

class LogoutView(auth_views.LogoutView):
    next_page = 'login'

    def dispatch(self, request, *args, **kwargs):
        messages.info(request, "Logout effettuato correttamente.")
        return super().dispatch(request, *args, **kwargs)

def register_view(request):
    """Vista di registrazione utente."""
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            messages.success(request, "Registrazione effettuata con successo!")
            return redirect('login')
    else:
        form = UserCreationForm()
    return render(request, 'authsystem/register.html', {'form': form})

class MyPasswordResetView(PasswordResetView):
    """
    Vista di reset password. Usa la form di default (PasswordResetForm).
    """
    template_name = 'authsystem/password_reset.html'
    email_template_name = 'authsystem/password_reset_email.html'
    success_url = reverse_lazy('password_reset_done')

def restricted_view(request):
    """
    Esempio di vista che richiede ruoli 'admin' o 'commerciale'.
    """
    if not request.user.is_authenticated:
        messages.error(request, "Devi effettuare il login per accedere a questa pagina.")
        return redirect('login')
    
    if request.user.role not in ['admin', 'commerciale']:
        messages.error(request, "Non hai i permessi necessari per accedere a questa pagina.")
        return redirect('home')
        
    return render(request, 'authsystem/restricted.html')