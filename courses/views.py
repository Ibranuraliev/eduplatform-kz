from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.shortcuts import get_object_or_404
from .models import Course, Package, Module, Lesson, Material, CourseEnrollment, LessonProgress
from .serializers import (
    CourseSerializer, CourseListSerializer,
    PackageSerializer, ModuleSerializer,
    LessonSerializer, CourseEnrollmentSerializer, MaterialSerializer
)


class CourseListView(generics.ListAPIView):
    """GET /api/courses/ — list all active courses (public)"""
    queryset = Course.objects.filter(is_active=True)
    serializer_class = CourseListSerializer
    permission_classes = [AllowAny]


class CourseDetailView(generics.RetrieveAPIView):
    """GET /api/courses/<id>/ — course detail with modules & lessons"""
    queryset = Course.objects.filter(is_active=True)
    serializer_class = CourseSerializer
    permission_classes = [AllowAny]


class PackageListView(generics.ListAPIView):
    """GET /api/courses/packages/ — list all packages (public)"""
    queryset = Package.objects.filter(is_active=True)
    serializer_class = PackageSerializer
    permission_classes = [AllowAny]


class MyCoursesView(generics.ListAPIView):
    """GET /api/courses/my/ — courses the logged-in student purchased"""
    serializer_class = CourseEnrollmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CourseEnrollment.objects.filter(
            student=self.request.user,
            is_active=True
        )


class LessonDetailView(generics.RetrieveAPIView):
    """GET /api/courses/lessons/<id>/ — lesson detail (enrolled students only)"""
    serializer_class = LessonSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        enrolled_courses = CourseEnrollment.objects.filter(
            student=user, is_active=True
        ).values_list('course_id', flat=True)

        return Lesson.objects.filter(
            module__course__id__in=enrolled_courses,
            is_active=True
        )


# ── Course Progress ───────────────────────────────────────────────────────────

class MarkLessonCompleteView(APIView):
    """POST /api/courses/lessons/<pk>/complete/ — student marks lesson as done"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        lesson = get_object_or_404(Lesson, pk=pk, is_active=True)
        if not CourseEnrollment.objects.filter(
            student=request.user, course=lesson.module.course, is_active=True
        ).exists():
            return Response({'error': 'Not enrolled in this course'}, status=status.HTTP_403_FORBIDDEN)

        progress, created = LessonProgress.objects.get_or_create(
            student=request.user, lesson=lesson
        )
        return Response({'message': 'Marked as complete', 'already_done': not created})


class CourseProgressView(APIView):
    """GET /api/courses/<pk>/progress/ — get student's progress in a course"""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        course = get_object_or_404(Course, pk=pk)
        if not CourseEnrollment.objects.filter(
            student=request.user, course=course, is_active=True
        ).exists():
            return Response({'error': 'Not enrolled'}, status=status.HTTP_403_FORBIDDEN)

        total = Lesson.objects.filter(module__course=course, is_active=True).count()
        completed_qs = LessonProgress.objects.filter(
            student=request.user, lesson__module__course=course
        )
        completed = completed_qs.count()
        completed_ids = list(completed_qs.values_list('lesson_id', flat=True))
        percent = int(completed / total * 100) if total > 0 else 0

        return Response({
            'total': total,
            'completed': completed,
            'percent': percent,
            'completed_lesson_ids': completed_ids,
        })


# ── Lesson Materials (Teacher Dashboard) ─────────────────────────────────────

class AddMaterialView(APIView):
    """POST /api/courses/lessons/<pk>/materials/ — teacher adds material to lesson"""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request, pk):
        if request.user.role != 'teacher':
            return Response({'error': 'Teachers only'}, status=status.HTTP_403_FORBIDDEN)

        from groups.models import GroupSession
        lesson = get_object_or_404(Lesson, pk=pk)

        if not GroupSession.objects.filter(lesson=lesson, group__teacher=request.user).exists():
            return Response({'error': 'You don\'t teach this lesson'}, status=status.HTTP_403_FORBIDDEN)

        title = request.data.get('title', '').strip()
        material_type = request.data.get('material_type', 'link')
        file = request.FILES.get('file')
        link = request.data.get('link', '')

        if not title:
            return Response({'error': 'Title is required'}, status=status.HTTP_400_BAD_REQUEST)

        material = Material.objects.create(
            lesson=lesson,
            title=title,
            material_type=material_type,
            file=file if material_type != 'link' else None,
            link=link if material_type == 'link' else '',
        )
        return Response(MaterialSerializer(material).data, status=status.HTTP_201_CREATED)


class DeleteMaterialView(APIView):
    """DELETE /api/courses/materials/<pk>/ — teacher removes a material"""
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        if request.user.role != 'teacher':
            return Response({'error': 'Teachers only'}, status=status.HTTP_403_FORBIDDEN)

        from groups.models import GroupSession
        material = get_object_or_404(Material, pk=pk)

        if not GroupSession.objects.filter(lesson=material.lesson, group__teacher=request.user).exists():
            return Response({'error': 'Not your lesson'}, status=status.HTTP_403_FORBIDDEN)

        material.delete()
        return Response({'message': 'Material deleted'})
