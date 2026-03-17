from rest_framework import serializers
from .models import Homework, HomeworkSubmission, CommentTemplate


class HomeworkSerializer(serializers.ModelSerializer):
    class Meta:
        model = Homework
        fields = [
            'id', 'lesson', 'title', 'description',
            'homework_type', 'deadline_session', 'created_at'
        ]


class HomeworkSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = HomeworkSubmission
        fields = [
            'id', 'homework', 'student', 'status',
            'text_answer', 'file', 'submitted_at',
            'teacher_comment', 'reviewed_at'
        ]
        read_only_fields = [
            'student', 'status', 'submitted_at',
            'teacher_comment', 'reviewed_at'
        ]


class ReviewHomeworkSerializer(serializers.Serializer):
    """Used by teacher to review homework"""
    submission_id = serializers.IntegerField()
    status = serializers.ChoiceField(choices=['accepted', 'revision_required'])
    comment = serializers.CharField(required=False, allow_blank=True)


class CommentTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommentTemplate
        fields = ['id', 'teacher', 'title', 'content', 'created_at']
        read_only_fields = ['teacher', 'created_at']