# Generated by Django 5.1.6 on 2025-02-13 22:09

import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Cliente',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nome', models.CharField(max_length=100)),
                ('cognome', models.CharField(blank=True, max_length=100)),
                ('ragione_sociale', models.CharField(blank=True, max_length=200)),
                ('partita_iva', models.CharField(blank=True, max_length=11, validators=[django.core.validators.RegexValidator('^\\d{11}$')])),
                ('codice_fiscale', models.CharField(blank=True, max_length=16, validators=[django.core.validators.RegexValidator('^[A-Za-z0-9]{16}$')])),
                ('indirizzo', models.CharField(max_length=200)),
                ('citta', models.CharField(max_length=100)),
                ('cap', models.CharField(max_length=5, validators=[django.core.validators.RegexValidator('^\\d{5}$')])),
                ('provincia', models.CharField(max_length=2)),
                ('telefono', models.CharField(blank=True, max_length=15)),
                ('email', models.EmailField(blank=True, max_length=254)),
                ('data_creazione', models.DateTimeField(auto_now_add=True)),
                ('data_modifica', models.DateTimeField(auto_now=True)),
                ('note', models.TextField(blank=True)),
                ('tipologia', models.CharField(choices=[('privato', 'Privato'), ('azienda', 'Azienda')], default='privato', max_length=20)),
                ('codice_cliente', models.CharField(max_length=10, unique=True)),
            ],
            options={
                'verbose_name': 'Cliente',
                'verbose_name_plural': 'Clienti',
                'ordering': ['ragione_sociale', 'cognome', 'nome'],
            },
        ),
        migrations.CreateModel(
            name='Fornitore',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nome', models.CharField(max_length=100)),
                ('cognome', models.CharField(blank=True, max_length=100)),
                ('ragione_sociale', models.CharField(blank=True, max_length=200)),
                ('partita_iva', models.CharField(blank=True, max_length=11, validators=[django.core.validators.RegexValidator('^\\d{11}$')])),
                ('codice_fiscale', models.CharField(blank=True, max_length=16, validators=[django.core.validators.RegexValidator('^[A-Za-z0-9]{16}$')])),
                ('indirizzo', models.CharField(max_length=200)),
                ('citta', models.CharField(max_length=100)),
                ('cap', models.CharField(max_length=5, validators=[django.core.validators.RegexValidator('^\\d{5}$')])),
                ('provincia', models.CharField(max_length=2)),
                ('telefono', models.CharField(blank=True, max_length=15)),
                ('email', models.EmailField(blank=True, max_length=254)),
                ('data_creazione', models.DateTimeField(auto_now_add=True)),
                ('data_modifica', models.DateTimeField(auto_now=True)),
                ('note', models.TextField(blank=True)),
                ('codice_fornitore', models.CharField(max_length=10, unique=True)),
                ('categoria', models.CharField(choices=[('ricambi', 'Ricambi'), ('servizi', 'Servizi'), ('altro', 'Altro')], default='altro', max_length=50)),
            ],
            options={
                'verbose_name': 'Fornitore',
                'verbose_name_plural': 'Fornitori',
                'ordering': ['ragione_sociale', 'cognome', 'nome'],
            },
        ),
    ]
