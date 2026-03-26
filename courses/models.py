from django.db import models
from users.models import User


class Course(models.Model):
    COURSE_TYPE_CHOICES = [
        ('ent', 'ЕНТ'),
        ('ielts', 'IELTS'),
        ('sat', 'SAT'),
        ('individual', 'Индивидуальный предмет'),
    ]

    SUBJECT_CHOICES = [
        ('', 'Не указан'),
        # ENT
        ('ent_math',    'ЕНТ Математика'),
        ('ent_kazakh',  'ЕНТ Казахский язык'),
        ('ent_russian', 'ЕНТ Русский язык'),
        ('ent_history', 'ЕНТ История Казахстана'),
        # International exams
        ('ielts',       'IELTS'),
        ('sat_math',    'SAT Математика'),
        ('sat_english', 'SAT Английский'),
        # School subjects
        ('math',        'Математика'),
        ('physics',     'Физика'),
        ('chemistry',   'Химия'),
        ('biology',     'Биология'),
        ('english',     'Английский язык'),
        ('kazakh',      'Казахский язык'),
        ('russian',     'Русский язык'),
        ('history',     'История'),
        ('geography',   'География'),
        ('informatics', 'Информатика'),
        ('other',       'Другое'),
    ]

    title = models.CharField(max_length=200)
    course_type = models.CharField(max_length=20, choices=COURSE_TYPE_CHOICES)
    subject = models.CharField(max_length=100, choices=SUBJECT_CHOICES, blank=True, default='')  # specific subject
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)  # in KZT
    thumbnail = models.ImageField(upload_to='courses/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.course_type})"


class Package(models.Model):
    """Bundle of multiple courses sold together"""
    title = models.CharField(max_length=200)
    courses = models.ManyToManyField(Course, related_name='packages')
    price = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class Module(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='modules')
    title = models.CharField(max_length=200)
    order = models.PositiveIntegerField(default=0)  # module number/order

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.course.title} | Module {self.order}: {self.title}"


class Lesson(models.Model):
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name='lessons')
    title = models.CharField(max_length=200)
    order = models.PositiveIntegerField(default=0)
    video_url = models.URLField(blank=True)   # YouTube link
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.module.course.title} | {self.title}"


class Material(models.Model):
    MATERIAL_TYPE_CHOICES = [
        ('pdf', 'PDF'),
        ('docx', 'DOCX'),
        ('pptx', 'PPTX'),
        ('image', 'Image'),
        ('link', 'Link'),
    ]

    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='materials')
    title = models.CharField(max_length=200)
    material_type = models.CharField(max_length=20, choices=MATERIAL_TYPE_CHOICES)
    file = models.FileField(upload_to='materials/', blank=True, null=True)
    link = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.lesson.title} | {self.title}"


class CourseEnrollment(models.Model):
    """Tracks which student has access to which course"""
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='enrollments')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    enrolled_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('student', 'course')  # can't enroll twice

    def __str__(self):
        return f"{self.student} → {self.course}"


class LessonProgress(models.Model):
    """Tracks which lessons a student has completed"""
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='lesson_progress')
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='progress')
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('student', 'lesson')

    def __str__(self):
        return f"{self.student} | {self.lesson.title} | ✓"
    