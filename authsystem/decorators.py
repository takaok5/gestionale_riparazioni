from django.shortcuts import redirect
from django.contrib import messages
from functools import wraps

def role_required(allowed_roles=None):
    """
    Decorator per limitare l’accesso a utenti con ruoli specifici.
    Esempio: @role_required(['admin', 'tecnico'])
    """
    if allowed_roles is None:
        allowed_roles = []

    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            if not request.user.is_authenticated:
                messages.error(request, "Devi essere autenticato per accedere a questa pagina.")
                return redirect('login')

            # Se l'utente ha un ruolo compreso in allowed_roles, OK
            if request.user.role in allowed_roles:
                return view_func(request, *args, **kwargs)
            else:
                messages.error(request, "Non hai i permessi necessari per accedere a questa pagina.")
                return redirect('home')  # Oppure a una pagina di errore

        return _wrapped_view
    return decorator
