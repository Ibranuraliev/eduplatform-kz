from django.contrib import admin
from .models import Homework, HomeworkSubmission, CommentTemplate


@admin.register(Homework)
class HomeworkAdmin(admin.ModelAdmin):
    list_display = ('title', 'lesson', 'homework_type', 'created_at')
    list_filter = ('homework_type',)
    search_fields = ('title',)


@admin.register(HomeworkSubmission)
class HomeworkSubmissionAdmin(admin.ModelAdmin):
    list_display = ('student', 'homework', 'status', 'submitted_at', 'reviewed_by')
    list_filter = ('status',)
    search_fields = ('student__phone', 'student__first_name')


@admin.register(CommentTemplate)
class CommentTemplateAdmin(admin.ModelAdmin):
    list_display = ('teacher', 'title', 'created_at')
    search_fields = ('title', 'teacher__first_name')