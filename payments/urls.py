from django.urls import path
from .views import (
    CreateOrderView, KaspiWebhookView, MyOrdersView,
    CreateRefundView, MyRefundsView, MyDiscountView,
    AllRefundsView, ReviewRefundView, MarkOrderPaidView,
)

urlpatterns = [
    path('order/', CreateOrderView.as_view(), name='create-order'),
    path('kaspi/webhook/', KaspiWebhookView.as_view(), name='kaspi-webhook'),
    path('orders/', MyOrdersView.as_view(), name='my-orders'),
    path('orders/<int:pk>/mark-paid/', MarkOrderPaidView.as_view(), name='mark-order-paid'),
    path('refund/', CreateRefundView.as_view(), name='create-refund'),
    path('refunds/', MyRefundsView.as_view(), name='my-refunds'),
    path('refunds/all/', AllRefundsView.as_view(), name='all-refunds'),
    path('refunds/review/', ReviewRefundView.as_view(), name='review-refund'),
    path('discount/', MyDiscountView.as_view(), name='my-discount'),
]