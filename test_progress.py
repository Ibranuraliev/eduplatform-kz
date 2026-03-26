import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from courses.models import CourseEnrollment
from tests.models import TestAttempt
from users.models import User

student = User.objects.get(phone='+77001111111')
enrollments = CourseEnrollment.objects.filter(student=student, is_active=True)

for e in enrollments:
    total = 0
    for m in e.course.modules.all():
        for l in m.lessons.all():
            if hasattr(l, 'test'):
                total += 1
    completed = TestAttempt.objects.filter(
        student=student,
        test__lesson__module__course=e.course,
        status='completed'
    ).count()
    progress = round(completed/total*100 if total > 0 else 0, 1)
    print(f"Course: {e.course.title}")
    print(f"Progress: {completed}/{total} tests = {progress}%")

print("Done!")
