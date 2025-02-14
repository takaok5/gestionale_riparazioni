from django.test import TestCase, Client
from django.urls import reverse
from authsystem.models import User
from .models import Cliente, Fornitore

class AnagraficheTestCase(TestCase):
    def setUp(self):
        # Crea utenti di test
        self.admin_user = User.objects.create_user(
            username='admin',
            password='admin123',
            role=User.ADMIN
        )
        self.tech_user = User.objects.create_user(
            username='tecnico',
            password='tech123',
            role=User.TECNICO
        )
        
        # Crea cliente di test
        self.cliente = Cliente.objects.create(
            nome='Mario',
            cognome='Rossi',
            codice_cliente='CLI001',
            indirizzo='Via Test 1',
            citta='Roma',
            cap='00100',
            provincia='RM'
        )

    def test_cliente_list_view(self):
        # Test accesso non autenticato
        response = self.client.get(reverse('anagrafiche:cliente-list'))
        self.assertEqual(response.status_code, 302)  # Redirect al login
        
        # Test accesso tecnico
        self.client.login(username='tecnico', password='tech123')
        response = self.client.get(reverse('anagrafiche:cliente-list'))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'anagrafiche/cliente_list.html')

    def test_cliente_create_permissions(self):
        url = reverse('anagrafiche:cliente-create')
        
        # Test creazione cliente come tecnico (non permesso)
        self.client.login(username='tecnico', password='tech123')
        response = self.client.post(url, {
            'nome': 'Test',
            'cognome': 'User',
            'codice_cliente': 'CLI002',
            'indirizzo': 'Via Test 2',
            'citta': 'Milano',
            'cap': '20100',
            'provincia': 'MI'
        })
        self.assertEqual(response.status_code, 403)  # Forbidden
        
        # Test creazione cliente come admin (permesso)
        self.client.login(username='admin', password='admin123')
        response = self.client.post(url, {
            'nome': 'Test',
            'cognome': 'User',
            'codice_cliente': 'CLI002',
            'indirizzo': 'Via Test 2',
            'citta': 'Milano',
            'cap': '20100',
            'provincia': 'MI'
        })
        self.assertEqual(response.status_code, 302)  # Redirect dopo successo