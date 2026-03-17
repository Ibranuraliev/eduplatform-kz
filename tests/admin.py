from django.contrib import admin
from .models import Test, TestQuestion, TestAnswer, TestAttempt, TestAttemptAnswer


@admin.register(Test)
class TestAdmin(admin.ModelAdmin):
    list_display = ('title', 'lesson', 'time_limit_minutes', 'max_attempts', 'created_at')
    search_fields = ('title',)


@admin.register(TestQuestion)
class TestQuestionAdmin(admin.ModelAdmin):
    list_display = ('test', 'question_text', 'question_type', 'order', 'points')
    list_filter = ('question_type',)
    ordering = ('test', 'order')


@admin.register(TestAnswer)
class TestAnswerAdmin(admin.ModelAdmin):
    list_display = ('question', 'answer_text', 'is_correct')
    list_filter = ('is_correct',)


@admin.register(TestAttempt)
class TestAttemptAdmin(admin.ModelAdmin):
    list_display = ('student', 'test', 'status', 'score', 'started_at', 'completed_at')
    list_filter = ('status',)
    search_fields = ('student__phone', 'student__first_name')


@admin.register(TestAttemptAnswer)
class TestAttemptAnswerAdmin(admin.ModelAdmin):
    list_display = ('attempt', 'question', 'is_correct')