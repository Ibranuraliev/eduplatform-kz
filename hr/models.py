from django.db import models
from users.models import User


class TeacherApplication(models.Model):
    """Teacher job application reviewed by HR"""
    STATUS_CHOICES = [
        ('new', 'New'),
        ('in_review', 'In Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    full_name = models.CharField(max_length=200)
    phone = models.CharField(max_length=20)
    experience_years = models.PositiveIntegerField(default=0)
    subjects = models.CharField(max_length=300)   # e.g. "Math, Physics"
    resume = models.FileField(upload_to='teacher_resumes/')
    diploma = models.FileField(upload_to='teacher_diplomas/')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')

    # HR actions
    reviewed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='reviewed_applications'
    )
    hr_note = models.TextField(blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.full_name} | {self.subjects} | {self.status}"


class TeacherProfile(models.Model):
    """Extended profile for approved teachers"""
    teacher = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name='teacher_profile'
    )
    meet_link = models.URLField(blank=True)       # permanent Zoom/Google Meet link
    subjects = models.CharField(max_length=300)
    experience_years = models.PositiveIntegerField(default=0)
    bio = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Teacher: {self.teacher.get_full_name()}"


class TeacherLatenessRecord(models.Model):
    """Tracks teacher lateness for monthly reporting"""
    teacher = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='lateness_records'
    )
    session = models.ForeignKey(
        'groups.GroupSession', on_delete=models.CASCADE, related_name='lateness_records'
    )
    minutes_late = models.PositiveIntegerField(default=0)
    note = models.TextField(blank=True)
    recorded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.teacher} | {self.minutes_late} min late | {self.session}"

class TrialLessonRequest(models.Model):
    """Student request for a free trial lesson"""
    STATUS_CHOICES = [
        ('new', 'New'),
        ('contacted', 'Contacted'),
        ('scheduled', 'Scheduled'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    SUBJECT_CHOICES = [
        ('ent_math',    'ЕНТ Математика'),
        ('ent_kazakh',  'ЕНТ Казахский язык'),
        ('ent_russian', 'ЕНТ Русский язык'),
        ('ent_history', 'ЕНТ История Казахстана'),
        ('ielts',       'IELTS'),
        ('sat_math',    'SAT Математика'),
        ('sat_english', 'SAT Английский'),
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

    full_name = models.CharField(max_length=200)
    phone = models.CharField(max_length=20)
    grade = models.CharField(max_length=20, blank=True)
    subject = models.CharField(max_length=50, choices=SUBJECT_CHOICES)
    goal = models.CharField(max_length=300, blank=True)
    convenient_time = models.CharField(max_length=200, blank=True)
    comment = models.TextField(blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    manager_note = models.TextField(blank=True)
    handled_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='handled_trial_requests'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.full_name} | {self.subject} | {self.status}"


class TrialSlot(models.Model):
    """Available time slots for trial lessons, managed by admin/HR"""
    date = models.DateField()
    time_start = models.TimeField()
    duration_minutes = models.PositiveIntegerField(default=60)
    subject = models.CharField(max_length=50, blank=True, help_text="Leave blank for any subject")
    teacher = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='trial_slots'
    )
    max_bookings = models.PositiveIntegerField(default=1)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['date', 'time_start']

    def bookings_count(self):
        return self.trial_bookings.filter(status__in=['new','confirmed']).count()

    def is_available(self):
        return self.is_active and self.bookings_count() < self.max_bookings

    def __str__(self):
        return f"{self.date} {self.time_start} | {self.subject or 'Any'}"


class TrialLessonBooking(models.Model):
    """Student booking of a trial lesson slot"""
    STATUS_CHOICES = [
        ('new', 'New'),
        ('confirmed', 'Confirmed'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    SUBJECT_CHOICES = [
        ('ent_math',    'ЕНТ Математика'),
        ('ent_kazakh',  'ЕНТ Казахский язык'),
        ('ent_russian', 'ЕНТ Русский язык'),
        ('ent_history', 'ЕНТ История Казахстана'),
        ('ielts',       'IELTS'),
        ('sat_math',    'SAT Математика'),
        ('sat_english', 'SAT Английский'),
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

    student = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='trial_bookings'
    )
    slot = models.ForeignKey(
        TrialSlot, on_delete=models.CASCADE, related_name='trial_bookings'
    )
    subject = models.CharField(max_length=50, choices=SUBJECT_CHOICES)
    comment = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    manager_note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('student', 'slot')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.student} | {self.subject} | {self.slot.date} {self.slot.time_start}"

class Vacancy(models.Model):
    """Job vacancies created by HR, shown on public /vacancies page"""
    TYPE_CHOICES = [
        ('teacher', 'Учитель'),
        ('mentor', 'Ментор'),
        ('curator', 'Куратор'),
        ('other', 'Другое'),
    ]
    STATUS_CHOICES = [
        ('active', 'Активна'),
        ('paused', 'Приостановлена'),
        ('closed', 'Закрыта'),
    ]

    title = models.CharField(max_length=200)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='teacher')
    subject = models.CharField(max_length=100, blank=True)  # e.g. "Математика, Физика"
    description = models.TextField()
    requirements = models.TextField(blank=True)
    conditions = models.TextField(blank=True)   # salary, schedule info
    salary = models.CharField(max_length=100, blank=True)  # e.g. "150 000 – 300 000 ₸"
    schedule = models.CharField(max_length=200, blank=True)  # e.g. "Удалённо, гибкий график"
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='created_vacancies'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} | {self.status}"