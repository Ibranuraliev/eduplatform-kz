from django.urls import path
from .views import (
    AdminStatsView, AdminUsersView, AdminGroupsView,
    AdminPaymentsView, AdminRefundsView, AdminHRApplicationsView,
    AdminGroupChangeRequestsView, AdminGroupChangeActionView,
)

urlpatterns = [
    path('stats/',                          AdminStatsView.as_view(),              name='admin-stats'),
    path('users/',                          AdminUsersView.as_view(),              name='admin-users'),
    path('groups/',                         AdminGroupsView.as_view(),             name='admin-groups'),
    path('payments/',                       AdminPaymentsView.as_view(),           name='admin-payments'),
    path('refunds/',                        AdminRefundsView.as_view(),            name='admin-refunds'),
    path('hr-applications/',               AdminHRApplicationsView.as_view(),     name='admin-hr-apps'),
    path('group-change-requests/',         AdminGroupChangeRequestsView.as_view(),name='admin-gc-list'),
    path('group-change-requests/<int:pk>/<str:action>/', AdminGroupChangeActionView.as_view(), name='admin-gc-action'),
]