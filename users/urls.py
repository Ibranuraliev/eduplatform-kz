from django.urls import path
from .views import (
    RegisterView, LoginView, LogoutView,
    ProfileView, TelegramNonceView, TelegramVerifyView,
    CSRFTokenView, ChangePasswordView,
    SendVerificationEmailView, VerifyEmailView,
    TokenRefreshView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('telegram/nonce/', TelegramNonceView.as_view(), name='telegram-nonce'),
    path('telegram/verify/', TelegramVerifyView.as_view(), name='telegram-verify'),
    path('csrf/', CSRFTokenView.as_view(), name='csrf-token'),
    path('send-verification-email/', SendVerificationEmailView.as_view(), name='send-verification-email'),
    path('verify-email/', VerifyEmailView.as_view(), name='verify-email'),
]