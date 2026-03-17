from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, PhoneChangeLog, TelegramAuthNonce


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('phone', 'get_full_name', 'role', 'city', 'is_active', 'created_at')
    list_filter = ('role', 'city', 'is_active')
    search_fields = ('phone', 'first_name', 'last_name', 'telegram_user_id')
    ordering = ('-created_at',)
    fieldsets = UserAdmin.fieldsets + (
        ('Extra Info', {
            'fields': ('role', 'phone', 'city', 'telegram_user_id', 'grade', 'goal', 'school',
                       'consent_personal_data', 'consent_privacy_policy',
                       'referral_code', 'referred_by')
        }),
    )


@admin.register(PhoneChangeLog)
class PhoneChangeLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'old_phone', 'new_phone', 'changed_at', 'changed_by')
    readonly_fields = ('changed_at',)


@admin.register(TelegramAuthNonce)
class TelegramAuthNonceAdmin(admin.ModelAdmin):
    list_display = ('phone', 'nonce', 'created_at', 'is_used')
    readonly_fields = ('created_at',)