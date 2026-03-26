from django.db import models
from users.models import User
from courses.models import Lesson
from groups.models import GroupSession


class Homework(models.Model):
    """Homework assigned to a lesson"""
    TYPE_CHOICES = [
        ('text', 'Text'),
        ('file', 'File Upload'),
        ('test', 'Test'),
    ]

    lesson = models.OneToOneField(Lesson, on_delete=models.CASCADE, related_name='homework')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    homework_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='text')
    deadline_session = models.ForeignKey(
        GroupSession, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='homework_deadlines'
    )  # deadline = before this session
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Homework: {self.lesson.title}"


class HomeworkSubmission(models.Model):
    """A student's submitted homework"""
    STATUS_CHOICES = [
        ('not_submitted', 'Not Submitted'),
        ('submitted', 'Submitted'),
        ('accepted', 'Accepted'),
        ('revision_required', 'Revision Required'),
        ('overdue', 'Overdue'),
    ]

    homework = models.ForeignKey(Homework, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='homework_submissions')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='not_submitted')
    text_answer = models.TextField(blank=True)
    file = models.FileField(upload_to='homework_files/', blank=True, null=True)
    submitted_at = models.DateTimeField(null=True, blank=True)

    # Teacher review
    reviewed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_homework'
    )
    teacher_comment = models.TextField(blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('homework', 'student')

    def __str__(self):
        return f"{self.student} | {self.homework} | {self.status}"


class CommentTemplate(models.Model):
    """Saved comment templates for teachers to reuse"""
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comment_templates')
    title = models.CharField(max_length=100)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.teacher} | {self.title}"