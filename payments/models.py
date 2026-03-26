from django.db import models
from users.models import User
from courses.models import Course, Package


class Order(models.Model):
    """Created when student wants to buy a course or package"""
    STATUS_CHOICES = [
        ('created', 'Created'),
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]

    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    course = models.ForeignKey(
        Course, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders'
    )
    package = models.ForeignKey(
        Package, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders'
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)  # in KZT
    discount_applied = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    final_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Order #{self.id} | {self.student} | {self.final_amount} KZT | {self.status}"


class Payment(models.Model):
    """Actual payment transaction via Kaspi Pay"""
    STATUS_CHOICES = [
        ('created', 'Created'),
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]

    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='payment')
    kaspi_transaction_id = models.CharField(max_length=200, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='created')
    kaspi_response = models.JSONField(blank=True, null=True)  # raw response from Kaspi
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Payment #{self.id} | Order #{self.order.id} | {self.status}"


class RefundRequest(models.Model):
    """Student requests a refund"""
    STATUS_CHOICES = [
        ('created', 'Created'),
        ('in_review', 'In Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('refunded', 'Refunded'),
    ]

    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='refund_requests')
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='refund_requests')
    reason = models.TextField()
    payment_details = models.TextField()       # student's bank details for refund
    statement_file = models.FileField(upload_to='refund_statements/')  # signed statement
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='created')
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    # Finance manager actions
    reviewed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_refunds'
    )
    finance_note = models.TextField(blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    refunded_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Refund #{self.id} | {self.student} | {self.status}"

    def calculate_refund_amount(self):
        """
        Refund = amount paid - cost of conducted live sessions
        This is called when finance manager approves the refund
        """
        from groups.models import GroupEnrollment, GroupSession
        from decimal import Decimal

        # Find student's group for this course
        enrollment = GroupEnrollment.objects.filter(
            student=self.student,
            group__course=self.order.course,
            status='active'
        ).first()

        if not enrollment:
            return self.order.final_amount

        # Count conducted sessions
        conducted_sessions = GroupSession.objects.filter(
            group=enrollment.group,
            is_conducted=True
        ).count()

        total_sessions = GroupSession.objects.filter(
            group=enrollment.group
        ).count()

        if total_sessions == 0:
            return self.order.final_amount

        # Cost per session
        cost_per_session = self.order.final_amount / Decimal(total_sessions)
        deduction = cost_per_session * Decimal(conducted_sessions)
        refund = self.order.final_amount - deduction

        return max(refund, Decimal('0'))


class DiscountBalance(models.Model):
    """Referral discount balance for a student"""
    student = models.OneToOneField(User, on_delete=models.CASCADE, related_name='discount_balance')
    balance_percent = models.PositiveIntegerField(default=0)  # max 100%
    valid_until = models.DateField(null=True, blank=True)     # expires end of next month
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.student} | {self.balance_percent}% discount"


class Referral(models.Model):
    """Tracks successful referrals"""
    referrer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='referrals_made')
    referred = models.ForeignKey(User, on_delete=models.CASCADE, related_name='referred_by_record')
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='referral')
    discount_earned = models.PositiveIntegerField(default=10)  # 10% per referral
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.referrer} referred {self.referred} | +{self.discount_earned}%"
    