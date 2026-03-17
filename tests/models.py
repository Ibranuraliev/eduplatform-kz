from django.db import models
from users.models import User
from courses.models import Lesson
from groups.models import GroupSession


class Test(models.Model):
    """A test assigned after each lesson (required)"""
    lesson = models.OneToOneField(Lesson, on_delete=models.CASCADE, related_name='test')
    title = models.CharField(max_length=200)
    time_limit_minutes = models.PositiveIntegerField(default=20)
    max_attempts = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Test: {self.lesson.title}"


class TestQuestion(models.Model):
    """A single question inside a test"""
    QUESTION_TYPE_CHOICES = [
        ('single', 'Single Choice'),
        ('multiple', 'Multiple Choice'),
        ('text', 'Text Answer'),
    ]

    test = models.ForeignKey(Test, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPE_CHOICES, default='single')
    order = models.PositiveIntegerField(default=0)
    points = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.test.title} | Q{self.order}: {self.question_text[:50]}"


class TestAnswer(models.Model):
    """Possible answers for a question"""
    question = models.ForeignKey(TestQuestion, on_delete=models.CASCADE, related_name='answers')
    answer_text = models.TextField()
    is_correct = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.question} | {self.answer_text[:30]} | correct={self.is_correct}"


class TestAttempt(models.Model):
    """A student's attempt at a test"""
    STATUS_CHOICES = [
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('overdue', 'Overdue'),
    ]

    test = models.ForeignKey(Test, on_delete=models.CASCADE, related_name='attempts')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='test_attempts')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_progress')
    score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    deadline_session = models.ForeignKey(
        GroupSession, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='test_deadlines'
    )  # must complete before this session

    class Meta:
        unique_together = ('test', 'student')  # only 1 attempt allowed

    def __str__(self):
        return f"{self.student} | {self.test.title} | score={self.score}"


class TestAttemptAnswer(models.Model):
    """Records which answer a student chose"""
    attempt = models.ForeignKey(TestAttempt, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(TestQuestion, on_delete=models.CASCADE)
    selected_answers = models.ManyToManyField(TestAnswer, blank=True)
    text_answer = models.TextField(blank=True)
    is_correct = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.attempt} | Q: {self.question}"
    