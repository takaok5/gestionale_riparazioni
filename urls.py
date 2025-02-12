from django.urls import path
from .views import (
    LoginView,
    logout_view,
    RegisterView,
    delete_user,
    home_view,
    PasswordResetView
)

urlpatterns = [
    path('', home_view, name='home'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', logout_view, name='logout'),
    path('register/', RegisterView.as_view(), name='register'),  # opzionale
    path('delete-user/<int:user_id>/', delete_user, name='delete_user'),
    path('password-reset/', PasswordResetView.as_view(), name='password_reset'),
]