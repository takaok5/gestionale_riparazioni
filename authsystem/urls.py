from django.urls import path
from django.contrib.auth import views as auth_views
from . import views

urlpatterns = [
    # Registrazione personalizzata
    path('register/', views.register_view, name='register'),
    
    # Login / Logout personalizzati
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),

    # Password reset
    path('password_reset/', views.MyPasswordResetView.as_view(), name='password_reset'),
    path('password_reset/done/',
         auth_views.PasswordResetDoneView.as_view(template_name='authsystem/password_reset_done.html'),
         name='password_reset_done'),
    path('reset/<uidb64>/<token>/',
         auth_views.PasswordResetConfirmView.as_view(template_name='authsystem/password_reset_confirm.html'),
         name='password_reset_confirm'),
    path('reset/done/',
         auth_views.PasswordResetCompleteView.as_view(template_name='authsystem/password_reset_complete.html'),
         name='password_reset_complete'),
]
