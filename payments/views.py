from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from decimal import Decimal
from .models import Order, Payment, RefundRequest, DiscountBalance, Referral
from .serializers import (
    OrderSerializer, CreateOrderSerializer,
    PaymentSerializer, RefundRequestSerializer, DiscountBalanceSerializer
)
from courses.models import Course, Package, CourseEnrollment
from users.models import User


class CreateOrderView(APIView):
    """POST /api/payments/order/ — student creates an order to buy a course"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CreateOrderSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        student = request.user
        data = serializer.validated_data
        course = None
        package = None
        base_price = Decimal('0')

        # Get course or package
        if data.get('course_id'):
            try:
                course = Course.objects.get(pk=data['course_id'], is_active=True)
                base_price = course.price

                # Check not already enrolled
                if CourseEnrollment.objects.filter(student=student, course=course, is_active=True).exists():
                    return Response(
                        {'error': 'You are already enrolled in this course'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except Course.DoesNotExist:
                return Response({'error': 'Course not found'}, status=status.HTTP_404_NOT_FOUND)

        elif data.get('package_id'):
            try:
                package = Package.objects.get(pk=data['package_id'], is_active=True)
                base_price = package.price
            except Package.DoesNotExist:
                return Response({'error': 'Package not found'}, status=status.HTTP_404_NOT_FOUND)

        # Apply referral discount if any
        discount = Decimal('0')
        try:
            discount_balance = DiscountBalance.objects.get(student=student)
            if (discount_balance.balance_percent > 0 and
                    discount_balance.valid_until and
                    discount_balance.valid_until >= timezone.now().date()):
                discount_percent = Decimal(discount_balance.balance_percent) / Decimal('100')
                discount = base_price * discount_percent
                # Reset balance after use
                discount_balance.balance_percent = 0
                discount_balance.save()
        except DiscountBalance.DoesNotExist:
            pass

        final_amount = max(base_price - discount, Decimal('0'))

        # Create order
        order = Order.objects.create(
            student=student,
            course=course,
            package=package,
            amount=base_price,
            discount_applied=discount,
            final_amount=final_amount,
            status='created'
        )

        return Response({
            'message': 'Order created successfully',
            'order_id': order.id,
            'amount': str(base_price),
            'discount': str(discount),
            'final_amount': str(final_amount),
            'next_step': 'Proceed to Kaspi Pay payment'
        }, status=status.HTTP_201_CREATED)


class KaspiWebhookView(APIView):
    """POST /api/payments/kaspi/webhook/ — Kaspi Pay sends payment status here"""
    permission_classes = []  # public endpoint for Kaspi

    def post(self, request):
        transaction_id = request.data.get('transaction_id')
        order_id = request.data.get('order_id')
        payment_status = request.data.get('status')
        amount = request.data.get('amount')

        if not all([transaction_id, order_id, payment_status]):
            return Response({'error': 'Invalid webhook data'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            order = Order.objects.get(pk=order_id)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

        # Update or create payment record
        payment, created = Payment.objects.update_or_create(
            order=order,
            defaults={
                'kaspi_transaction_id': transaction_id,
                'amount': amount,
                'status': payment_status,
                'kaspi_response': request.data,
                'paid_at': timezone.now() if payment_status == 'paid' else None
            }
        )

        # If paid → grant course access
        if payment_status == 'paid':
            order.status = 'paid'
            order.save()
            self._grant_access(order)
            self._handle_referral(order)

        elif payment_status == 'failed':
            order.status = 'failed'
            order.save()
            # Restore discount balance if it was consumed but payment failed
            if order.discount_applied > 0 and order.amount > 0:
                from datetime import date, timedelta
                balance, _ = DiscountBalance.objects.get_or_create(
                    student=order.student,
                    defaults={'balance_percent': 0}
                )
                if balance.balance_percent == 0:
                    restored_percent = int((order.discount_applied / order.amount) * 100)
                    balance.balance_percent = restored_percent
                    balance.valid_until = date.today() + timedelta(days=30)
                    balance.save()

        return Response({'message': 'Webhook received'})

    def _grant_access(self, order):
        """Give student access to course after payment"""
        student = order.student
        if order.course:
            CourseEnrollment.objects.get_or_create(
                student=student,
                course=order.course,
                defaults={'is_active': True}
            )
        elif order.package:
            for course in order.package.courses.all():
                CourseEnrollment.objects.get_or_create(
                    student=student,
                    course=course,
                    defaults={'is_active': True}
                )

    def _handle_referral(self, order):
        """Give referrer 10% discount when referred friend pays"""
        student = order.student
        if student.referred_by:
            referrer = student.referred_by

            # Create referral record
            Referral.objects.get_or_create(
                referrer=referrer,
                referred=student,
                order=order,
                defaults={'discount_earned': 10}
            )

            # Add 10% to referrer's discount balance (max 100%)
            balance, created = DiscountBalance.objects.get_or_create(
                student=referrer,
                defaults={'balance_percent': 0}
            )
            balance.balance_percent = min(balance.balance_percent + 10, 100)

            # Valid until end of next calendar month
            from datetime import date
            import calendar
            today = date.today()
            if today.month == 12:
                next_month = date(today.year + 1, 1, 1)
            else:
                next_month = date(today.year, today.month + 1, 1)
            last_day = calendar.monthrange(next_month.year, next_month.month)[1]
            balance.valid_until = date(next_month.year, next_month.month, last_day)
            balance.save()


class MyOrdersView(generics.ListAPIView):
    """GET /api/payments/orders/ — student's order history"""
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(student=self.request.user).order_by('-created_at')


