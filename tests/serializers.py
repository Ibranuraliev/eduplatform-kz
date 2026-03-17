from rest_framework import serializers
from .models import Test, TestQuestion, TestAnswer, TestAttempt, TestAttemptAnswer


class TestAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestAnswer
        fields = ['id', 'answer_text']
        # Note: we never send is_correct to students!


class TestQuestionSerializer(serializers.ModelSerializer):
    answers = TestAnswerSerializer(many=True, read_only=True)

    class Meta:
        model = TestQuestion
        fields = ['id', 'question_text', 'question_type', 'order', 'points', 'answers']


class TestSerializer(serializers.ModelSerializer):
    questions = TestQuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Test
        fields = ['id', 'lesson', 'title', 'time_limit_minutes', 'questions']


class TestAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestAttempt
        fields = [
            'id', 'test', 'student', 'status',
            'score', 'started_at', 'completed_at'
        ]
        read_only_fields = ['student', 'status', 'score', 'started_at', 'completed_at']


class SubmitTestSerializer(serializers.Serializer):
    """Used when student submits test answers"""
    answers = serializers.ListField(
        child=serializers.DictField()
    )