from rest_framework import serializers
from .models import Course, Package, Module, Lesson, Material, CourseEnrollment, LessonProgress


class MaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Material
        fields = ['id', 'title', 'material_type', 'file', 'link', 'created_at']


class LessonSerializer(serializers.ModelSerializer):
    materials = MaterialSerializer(many=True, read_only=True)
    course_id = serializers.IntegerField(source='module.course.id', read_only=True)

    class Meta:
        model = Lesson
        fields = ['id', 'title', 'order', 'video_url', 'materials', 'is_active', 'course_id']


class ModuleSerializer(serializers.ModelSerializer):
    lessons = LessonSerializer(many=True, read_only=True)

    class Meta:
        model = Module
        fields = ['id', 'title', 'order', 'lessons']


class CourseSerializer(serializers.ModelSerializer):
    modules = ModuleSerializer(many=True, read_only=True)
    is_enrolled = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'course_type', 'subject',
            'description', 'price', 'thumbnail',
            'is_active', 'modules', 'created_at', 'is_enrolled'
        ]

    def get_is_enrolled(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return CourseEnrollment.objects.filter(
            student=request.user,
            course=obj,
            is_active=True
        ).exists()

class CourseListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing courses (no modules)"""
    class Meta:
        model = Course
        fields = ['id', 'title', 'course_type', 'subject', 'description', 'price', 'thumbnail', 'is_active']


class PackageSerializer(serializers.ModelSerializer):
    courses = CourseListSerializer(many=True, read_only=True)

    class Meta:
        model = Package
        fields = ['id', 'title', 'courses', 'price', 'description', 'is_active']


class CourseEnrollmentSerializer(serializers.ModelSerializer):
    course = CourseListSerializer(read_only=True)

    class Meta:
        model = CourseEnrollment
        fields = ['id', 'course', 'enrolled_at', 'is_active']


class LessonProgressSerializer(serializers.ModelSerializer):
    lesson_id = serializers.IntegerField(source='lesson.id', read_only=True)
    lesson_title = serializers.CharField(source='lesson.title', read_only=True)

    class Meta:
        model = LessonProgress
        fields = ['id', 'lesson_id', 'lesson_title', 'completed_at']