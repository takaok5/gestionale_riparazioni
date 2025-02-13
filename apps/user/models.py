from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

class User(AbstractUser):
    """
    Custom User model that extends AbstractUser (Django 4.x).
    We add a 'role' field to differentiate user categories (admin, tecnico, commerciale).
    """
    ADMIN = 'admin'
    TECNICO = 'tecnico'
    COMMERCIALE = 'commerciale'
    ROLE_CHOICES = [
        (ADMIN, 'Admin'),
        (TECNICO, 'Tecnico'),
        (COMMERCIALE, 'Commerciale'),
    ]
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default=TECNICO  # di default, ad esempio
    )

class AuditLog(models.Model):
    """
    AuditLog registra chi ha creato, modificato o cancellato un oggetto.
    Può essere esteso in base a necessità (tenere traccia di campi modificati, ecc.).
    """
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=50)  # es: 'create', 'update', 'delete'
    object_type = models.CharField(max_length=100)
    object_id = models.CharField(max_length=36)  # ID generico dell'oggetto
    timestamp = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.user} ha effettuato {self.action} su {self.object_type} (ID: {self.object_id})"