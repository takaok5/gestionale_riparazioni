from django.db import models
from django.core.validators import RegexValidator

class BaseAnagrafica(models.Model):
    """Classe base per campi comuni tra Cliente e Fornitore"""
    nome = models.CharField(max_length=100)
    cognome = models.CharField(max_length=100, blank=True)
    ragione_sociale = models.CharField(max_length=200, blank=True)
    partita_iva = models.CharField(
        max_length=11,
        validators=[RegexValidator(r'^\d{11}$')],
        blank=True
    )
    codice_fiscale = models.CharField(
        max_length=16,
        validators=[RegexValidator(r'^[A-Za-z0-9]{16}$')],
        blank=True
    )
    indirizzo = models.CharField(max_length=200)
    citta = models.CharField(max_length=100)
    cap = models.CharField(max_length=5, validators=[RegexValidator(r'^\d{5}$')])
    provincia = models.CharField(max_length=2)
    telefono = models.CharField(max_length=15, blank=True)
    email = models.EmailField(blank=True)
    data_creazione = models.DateTimeField(auto_now_add=True)
    data_modifica = models.DateTimeField(auto_now=True)
    note = models.TextField(blank=True)

    class Meta:
        abstract = True

    def __str__(self):
        if self.ragione_sociale:
            return self.ragione_sociale
        return f"{self.nome} {self.cognome}".strip()

class Cliente(BaseAnagrafica):
    tipologia = models.CharField(
        max_length=20,
        choices=[('privato', 'Privato'), ('azienda', 'Azienda')],
        default='privato'
    )
    codice_cliente = models.CharField(max_length=10, unique=True)

    class Meta:
        verbose_name = 'Cliente'
        verbose_name_plural = 'Clienti'
        ordering = ['ragione_sociale', 'cognome', 'nome']

class Fornitore(BaseAnagrafica):
    codice_fornitore = models.CharField(max_length=10, unique=True)
    categoria = models.CharField(
        max_length=50,
        choices=[
            ('ricambi', 'Ricambi'),
            ('servizi', 'Servizi'),
            ('altro', 'Altro')
        ],
        default='altro'
    )

    class Meta:
        verbose_name = 'Fornitore'
        verbose_name_plural = 'Fornitori'
        ordering = ['ragione_sociale', 'cognome', 'nome']