from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.throttling import AnonRateThrottle
from django.contrib.auth import authenticate, login, logout
from django.utils import timezone
from .models import User, TelegramAuthNonce
from .serializers import RegisterSerializer, UserSerializer
import secrets


class LoginThrottle(AnonRateThrottle):
    scope = 'login'


class RegisterThrottle(AnonRateThrottle):
    scope = 'register'


class RegisterView(generics.CreateAPIView):
    """POST /api/users/register/ — create new student account"""
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    throttle_classes = [RegisterThrottle]


class LoginView(APIView):
    """POST /api/users/login/ — login with phone & password"""
    throttle_classes = [LoginThrottle]
    permission_classes = [AllowAny]

    def post(self, request):
        from rest_framework.authtoken.models import Token
        from .models import TokenExpiry, RefreshToken as RefreshTokenModel
        from datetime import timedelta

        phone = request.data.get('phone')
        password = request.data.get('password')

        if not phone or not password:
            return Response(
                {'error': 'Phone and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = authenticate(request, username=phone, password=password)
        if user:
            login(request, user)
            # Always create a fresh access token
            Token.objects.filter(user=user).delete()
            token = Token.objects.create(user=user)
            # Set 24h expiry
            TokenExpiry.objects.update_or_create(
                token=token,
                defaults={'expires_at': timezone.now() + timedelta(hours=24)}
            )
            # Create / refresh the 30-day refresh token
            refresh = RefreshTokenModel.generate(user)
            return Response({
                'message': 'Login successful',
                'token': token.key,
                'refresh_token': refresh.token,
                'expires_in': 86400,
                'user': UserSerializer(user).data
            })
        return Response(
            {'error': 'Invalid phone or password'},
            status=status.HTTP_401_UNAUTHORIZED
        )


class TokenRefreshView(APIView):
    """POST /api/users/token/refresh/ — swap refresh token for a new access token"""
    permission_classes = [AllowAny]

    def post(self, request):
        from rest_framework.authtoken.models import Token
        from .models import RefreshToken as RefreshTokenModel, TokenExpiry
        from datetime import timedelta

        refresh_str = request.data.get('refresh_token')
        if not refresh_str:
            return Response({'error': 'refresh_token required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            refresh_obj = RefreshTokenModel.objects.select_related('user').get(token=refresh_str)
        except RefreshTokenModel.DoesNotExist:
            return Response({'error': 'Invalid refresh token'}, status=status.HTTP_401_UNAUTHORIZED)

        if not refresh_obj.is_valid():
            return Response(
                {'error': 'Refresh token expired. Please login again.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        user = refresh_obj.user
        # Rotate access token
        Token.objects.filter(user=user).delete()
        new_token = Token.objects.create(user=user)
        TokenExpiry.objects.create(
            token=new_token,
            expires_at=timezone.now() + timedelta(hours=24)
        )

        return Response({
            'token': new_token.key,
            'expires_in': 86400,
        })
    
class LogoutView(APIView):
    """POST /api/users/logout/ — logout"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from rest_framework.authtoken.models import Token
        Token.objects.filter(user=request.user).delete()
        logout(request)
        return Response({'message': 'Logged out successfully'})


class ProfileView(generics.RetrieveUpdateAPIView):
    """GET/PUT /api/users/profile/ — view or update own profile"""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class TelegramNonceView(APIView):
    """POST /api/users/telegram/nonce/ — generate nonce for Telegram login"""
    permission_classes = [AllowAny]

    def post(self, request):
        phone = request.data.get('phone')
        if not phone:
            return Response(
                {'error': 'Phone is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Generate secure nonce
        nonce = secrets.token_urlsafe(32)
        TelegramAuthNonce.objects.create(phone=phone, nonce=nonce)

        return Response({
            'nonce': nonce,
            'message': 'Open Telegram bot and confirm login',
            'expires_in': '5 minutes'
        })


class TelegramVerifyView(APIView):
    """POST /api/users/telegram/verify/ — verify Telegram login"""
    permission_classes = [AllowAny]

    def post(self, request):
        phone = request.data.get('phone')
        nonce = request.data.get('nonce')
        telegram_user_id = request.data.get('telegram_user_id')

        if not all([phone, nonce, telegram_user_id]):
            return Response(
                {'error': 'phone, nonce and telegram_user_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Find valid nonce (not used, not expired)
        from datetime import timedelta
        expiry = timezone.now() - timedelta(minutes=5)

        nonce_obj = TelegramAuthNonce.objects.filter(
            phone=phone,
            nonce=nonce,
            is_used=False,
            created_at__gte=expiry
        ).first()

        if not nonce_obj:
            return Response(
                {'error': 'Invalid or expired nonce'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Mark nonce as used
        nonce_obj.is_used = True
        nonce_obj.save()

        # Link telegram to user
        try:
            user = User.objects.get(phone=phone)
            user.telegram_user_id = telegram_user_id
            user.save()
            login(request, user)
            return Response({
                'message': 'Telegram login successful',
                'user': UserSerializer(user).data
            })
        except User.DoesNotExist:
            return Response(
                {'error': 'No account found with this phone number'},
                status=status.HTTP_404_NOT_FOUND
            )
        
from django.middleware.csrf import get_token

class CSRFTokenView(APIView):
    """GET /api/users/csrf/ — get CSRF token"""
    permission_classes = [AllowAny]

    def get(self, request):
        token = get_token(request)
        return Response({'csrfToken': token})

class ChangePasswordView(APIView):
    """POST /api/users/change-password/ — change own password"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        if not old_password or not new_password:
            return Response(
                {'error': 'old_password and new_password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if len(new_password) < 6:
            return Response(
                {'error': 'New password must be at least 6 characters'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not request.user.check_password(old_password):
            return Response(
                {'error': 'Неверный текущий пароль'},
                status=status.HTTP_400_BAD_REQUEST
            )

        request.user.set_password(new_password)
        request.user.save()

        # Re-issue token so user stays logged in
        from rest_framework.authtoken.models import Token
        Token.objects.filter(user=request.user).delete()
        token = Token.objects.create(user=request.user)

        return Response({
            'message': 'Password changed successfully',
            'token': token.key
        })

import random
from django.core.mail import send_mail
from django.conf import settings
from .models import EmailVerificationCode


class SendVerificationEmailView(APIView):
    """POST /api/users/send-verification-email/"""
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response({'error': 'Email обязателен'}, status=400)

        # Find user by email
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'Пользователь не найден'}, status=404)

        if user.is_email_verified:
            return Response({'message': 'Email уже подтверждён'})

        # Generate 6-digit code
        code = str(random.randint(100000, 999999))

        # Invalidate old codes
        EmailVerificationCode.objects.filter(user=user, is_used=False).update(is_used=True)

        # Save new code
        EmailVerificationCode.objects.create(user=user, code=code)

        # Send email
        try:
            send_mail(
                subject='Код подтверждения — EduPlatform KZ',
                message=f'Твой код подтверждения: {code}\n\nКод действителен 10 минут.',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
        except Exception as e:
            return Response({'error': f'Ошибка отправки: {str(e)}'}, status=500)

        return Response({'message': 'Код отправлен на email'})


class VerifyEmailView(APIView):
    """POST /api/users/verify-email/"""
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        code  = request.data.get('code', '').strip()

        if not email or not code:
            return Response({'error': 'Email и код обязательны'}, status=400)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'Пользователь не найден'}, status=404)

        verification = EmailVerificationCode.objects.filter(
            user=user, code=code, is_used=False
        ).order_by('-created_at').first()

        if not verification:
            return Response({'error': 'Неверный код'}, status=400)

        if verification.is_expired():
            return Response({'error': 'Код истёк. Запроси новый.'}, status=400)

        # Mark verified
        verification.is_used = True
        verification.save()
        user.is_email_verified = True
        user.save()

        return Response({'message': 'Email подтверждён!'})