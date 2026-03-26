from rest_framework import serializers
from .models import Group, GroupEnrollment, GroupSession, Attendance, GroupChangeRequest, WaitlistEntry
from users.models import User
from django.utils import timezone


class GroupSessionSerializer(serializers.ModelSerializer):
    meet_link = serializers.SerializerMethodField()

    class Meta:
        model = GroupSession
        fields = [
            'id', 'group', 'lesson', 'scheduled_at', 'duration_minutes',
            'status', 'meet_link', 'is_conducted', 'access_extended'
        ]

    def get_meet_link(self, obj):
        """Only show meet link during session window"""
        now = timezone.now()
        user = self.context.get('request').user if self.context.get('request') else None

        # Teachers always see their own link
        if user and user.is_teacher():
            return obj.meet_link

        # Students see link only during session window
        if now >= obj.get_link_visible_at() and now <= obj.get_link_hidden_at():
            return obj.meet_link

        return None  # hide link outside window


class GroupSerializer(serializers.ModelSerializer):
    student_count = serializers.SerializerMethodField()
    is_full = serializers.SerializerMethodField()
    teacher_name = serializers.SerializerMethodField()

    class Meta:
        model = Group
        fields = [
            'id', 'name', 'course', 'teacher', 'teacher_name',
            'max_students', 'student_count', 'is_full', 'is_active'
        ]

    def get_student_count(self, obj):
        return obj.current_student_count()

    def get_is_full(self, obj):
        return obj.is_full()

    def get_teacher_name(self, obj):
        if obj.teacher:
            return obj.teacher.get_full_name()
        return None


class GroupEnrollmentSerializer(serializers.ModelSerializer):
    group = GroupSerializer(read_only=True)

    class Meta:
        model = GroupEnrollment
        fields = ['id', 'group', 'status', 'is_trial', 'joined_at']


class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = ['id', 'session', 'student', 'status', 'marked_at']
        read_only_fields = ['marked_at']


class GroupChangeRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = GroupChangeRequest
        fields = [
            'id', 'student', 'current_group', 'requested_group',
            'reason', 'status', 'created_at'
        ]
        read_only_fields = ['student', 'status', 'created_at']


class WaitlistSerializer(serializers.ModelSerializer):
    class Meta:
        model = WaitlistEntry
        fields = ['id', 'student', 'group', 'created_at']
        read_only_fields = ['student', 'created_at']