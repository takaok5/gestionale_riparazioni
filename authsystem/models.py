from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

class Role(models.Model):
    """
    Modello per la gestione dei ruoli nel sistema.
    Definisce i ruoli disponibili con nome e descrizione.
    """
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Ruolo'
        verbose_name_plural = 'Ruoli'

    def __str__(self):
        return self.name

class User(AbstractUser):
    """
    Custom user model che estende AbstractUser.
    Aggiungiamo un campo `role` per gestire ruoli base.
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
        default=TECNICO  # per esempio di default 'tecnico'
    )

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"


class AuditLog(models.Model):
    """
    Registra ogni creazione, modifica o cancellazione di oggetti
    (inclusi eventuali oggetti di altre app, se vogliamo).
    """
    ACTION_CREATE = 'create'
    ACTION_UPDATE = 'update'
    ACTION_DELETE = 'delete'

    ACTION_CHOICES = [
        (ACTION_CREATE, 'Created'),
        (ACTION_UPDATE, 'Updated'),
        (ACTION_DELETE, 'Deleted'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs'
    )
    action = models.CharField(max_length=6, choices=ACTION_CHOICES)
    model_name = models.CharField(max_length=100)
    object_id = models.CharField(max_length=50)  # usare CharField per generalità
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.timestamp}] {self.user} {self.action} {self.model_name} (ID {self.object_id})"


# -------------- SEZIONE SEGNALI PER L'AUDIT LOG --------------
# Esempio semplificato: se vuoi tracciare TUTTI i modelli, puoi
# registrare segnali su post_save e post_delete in modo generico.
# In casi reali potresti preferire un meccanismo più selettivo.

@receiver(post_save)
def create_or_update_audit_log(sender, instance, created, **kwargs):
    """Registra la creazione o l'aggiornamento di un oggetto."""
    # Evita di tracciare la creazione di un AuditLog stesso per evitare ricorsioni
    if sender == AuditLog:
        return

    # Se l'oggetto non ha un attributo `__class__.__name__`, ignora.
    model_name = instance.__class__.__name__
    obj_id = getattr(instance, 'id', None)  # Tenta di leggere l'ID
    if not obj_id:
        return

    action = AuditLog.ACTION_CREATE if created else AuditLog.ACTION_UPDATE
    # Cerca se c'è un 'current user' associato (es. con un middleware personalizzato),
    # ma in un progetto base, potremmo lasciarlo a None o usare altri approcci.

    AuditLog.objects.create(
        user=None,  # Se vuoi assegnare l'utente, devi passarlo da qualche parte.
        action=action,
        model_name=model_name,
        object_id=str(obj_id),
    )


@receiver(post_delete)
def delete_audit_log(sender, instance, **kwargs):
    """Registra la cancellazione di un oggetto."""
    if sender == AuditLog:
        return

    model_name = instance.__class__.__name__
    obj_id = getattr(instance, 'id', None)
    if not obj_id:
        return

    AuditLog.objects.create(
        user=None,
        action=AuditLog.ACTION_DELETE,
        model_name=model_name,
        object_id=str(obj_id),
    )