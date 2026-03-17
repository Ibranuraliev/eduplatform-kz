from django.urls import path
from .views import (
    ConversationListView, StartConversationView,
    ConversationMessagesView, UnreadCountView,
    TeacherStudentsView,
)

urlpatterns = [
    path('', ConversationListView.as_view(), name='conversation-list'),
    path('start/', StartConversationView.as_view(), name='start-conversation'),
    path('unread/', UnreadCountView.as_view(), name='unread-count'),
    path('students/', TeacherStudentsView.as_view(), name='teacher-students'),
    path('<int:pk>/messages/', ConversationMessagesView.as_view(), name='conversation-messages'),
]
