from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import Test, TestAttempt, TestAttemptAnswer, TestAnswer
from .serializers import TestSerializer, TestAttemptSerializer, SubmitTestSerializer


class TestDetailView(generics.RetrieveAPIView):
    """GET /api/tests/<id>/ — get test questions"""
    queryset = Test.objects.all()
    serializer_class = TestSerializer
    permission_classes = [IsAuthenticated]


class StartTestView(APIView):
    """POST /api/tests/<id>/start/ — student starts a test attempt"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            test = Test.objects.get(pk=pk)
        except Test.DoesNotExist:
            return Response(
                {'error': 'Test not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        student = request.user

        # Check if already attempted
        if TestAttempt.objects.filter(test=test, student=student).exists():
            return Response(
                {'error': 'You have already attempted this test. Only 1 attempt allowed.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        attempt = TestAttempt.objects.create(
            test=test,
            student=student,
            status='in_progress'
        )

        return Response({
            'message': 'Test started! You have 20 minutes.',
            'attempt_id': attempt.id,
            'started_at': attempt.started_at,
            'time_limit_minutes': test.time_limit_minutes,
            'test': TestSerializer(test).data
        })


class SubmitTestView(APIView):
    """POST /api/tests/attempts/<id>/submit/ — student submits test answers"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            attempt = TestAttempt.objects.get(pk=pk, student=request.user)
        except TestAttempt.DoesNotExist:
            return Response(
                {'error': 'Test attempt not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        if attempt.status != 'in_progress':
            return Response(
                {'error': 'This test has already been submitted'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check time limit
        from datetime import timedelta
        time_limit = timedelta(minutes=attempt.test.time_limit_minutes)
        if timezone.now() > attempt.started_at + time_limit:
            attempt.status = 'overdue'
            attempt.save()
            return Response(
                {'error': 'Time limit exceeded. Test marked as overdue.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        answers_data = request.data.get('answers', [])
        total_points = 0
        earned_points = 0

        # Grade each answer
        for answer_data in answers_data:
            question_id = answer_data.get('question_id')
            selected_answer_ids = answer_data.get('selected_answer_ids', [])

            try:
                question = attempt.test.questions.get(pk=question_id)
                total_points += question.points

                # Get correct answers
                correct_ids = set(
                    question.answers.filter(is_correct=True).values_list('id', flat=True)
                )
                selected_ids = set(selected_answer_ids)

                is_correct = correct_ids == selected_ids

                if is_correct:
                    earned_points += question.points

                # Save student's answer
                attempt_answer = TestAttemptAnswer.objects.create(
                    attempt=attempt,
                    question=question,
                    is_correct=is_correct
                )
                if selected_answer_ids:
                    selected_answers = TestAnswer.objects.filter(id__in=selected_answer_ids)
                    attempt_answer.selected_answers.set(selected_answers)

            except Exception:
                continue

        # Calculate score as percentage
        score = (earned_points / total_points * 100) if total_points > 0 else 0

        attempt.score = round(score, 2)
        attempt.status = 'completed'
        attempt.completed_at = timezone.now()
        attempt.save()

        return Response({
            'message': 'Test submitted successfully ✅',
            'score': attempt.score,
            'earned_points': earned_points,
            'total_points': total_points,
            'status': 'completed'
        })


class MyTestAttemptsView(generics.ListAPIView):
    """GET /api/tests/attempts/ — student's test history"""
    serializer_class = TestAttemptSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return TestAttempt.objects.filter(
            student=self.request.user
        ).order_by('-started_at')