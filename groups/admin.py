from django.contrib import admin
from .models import (
    Group, GroupEnrollment, WaitlistEntry,
    GroupSession, Attendance, GroupChangeRequest
)


@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = ('name', 'course', 'teacher', 'current_student_count', 'max_students', 'schedule_days', 'schedule_time', 'is_active')
    list_filter = ('course', 'is_active')
    search_fields = ('name',)
    fields = ('name', 'course', 'teacher', 'max_students', 'schedule_days', 'schedule_time', 'is_active')


@admin.register(GroupEnrollment)
class GroupEnrollmentAdmin(admin.ModelAdmin):
    list_display = ('student', 'group', 'status', 'is_trial', 'joined_at')
    list_filter = ('status', 'is_trial')
    search_fields = ('student__phone', 'student__first_name')


@admin.register(WaitlistEntry)
class WaitlistEntryAdmin(admin.ModelAdmin):
    list_display = ('student', 'group', 'created_at')
    ordering = ('created_at',)


@admin.register(GroupSession)
class GroupSessionAdmin(admin.ModelAdmin):
    list_display = ('group', 'lesson', 'scheduled_at', 'status', 'is_conducted')
    list_filter = ('status', 'is_conducted', 'group__course')
    search_fields = ('group__name',)
    ordering = ('scheduled_at',)


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('student', 'session', 'status', 'marked_at')
    list_filter = ('status',)
    search_fields = ('student__phone', 'student__first_name')


@admin.register(GroupChangeRequest)
class GroupChangeRequestAdmin(admin.ModelAdmin):
    list_display = ('student', 'current_group', 'requested_group', 'status', 'created_at')
    list_filter = ('status',)