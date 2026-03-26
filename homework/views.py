from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import Homework, HomeworkSubmission, CommentTemplate
from .serializers import (
    HomeworkSerializer, HomeworkSubmissionSerializer,
    ReviewHomeworkSerializer, CommentTemplateSerializer
)


class MyHomeworkView(APIView):
    """GET /api/homework/ — student sees all homework with submission status"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from courses.models import CourseEnrollment
        from django.db.models import Q

        student = request.user

        # Get all courses student is enrolled in
        enrolled_courses = CourseEnrollment.objects.filter(
            student=student, is_active=True
        ).values_list('course_id', flat=True)

        # Get all homework for those courses
        all_homework = Homework.objects.filter(
            lesson__module__course__id__in=enrolled_courses
        )

        result = []
        for hw in all_homework:
            # Get submission if exists
            submission = HomeworkSubmission.objects.filter(
                homework=hw, student=student
            ).first()

            result.append({
                'homework_id': hw.id,
                'homework_title': hw.title,
                'homework_type': hw.homework_type,
                'description': hw.description,
                'lesson': hw.lesson.title,
                'submission_id': submission.id if submission else None,
                'status': submission.status if submission else 'not_submitted',
                'text_answer': submission.text_answer if submission else '',
                'submitted_at': submission.submitted_at if submission else None,
                'teacher_comment': submission.teacher_comment if submission else '',
            })

        return Response(result)


class SubmitHomeworkView(APIView):
    """POST /api/homework/<id>/submit/ — student submits homework"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            homework = Homework.objects.get(pk=pk)
        except Homework.DoesNotExist:
            return Response(
                {'error': 'Homework not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        student = request.user

        # Get or create submission
        submission, created = HomeworkSubmission.objects.get_or_create(
            homework=homework,
            student=student,
            defaults={'status': 'not_submitted'}
        )

        # Don't allow resubmission if already accepted
        if submission.status == 'accepted':
            return Response(
                {'error': 'This homework has already been accepted'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update submission
        text_answer = request.data.get('text_answer', '')
        file = request.FILES.get('file')

        if text_answer:
            submission.text_answer = text_answer
        if file:
            submission.file = file

        submission.status = 'submitted'
        submission.submitted_at = timezone.now()
        submission.save()

        return Response({
            'message': 'Homework submitted successfully ✅',
            'submission_id': submission.id,
            'status': submission.status
        })


class ReviewHomeworkView(APIView):
    """POST /api/homework/review/ — teacher reviews a submission"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not request.user.is_teacher() and not request.user.is_admin():
            return Response(
                {'error': 'Only teachers can review homework'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = ReviewHomeworkSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        try:
            submission = HomeworkSubmission.objects.get(pk=data['submission_id'])
        except HomeworkSubmission.DoesNotExist:
            return Response(
                {'error': 'Submission not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        submission.status = data['status']
        submission.teacher_comment = data.get('comment', '')
        submission.reviewed_by = request.user
        submission.reviewed_at = timezone.now()
        submission.save()

        return Response({
            'message': f'Homework marked as {data["status"]} ✅',
            'submission_id': submission.id,
            'status': submission.status
        })


class BulkReviewHomeworkView(APIView):
    """POST /api/homework/bulk-review/ — teacher reviews multiple submissions"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not request.user.is_teacher() and not request.user.is_admin():
            return Response(
                {'error': 'Only teachers can review homework'},
                status=status.HTTP_403_FORBIDDEN
            )

        reviews = request.data.get('reviews', [])
        if not reviews:
            return Response(
                {'error': 'No reviews provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        results = []
        for review in reviews:
            try:
                submission = HomeworkSubmission.objects.get(pk=review.get('submission_id'))
                submission.status = review.get('status', 'accepted')
                submission.teacher_comment = review.get('comment', '')
                submission.reviewed_by = request.user
                submission.reviewed_at = timezone.now()
                submission.save()
                results.append({
                    'submission_id': submission.id,
                    'status': 'updated'
                })
            except HomeworkSubmission.DoesNotExist:
                results.append({
                    'submission_id': review.get('submission_id'),
                    'status': 'not found'
                })

        return Response({
            'message': f'Reviewed {len(results)} submissions',
            'results': results
        })


class PendingHomeworkView(generics.ListAPIView):
    """GET /api/homework/pending/ — teacher sees unreviewed submissions"""
    serializer_class = HomeworkSubmissionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if not self.request.user.is_teacher() and not self.request.user.is_admin():
            return HomeworkSubmission.objects.none()

        # Get submissions for teacher's groups
        from groups.models import GroupEnrollment
        teacher_groups = self.request.user.teaching_groups.filter(is_active=True)
        student_ids = GroupEnrollment.objects.filter(
            group__in=teacher_groups,
            status='active'
        ).values_list('student_id', flat=True)

        return HomeworkSubmission.objects.filter(
            student_id__in=student_ids,
            status='submitted'
        ).order_by('submitted_at')


class CommentTemplateView(generics.ListCreateAPIView):
    """GET/POST /api/homework/templates/ — teacher's comment templates"""
    serializer_class = CommentTemplateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CommentTemplate.objects.filter(teacher=self.request.user)

    def perform_create(self, serializer):
        serializer.save(teacher=self.request.user)