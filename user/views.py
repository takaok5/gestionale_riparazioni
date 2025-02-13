from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.urls import reverse
from django.http import HttpResponse
from .models import User, AuditLog
from django.views.generic import View
from django.contrib.auth.forms import AuthenticationForm, PasswordResetForm

# Decoratore per controllare i permessi in base al ruolo.
def role_required(allowed_roles=None):
    """
    Decoratore di esempio per verificare se l'utente appartiene a uno dei ruoli ammessi.
    Esempio di utilizzo:
      @role_required(allowed_roles=['admin'])
      def my_view(request):
          ...
    """
    if allowed_roles is None:
        allowed_roles = []

    def decorator(view_func):
        def _wrapped_view(request, *args, **kwargs):
            if not request.user.is_authenticated:
                messages.error(request, "Devi essere autenticato.")
                return redirect('login')
            if request.user.role not in allowed_roles:
                messages.error(request, "Non hai i permessi per accedere a questa pagina.")
                return redirect('home')  # o altra pagina di default
            return view_func(request, *args, **kwargs)
        return _wrapped_view
    return decorator

class LoginView(View):
    """
    Vista basata su classi per gestire il login usando AuthenticationForm.
    """
    template_name = 'users/login.html'

    def get(self, request):
        form = AuthenticationForm()
        return render(request, self.template_name, {'form': form})

    def post(self, request):
        form = AuthenticationForm(data=request.POST)
        if form.is_valid():
            user = form.get_user()
            login(request, user)
            # Eventuale AuditLog
            AuditLog.objects.create(
                user=user,
                action='login',
                object_type='session',
                object_id=str(user.pk)
            )
            messages.success(request, "Login avvenuto con successo.")
            return redirect('home')
        else:
            messages.error(request, "Credenziali non valide.")
        return render(request, self.template_name, {'form': form})

@login_required
def logout_view(request):
    """
    Vista per gestire il logout.
    """
    user = request.user
    logout(request)
    # Eventuale AuditLog
    AuditLog.objects.create(
        user=user,
        action='logout',
        object_type='session',
        object_id=str(user.pk)
    )
    messages.success(request, "Logout effettuato con successo.")
    return redirect('login')

class RegisterView(View):
    """
    Vista di esempio per la registrazione (opzionale).
    In un contesto reale potresti usare UserCreationForm o un form personalizzato.
    """
    template_name = 'users/register.html'

    def get(self, request):
        return render(request, self.template_name)

    def post(self, request):
        username = request.POST.get('username')
        password = request.POST.get('password')
        role = request.POST.get('role', User.TECNICO)
        if username and password:
            if User.objects.filter(username=username).exists():
                messages.error(request, "Nome utente già esistente.")
            else:
                user = User.objects.create_user(username=username, password=password, role=role)
                AuditLog.objects.create(
                    user=user,
                    action='create',
                    object_type='User',
                    object_id=str(user.pk)
                )
                messages.success(request, "Utente creato con successo.")
                return redirect('login')
        else:
            messages.error(request, "Inserisci username e password.")
        return render(request, self.template_name)

@login_required
@role_required(allowed_roles=['admin', 'tecnico'])
def delete_user(request, user_id):
    """
    Vista di esempio che mostra come gestire la cancellazione verificando il permesso.
    """
    try:
        user_to_delete = User.objects.get(pk=user_id)
        user_to_delete.delete()
        # AuditLog
        AuditLog.objects.create(
            user=request.user,
            action='delete',
            object_type='User',
            object_id=str(user_id)
        )
        messages.success(request, f"Utente {user_id} cancellato con successo.")
    except User.DoesNotExist:
        messages.error(request, "Utente non esistente.")
    return redirect('home')

class PasswordResetView(View):
    """
    Vista basata su classi per resettare la password usando PasswordResetForm.
    Si appoggia alle email di sistema configurate in Django (settings EMAIL_...).
    """
    template_name = 'users/password_reset.html'

    def get(self, request):
        form = PasswordResetForm()
        return render(request, self.template_name, {'form': form})

    def post(self, request):
        form = PasswordResetForm(request.POST)
        if form.is_valid():
            form.save(
                request=request,
                email_template_name='users/password_reset_email.html',
                subject_template_name='users/password_reset_subject.txt',
            )
            messages.success(request, "Email di reset password inviata.")
            return redirect('login')
        else:
            messages.error(request, "Errore nel reset della password.")
        return render(request, self.template_name, {'form': form})

def home_view(request):
    """
    Vista placeholder di home (protetta o pubblica a piacere).
    """
    return render(request, 'users/home.html')