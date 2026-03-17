from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import Notification


class NotificationListView(APIView):
    """GET /api/notifications/ — get all notifications for current user"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifs = Notification.objects.filter(recipient=request.user)[:50]
        data = [{
            'id': n.id,
            'notification_type': n.notification_type,
            'title': n.title,
            'message': n.message,
            'is_read': n.is_read,
            'created_at': n.created_at.isoformat(),
        } for n in notifs]
        return Response(data)


class MarkNotificationReadView(APIView):
    """PATCH /api/notifications/<id>/read/ — mark one as read"""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            notif = Notification.objects.get(pk=pk, recipient=request.user)
        except Notification.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
        notif.is_read = True
        notif.read_at = timezone.now()
        notif.save()
        return Response({'message': 'Marked as read'})


class MarkAllReadView(APIView):
    """POST /api/notifications/mark-all-read/ — mark all as read"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Notification.objects.filter(
            recipient=request.user, is_read=False
        ).update(is_read=True, read_at=timezone.now())
        return Response({'message': 'All notifications marked as read'})