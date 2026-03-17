from django.db import models
from users.models import User
from courses.models import Course


class Group(models.Model):
    """A class group of up to 15 students"""
    name = models.CharField(max_length=100)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='groups')
    teacher = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name='teaching_groups'
    )
    max_students = models.PositiveIntegerField(default=15)
    schedule_days = models.CharField(max_length=100, blank=True, default="")
    schedule_time = models.TimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} | {self.course.title}"

    def is_full(self):
        return self.enrollments.filter(status='active').count() >= self.max_students

    def current_student_count(self):
        return self.enrollments.filter(status='active').count()


class GroupEnrollment(models.Model):
    """Which student is in which group"""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('waitlist', 'Waitlist'),
        ('left', 'Left'),
    ]

    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='group_enrollments')
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='enrollments')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    is_trial = models.BooleanField(default=False)   # trial lesson enrollment
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('student', 'group')

    def __str__(self):
        return f"{self.student} → {self.group.name} ({self.status})"


class WaitlistEntry(models.Model):
    """Student waiting for a spot in a full group"""
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='waitlist_entries')
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='waitlist')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']   # first come first served

    def __str__(self):
        return f"{self.student} waiting for {self.group.name}"


class GroupSession(models.Model):
    """A single live class session"""
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('live', 'Live'),
        ('conducted', 'Conducted'),
        ('rescheduled', 'Rescheduled'),
        ('cancelled', 'Cancelled'),
    ]

    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='sessions')
    lesson = models.ForeignKey(
        'courses.Lesson', on_delete=models.SET_NULL, null=True, related_name='sessions'
    )
    scheduled_at = models.DateTimeField()       # when the class starts
    duration_minutes = models.PositiveIntegerField(default=90)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    meet_link = models.URLField(blank=True)     # Zoom/Google Meet link
    is_conducted = models.BooleanField(default=False)   # teacher marked as done
    conducted_at = models.DateTimeField(null=True, blank=True)
    access_extended = models.BooleanField(default=False)  # teacher extended +15 min
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['scheduled_at']

    def __str__(self):
        return f"{self.group.name} | {self.scheduled_at}"

    def get_link_visible_at(self):
        """Link becomes visible 5 minutes before start"""
        from datetime import timedelta
        return self.scheduled_at - timedelta(minutes=5)

    def get_link_hidden_at(self):
        """Link hides 30 minutes after end (+ possible 15 min extension)"""
        from datetime import timedelta
        end = self.scheduled_at + timedelta(minutes=self.duration_minutes)
        extra = timedelta(minutes=45) if self.access_extended else timedelta(minutes=30)
        return end + extra


class Attendance(models.Model):
    """Records if a student attended a session"""
    STATUS_CHOICES = [
        ('present', 'Present'),
        ('absent', 'Absent'),
    ]

    session = models.ForeignKey(GroupSession, on_delete=models.CASCADE, related_name='attendances')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='attendances')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    marked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('session', 'student')

    def __str__(self):
        return f"{self.student} | {self.session} | {self.status}"


class GroupChangeRequest(models.Model):
    """Student requests to move to a different group"""
    STATUS_CHOICES = [
        ('created', 'Created'),
        ('in_review', 'In Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='group_change_requests')
    current_group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='change_requests_from')
    requested_group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='change_requests_to')
    reason = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='created')
    reviewed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_group_changes'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.student} | {self.current_group} → {self.requested_group} ({self.status})"