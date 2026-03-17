from rest_framework import serializers
from .models import Order, Payment, RefundRequest, DiscountBalance, Referral
from courses.serializers import CourseListSerializer, PackageSerializer


class OrderSerializer(serializers.ModelSerializer):
    course = CourseListSerializer(read_only=True)
    package = PackageSerializer(read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'student', 'course', 'package',
            'amount', 'discount_applied', 'final_amount',
            'status', 'created_at'
        ]
        read_only_fields = ['student', 'status', 'created_at']


class CreateOrderSerializer(serializers.Serializer):
    """Used when student clicks Buy"""
    course_id = serializers.IntegerField(required=False)
    package_id = serializers.IntegerField(required=False)
    referral_code = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        if not data.get('course_id') and not data.get('package_id'):
            raise serializers.ValidationError(
                'You must provide either course_id or package_id'
            )
        if data.get('course_id') and data.get('package_id'):
            raise serializers.ValidationError(
                'Provide either course_id or package_id, not both'
            )
        return data


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            'id', 'order', 'amount', 'status',
            'kaspi_transaction_id', 'paid_at', 'created_at'
        ]
        read_only_fields = ['created_at']


class RefundRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = RefundRequest
        fields = [
            'id', 'student', 'order', 'reason',
            'payment_details', 'statement_file',
            'status', 'refund_amount', 'created_at'
        ]
        read_only_fields = ['student', 'status', 'refund_amount', 'created_at']


class DiscountBalanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = DiscountBalance
        fields = ['student', 'balance_percent', 'valid_until', 'updated_at']


class ReferralSerializer(serializers.ModelSerializer):
    class Meta:
        model = Referral
        fields = ['id', 'referrer', 'referred', 'discount_earned', 'created_at']