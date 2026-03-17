from django.urls import path
from .views import (
    TestDetailView, StartTestView,
    SubmitTestView, MyTestAttemptsView
)

urlpatterns = [
    path('<int:pk>/', TestDetailView.as_view(), name='test-detail'),
    path('<int:pk>/start/', StartTestView.as_view(), name='start-test'),
    path('attempts/<int:pk>/submit/', SubmitTestView.as_view(), name='submit-test'),
    path('attempts/', MyTestAttemptsView.as_view(), name='test-attempts'),
]