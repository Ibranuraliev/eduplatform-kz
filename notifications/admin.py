from django.contrib import admin
from .models import Notification, AuditLog


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('recipient', 'notification_type', 'title', 'is_read', 'created_at')
    list_filter = ('notification_type', 'is_read')
    search_fields = ('recipient__phone', 'title')
    ordering = ('-created_at',)


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('performed_by', 'action', 'target_user', 'ip_address', 'created_at')
    list_filter = ('action',)
    search_fields = ('performed_by__phone', 'description')
    ordering = ('-created_at',)
    readonly_fields = ('created_at',)
