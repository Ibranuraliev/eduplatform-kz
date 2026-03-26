from django.contrib import admin
from .models import Course, Package, Module, Lesson, Material, CourseEnrollment


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('title', 'course_type', 'subject', 'price', 'is_active', 'created_at')
    list_filter = ('course_type', 'is_active')
    search_fields = ('title', 'subject')


@admin.register(Package)
class PackageAdmin(admin.ModelAdmin):
    list_display = ('title', 'price', 'is_active', 'created_at')
    filter_horizontal = ('courses',)


@admin.register(Module)
class ModuleAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'order')
    list_filter = ('course',)
    ordering = ('course', 'order')


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ('title', 'module', 'order', 'is_active', 'created_at')
    list_filter = ('module__course',)
    search_fields = ('title',)


@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display = ('title', 'lesson', 'material_type', 'created_at')
    list_filter = ('material_type',)


@admin.register(CourseEnrollment)
class CourseEnrollmentAdmin(admin.ModelAdmin):
    list_display = ('student', 'course', 'enrolled_at', 'is_active')
    list_filter = ('is_active', 'course')
    search_fields = ('student__phone', 'student__first_name')