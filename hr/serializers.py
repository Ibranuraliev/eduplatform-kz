from rest_framework import serializers
from .models import TeacherApplication, TeacherProfile, TeacherLatenessRecord


class TeacherApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeacherApplication
        fields = [
            'id', 'full_name', 'phone', 'experience_years',
            'subjects', 'resume', 'diploma', 'status', 'created_at'
        ]
        read_only_fields = ['status', 'created_at']


class ReviewApplicationSerializer(serializers.Serializer):
    """Used by HR to approve or reject teacher application"""
    application_id = serializers.IntegerField()
    status = serializers.ChoiceField(choices=['new', 'in_review', 'approved', 'rejected'])
    note = serializers.CharField(required=False, allow_blank=True)


class TeacherProfileSerializer(serializers.ModelSerializer):
    teacher_name = serializers.SerializerMethodField()

    class Meta:
        model = TeacherProfile
        fields = [
            'id', 'teacher', 'teacher_name', 'meet_link',
            'subjects', 'experience_years', 'bio', 'is_active'
        ]
        read_only_fields = ['teacher']

    def get_teacher_name(self, obj):
        return obj.teacher.get_full_name()


class TeacherLatenessSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeacherLatenessRecord
        fields = ['id', 'teacher', 'session', 'minutes_late', 'note', 'recorded_at']
        read_only_fields = ['recorded_at']