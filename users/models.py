from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = [
        ('student', 'Student'),
        ('teacher', 'Teacher'),
        ('hr', 'HR'),
        ('finance', 'Finance Manager'),
        ('admin', 'Admin'),
    ]

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')
    phone = models.CharField(max_length=20, unique=True)
    city = models.CharField(max_length=100, blank=True)
    telegram_user_id = models.CharField(max_length=100, unique=True, null=True, blank=True)
    telegram_phone = models.CharField(max_length=20, blank=True)
    grade = models.CharField(max_length=20, blank=True)       # school grade/class
    goal = models.CharField(max_length=100, blank=True)       # ENT / IELTS
    school = models.CharField(max_length=200, blank=True)
    consent_personal_data = models.BooleanField(default=False)
    consent_privacy_policy = models.BooleanField(default=False)
    is_email_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Referral
    referral_code = models.CharField(max_length=20, unique=True, null=True, blank=True)
    referred_by = models.ForeignKey(
        'self', null=True, blank=True, on_delete=models.SET_NULL, related_name='referrals'
    )

    USERNAME_FIELD = 'phone'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    def __str__(self):
        return f"{self.get_full_name()} ({self.role})"

    def is_student(self):
        return self.role == 'student'

    def is_teacher(self):
        return self.role == 'teacher'

    def is_admin(self):
        return self.role == 'admin'

    def is_hr(self):
        return self.role == 'hr'

    def is_finance(self):
        return self.role == 'finance'


class PhoneChangeLog(models.Model):
    """Tracks phone number changes for security audit"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='phone_changes')
    old_phone = models.CharField(max_length=20)
    new_phone = models.CharField(max_length=20)
    changed_at = models.DateTimeField(auto_now_add=True)
    changed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name='phone_changes_made'
    )

    def __str__(self):
        return f"{self.user} | {self.old_phone} → {self.new_phone}"


class TelegramAuthNonce(models.Model):
    """Temporary nonce for Telegram login (expires in 5 minutes)"""
    phone = models.CharField(max_length=20)
    nonce = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    def __str__(self):
        return f"Nonce for {self.phone}"

class EmailVerificationCode(models.Model):
    """6-digit code sent to email for verification"""
    user  = models.ForeignKey(User, on_delete=models.CASCADE, related_name='email_codes')
    code  = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    def is_expired(self):
        from django.utils import timezone
        from datetime import timedelta
        return timezone.now() > self.created_at + timedelta(minutes=10)

    def __str__(self):
        return f"{self.user} | {self.code}"


class TokenExpiry(models.Model):
    """Associates a 24-hour expiry with a DRF auth token"""
    token = models.OneToOneField('authtoken.Token', on_delete=models.CASCADE, related_name='expiry')
    expires_at = models.DateTimeField()

    def __str__(self):
        return f"Expiry for {self.token.user}"


class RefreshToken(models.Model):
    """Long-lived refresh token (30 days) used to issue new access tokens"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='refresh_token_obj')
    token = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def is_valid(self):
        from django.utils import timezone
        return timezone.now() < self.expires_at

    @classmethod
    def generate(cls, user):
        import secrets
        from django.utils import timezone
        from datetime import timedelta
        token_str = secrets.token_urlsafe(48)
        expires = timezone.now() + timedelta(days=30)
        obj, _ = cls.objects.update_or_create(
            user=user,
            defaults={'token': token_str, 'expires_at': expires}
        )
        return obj

    def __str__(self):
        return f"RefreshToken for {self.user}"