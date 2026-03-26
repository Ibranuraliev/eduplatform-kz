from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.utils import timezone

from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer
from users.models import User


class ConversationListView(APIView):
    """GET /api/chat/ — list all conversations for the current user"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role == 'student':
            convs = Conversation.objects.filter(student=user).select_related('student', 'teacher')
        elif user.role == 'teacher':
            convs = Conversation.objects.filter(teacher=user).select_related('student', 'teacher')
        else:
            convs = Conversation.objects.none()

        return Response(ConversationSerializer(convs, many=True, context={'request': request}).data)


class StartConversationView(APIView):
    """POST /api/chat/start/ — student OR teacher opens a conversation.
       Student sends: { teacher_id: <int> }
       Teacher sends: { student_id: <int> }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        if user.role == 'student':
            teacher_id = request.data.get('teacher_id')
            if not teacher_id:
                return Response({'error': 'teacher_id required'}, status=status.HTTP_400_BAD_REQUEST)
            try:
                teacher = User.objects.get(pk=teacher_id, role='teacher')
            except User.DoesNotExist:
                return Response({'error': 'Teacher not found'}, status=status.HTTP_404_NOT_FOUND)
            conv, created = Conversation.objects.get_or_create(student=user, teacher=teacher)

        elif user.role == 'teacher':
            student_id = request.data.get('student_id')
            if not student_id:
                return Response({'error': 'student_id required'}, status=status.HTTP_400_BAD_REQUEST)
            try:
                student = User.objects.get(pk=student_id, role='student')
            except User.DoesNotExist:
                return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
            conv, created = Conversation.objects.get_or_create(student=student, teacher=user)

        else:
            return Response({'error': 'Students and teachers only'}, status=status.HTTP_403_FORBIDDEN)

        return Response({
            'conversation_id': conv.id,
            'created': created,
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class ConversationMessagesView(APIView):
    """GET / POST /api/chat/<pk>/messages/"""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        conv = get_object_or_404(Conversation, pk=pk)
        user = request.user
        if user not in [conv.student, conv.teacher]:
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

        # Mark incoming messages as read
        conv.messages.filter(is_read=False).exclude(sender=user).update(is_read=True)

        messages = conv.messages.all()
        return Response(MessageSerializer(messages, many=True).data)

    def post(self, request, pk):
        conv = get_object_or_404(Conversation, pk=pk)
        user = request.user
        if user not in [conv.student, conv.teacher]:
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

        text = request.data.get('text', '').strip()
        if not text:
            return Response({'error': 'Message text required'}, status=status.HTTP_400_BAD_REQUEST)

        msg = Message.objects.create(conversation=conv, sender=user, text=text)

        # Bump conversation updated_at so it sorts to top
        Conversation.objects.filter(pk=conv.pk).update(updated_at=timezone.now())

        return Response(MessageSerializer(msg).data, status=status.HTTP_201_CREATED)


class TeacherStudentsView(APIView):
    """GET /api/chat/students/ — teacher gets deduplicated list of their enrolled students"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'teacher':
            return Response({'error': 'Teachers only'}, status=status.HTTP_403_FORBIDDEN)

        from groups.models import Group, GroupEnrollment

        groups = Group.objects.filter(teacher=request.user, is_active=True)
        enrollments = GroupEnrollment.objects.filter(
            group__in=groups, status='active'
        ).select_related('student', 'group').order_by('student__first_name')

        seen = set()
        students = []
        for enr in enrollments:
            if enr.student_id not in seen:
                seen.add(enr.student_id)
                students.append({
                    'id':         enr.student.id,
                    'first_name': enr.student.first_name,
                    'last_name':  enr.student.last_name,
                    'group_name': enr.group.name,
                })

        return Response(students)


class UnreadCountView(APIView):
    """GET /api/chat/unread/ — total unread messages for the current user"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role == 'student':
            count = Message.objects.filter(
                conversation__student=user, is_read=False
            ).exclude(sender=user).count()
        elif user.role == 'teacher':
            count = Message.objects.filter(
                conversation__teacher=user, is_read=False
            ).exclude(sender=user).count()
        else:
            count = 0
        return Response({'unread': count})
