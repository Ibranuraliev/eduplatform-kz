from django.contrib import admin
from .models import Order, Payment, RefundRequest, DiscountBalance, Referral


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'student', 'course', 'package', 'final_amount', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('student__phone', 'student__first_name')
    ordering = ('-created_at',)


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('id', 'order', 'amount', 'status', 'kaspi_transaction_id', 'paid_at')
    list_filter = ('status',)
    ordering = ('-created_at',)


@admin.register(RefundRequest)
class RefundRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'student', 'order', 'status', 'refund_amount', 'created_at')
    list_filter = ('status',)
    search_fields = ('student__phone', 'student__first_name')
    ordering = ('-created_at',)


@admin.register(DiscountBalance)
class DiscountBalanceAdmin(admin.ModelAdmin):
    list_display = ('student', 'balance_percent', 'valid_until', 'updated_at')
    search_fields = ('student__phone',)


@admin.register(Referral)
class ReferralAdmin(admin.ModelAdmin):
    list_display = ('referrer', 'referred', 'order', 'discount_earned', 'created_at')
    ordering = ('-created_at',)