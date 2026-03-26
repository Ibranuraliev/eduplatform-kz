from django.db import models
from users.models import User


class Notification(models.Model):
    """In-platform notifications for users"""
    TYPE_CHOICES = [
        ('homework_due', 'Homework Due'),
        ('test_due', 'Test Due'),
        ('session_starting', 'Session Starting Soon'),
        ('homework_reviewed', 'Homework Reviewed'),
        ('group_change_approved', 'Group Change Approved'),
        ('group_change_rejected', 'Group Change Rejected'),
        ('refund_update', 'Refund Status Update'),
        ('payment_confirmed', 'Payment Confirmed'),
        ('general', 'General'),
    ]

    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=50, choices=TYPE_CHOICES, default='general')
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']   # newest first

    def __str__(self):
        return f"{self.recipient} | {self.title} | read={self.is_read}"


class AuditLog(models.Model):
    """Security audit log — tracks important admin actions"""
    ACTION_CHOICES = [
        ('phone_change', 'Phone Number Changed'),
        ('role_change', 'Role Changed'),
        ('payment_created', 'Payment Created'),
        ('refund_processed', 'Refund Processed'),
        ('group_change_approved', 'Group Change Approved'),
        ('teacher_approved', 'Teacher Approved'),
        ('user_blocked', 'User Blocked'),
        ('admin_action', 'Admin Action'),
    ]

    performed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name='audit_logs'
    )
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    target_user = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='audit_logs_about'
    )
    description = models.TextField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.performed_by} | {self.action} | {self.created_at}"
