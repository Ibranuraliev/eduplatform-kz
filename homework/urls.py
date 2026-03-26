from django.urls import path
from .views import (
    MyHomeworkView, SubmitHomeworkView, ReviewHomeworkView,
    BulkReviewHomeworkView, PendingHomeworkView, CommentTemplateView
)

urlpatterns = [
    path('', MyHomeworkView.as_view(), name='my-homework'),
    path('<int:pk>/submit/', SubmitHomeworkView.as_view(), name='submit-homework'),
    path('review/', ReviewHomeworkView.as_view(), name='review-homework'),
    path('bulk-review/', BulkReviewHomeworkView.as_view(), name='bulk-review'),
    path('pending/', PendingHomeworkView.as_view(), name='pending-homework'),
    path('templates/', CommentTemplateView.as_view(), name='comment-templates'),
]