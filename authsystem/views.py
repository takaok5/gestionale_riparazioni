from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm, PasswordResetForm
from django.contrib.auth.views import PasswordResetView
from django.urls import reverse_lazy
from django.contrib import messages

from .models import User
from .decorators import role_required  # Lo creeremo dopo

path('login/', auth_views.LoginView.as_view(), name='login'),
path('logout/', auth_views.LogoutView.as_view(), name='logout'),

def register_view(request):
    """Vista di registrazione utente."""
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            # Esempio: potresti impostare un ruolo di default
            # user.role = User.TECNICO
            # user.save()
            messages.success(request, "Registrazione effettuata con successo!")
            return redirect('login')
    else:
        form = UserCreationForm()
    return render(request, 'authsystem/register.html', {'form': form})


def login_view(request):
    """Vista di login."""
    if request.method == 'POST':
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            user = form.get_user()
            login(request, user)
            messages.success(request, "Login effettuato con successo!")
            return redirect('home')  # o un'altra pagina
    else:
        form = AuthenticationForm()
    return render(request, 'authsystem/login.html', {'form': form})


def logout_view(request):
    """Vista di logout."""
    logout(request)
    messages.info(request, "Logout effettuato correttamente.")
    return redirect('login')


class MyPasswordResetView(PasswordResetView):
    """
    Vista di reset password. Usa la form di default (PasswordResetForm).
    """
    template_name = 'authsystem/password_reset.html'
    email_template_name = 'authsystem/password_reset_email.html'
    success_url = reverse_lazy('password_reset_done')


@role_required(allowed_roles=['admin', 'commerciale'])
def restricted_view(request):
    """
    Esempio di vista che richiede ruoli 'admin' o 'commerciale'.
    """
    return render(request, 'authsystem/restricted.html')
