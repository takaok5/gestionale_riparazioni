from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse

User = get_user_model()

class AuthSystemTest(TestCase):
    def test_user_creation(self):
        user = User.objects.create_user(username='testuser', password='testpass')
        self.assertIsNotNone(user.id)
        self.assertEqual(user.username, 'testuser')

    def test_login_logout(self):
        user = User.objects.create_user(username='testlogin', password='12345')
        login_result = self.client.login(username='testlogin', password='12345')
        self.assertTrue(login_result, "Login fallito.")
        response = self.client.get(reverse('logout'))
        self.assertRedirects(response, reverse('login'))
