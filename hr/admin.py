from django.contrib import admin
from .models import TeacherApplication, TeacherProfile, TeacherLatenessRecord, TrialLessonRequest, TrialSlot, TrialLessonBooking


@admin.register(TeacherApplication)
class TeacherApplicationAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'phone', 'subjects', 'experience_years', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('full_name', 'phone', 'subjects')
    ordering = ('-created_at',)


@admin.register(TeacherProfile)
class TeacherProfileAdmin(admin.ModelAdmin):
    list_display = ('teacher', 'subjects', 'experience_years', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('teacher__first_name', 'teacher__phone')


@admin.register(TeacherLatenessRecord)
class TeacherLatenessRecordAdmin(admin.ModelAdmin):
    list_display = ('teacher', 'session', 'minutes_late', 'recorded_at')
    ordering = ('-recorded_at',)

@admin.register(TrialLessonRequest)
class TrialLessonRequestAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'phone', 'subject', 'grade', 'status', 'created_at')
    list_filter = ('status', 'subject')
    search_fields = ('full_name', 'phone')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at')


@admin.register(TrialSlot)
class TrialSlotAdmin(admin.ModelAdmin):
    list_display = ('date', 'time_start', 'subject', 'teacher', 'max_bookings', 'bookings_count', 'is_active')
    list_filter = ('subject', 'is_active', 'date')
    ordering = ('date', 'time_start')
    list_editable = ('is_active',)


@admin.register(TrialLessonBooking)
class TrialLessonBookingAdmin(admin.ModelAdmin):
    list_display = ('student', 'subject', 'slot', 'status', 'created_at')
    list_filter = ('status', 'subject')
    search_fields = ('student__first_name', 'student__phone')
    ordering = ('-created_at',)