class CreateRefundView(APIView):
    """POST /api/payments/refund/ — student submits refund request"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        student = request.user
        order_id = request.data.get('order_id')
        reason = request.data.get('reason')
        payment_details = request.data.get('payment_details')
        statement_file = request.FILES.get('statement_file')

        if not all([order_id, reason, payment_details, statement_file]):
            return Response(
                {'error': 'order_id, reason, payment_details and statement_file are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            order = Order.objects.get(pk=order_id, student=student, status='paid')
        except Order.DoesNotExist:
            return Response(
                {'error': 'Paid order not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check no existing refund request
        if RefundRequest.objects.filter(order=order).exists():
            return Response(
                {'error': 'A refund request already exists for this order'},
                status=status.HTTP_400_BAD_REQUEST
            )

        refund = RefundRequest.objects.create(
            student=student,
            order=order,
            reason=reason,
            payment_details=payment_details,
            statement_file=statement_file
        )

        return Response({
            'message': 'Refund request submitted successfully',
            'refund_id': refund.id,
            'status': 'created'
        }, status=status.HTTP_201_CREATED)


class MyRefundsView(generics.ListAPIView):
    """GET /api/payments/refunds/ — student's refund requests"""
    serializer_class = RefundRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return RefundRequest.objects.filter(student=self.request.user).order_by('-created_at')


class MyDiscountView(APIView):
    """GET /api/payments/discount/ — student's current referral discount balance"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            balance = DiscountBalance.objects.get(student=request.user)
            return Response(DiscountBalanceSerializer(balance).data)
        except DiscountBalance.DoesNotExist:
            return Response({
                'balance_percent': 0,
                'valid_until': None,
                'message': 'No discount balance yet. Refer friends to earn discounts!'
            })

class AllRefundsView(generics.ListAPIView):
    """GET /api/payments/refunds/all/ — finance manager sees all refund requests"""
    serializer_class = RefundRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role not in ('finance', 'hr', 'admin'):
            return RefundRequest.objects.none()
        status_filter = self.request.query_params.get('status')
        qs = RefundRequest.objects.select_related('student', 'order__course').order_by('-created_at')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        data = []
        for r in qs:
            data.append({
                'id': r.id,
                'student_name': r.student.get_full_name(),
                'student_phone': r.student.phone,
                'course_title': r.order.course.title if r.order.course else (r.order.package.title if r.order.package else '—'),
                'reason': r.reason,
                'payment_details': r.payment_details,
                'statement_file': request.build_absolute_uri(r.statement_file.url) if r.statement_file else None,
                'status': r.status,
                'refund_amount': str(r.refund_amount) if r.refund_amount else None,
                'order_amount': str(r.order.final_amount),
                'finance_note': r.finance_note,
                'created_at': r.created_at.isoformat(),
                'reviewed_at': r.reviewed_at.isoformat() if r.reviewed_at else None,
            })
        return Response(data)


class ReviewRefundView(APIView):
    """POST /api/payments/refunds/review/ — finance manager approves or rejects refund"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.role not in ('finance', 'hr', 'admin'):
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

        refund_id = request.data.get('refund_id')
        action = request.data.get('action')  # 'approve', 'reject', 'refunded'
        note = request.data.get('note', '')
        refund_amount = request.data.get('refund_amount')

        if not refund_id or action not in ('approve', 'reject', 'refunded'):
            return Response({'error': 'refund_id and valid action required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            refund = RefundRequest.objects.get(pk=refund_id)
        except RefundRequest.DoesNotExist:
            return Response({'error': 'Refund not found'}, status=status.HTTP_404_NOT_FOUND)

        status_map = {'approve': 'approved', 'reject': 'rejected', 'refunded': 'refunded'}
        refund.status = status_map[action]
        refund.finance_note = note
        refund.reviewed_by = user
        refund.reviewed_at = timezone.now()

        if refund_amount:
            refund.refund_amount = Decimal(str(refund_amount))
        elif action == 'approve' and not refund.refund_amount:
            refund.refund_amount = refund.calculate_refund_amount()

        if action == 'refunded':
            refund.refunded_at = timezone.now()
            # Mark order as refunded
            refund.order.status = 'refunded'
            refund.order.save()

        refund.save()
        return Response({'message': f'Refund {refund.status} successfully', 'refund_id': refund.id})
class MarkOrderPaidView(APIView):
    """POST /api/payments/orders/<id>/mark-paid/"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if not request.user.is_admin():
            return Response({'error': 'Admins only'}, status=403)
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=404)

        order.status = 'paid'
        order.save()

        if order.course:
            CourseEnrollment.objects.get_or_create(
                student=order.student,
                course=order.course,
                defaults={'is_active': True}
            )

        return Response({'message': 'Order marked as paid'})