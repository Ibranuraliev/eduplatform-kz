"""
Management command to seed realistic demo data for portfolio screenshots.
Creates a month of study history with courses, groups, sessions, homework, and chat.
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta, datetime, time
from decimal import Decimal
import random

from users.models import User
from courses.models import Course, Module, Lesson, Material
from groups.models import Group, GroupEnrollment, GroupSession, Attendance
from homework.models import Homework, HomeworkSubmission
from chat.models import Conversation, Message
from payments.models import Order, Payment
from notifications.models import Notification


class Command(BaseCommand):
    help = 'Seed realistic demo data for 1 month of student activity'

    def handle(self, *args, **options):
        self.stdout.write(self.style.HTTP_INFO("🚀 Starting demo data seeding..."))

        # Step 1: Get or create student user
        student = self._get_or_create_student()
        self.stdout.write(f"✓ Student: {student.get_full_name()} ({student.phone})")

        # Step 2: Get or create teacher
        teacher = self._get_or_create_teacher()
        self.stdout.write(f"✓ Teacher: {teacher.get_full_name()}")

        # Step 3: Create courses
        ent_math_course = self._get_or_create_course('ent_math', 'ЕНТ Математика')
        ielts_course = self._get_or_create_course('ielts', 'IELTS')
        ent_kazakh_course = self._get_or_create_course('ent_kazakh', 'ЕНТ Казахский язык')
        self.stdout.write("✓ Courses created")

        # Step 4: Create groups
        math_group = self._create_or_get_group(ent_math_course, teacher, 'ЕНТ Математика Группа А', 'пн, ср, пт', '18:00')
        ielts_group = self._create_or_get_group(ielts_course, teacher, 'IELTS Группа B', 'вт, чт', '19:00')
        kazakh_group = self._create_or_get_group(ent_kazakh_course, teacher, 'ЕНТ Казахский Группа C', 'сб', '10:00')
        self.stdout.write("✓ Groups created")

        # Step 5: Enroll student in groups
        self._enroll_student(student, math_group)
        self._enroll_student(student, ielts_group)
        self._enroll_student(student, kazakh_group)
        self.stdout.write("✓ Student enrolled in groups")

        # Step 6: Create past sessions (last month, 3x per week) and mark some as conducted
        past_sessions = self._create_past_sessions(math_group, ielts_group, kazakh_group, student)
        self.stdout.write(f"✓ Created {len(past_sessions)} past sessions")

        # Step 7: Create future sessions (next 2 weeks)
        future_sessions = self._create_future_sessions(math_group, ielts_group, kazakh_group)
        self.stdout.write(f"✓ Created {len(future_sessions)} future sessions")

        # Step 8: Create and populate lessons with homework
        all_sessions = past_sessions + future_sessions
        homework_items = self._create_homework_and_submissions(all_sessions, student, teacher)
        self.stdout.write(f"✓ Created {len(homework_items)} homework assignments")

        # Step 9: Create chat messages
        messages = self._create_chat_messages(student, teacher)
        self.stdout.write(f"✓ Created {len(messages)} chat messages")

        # Step 10: Create payment records
        payments = self._create_payments(student)
        self.stdout.write(f"✓ Created {len(payments)} payment records")

        # Step 11: Create notifications
        notifications = self._create_notifications(student)
        self.stdout.write(f"✓ Created {len(notifications)} notifications")

        self.stdout.write(self.style.SUCCESS(
            "\n✅ Demo data seeding complete! The platform now has realistic demo content."
        ))

    def _get_or_create_student(self):
        """Get or create the test student with phone +77001111111"""
        student, created = User.objects.get_or_create(
            phone='+77001111111',
            defaults={
                'username': 'student_demo',
                'first_name': 'Амина',
                'last_name': 'Сарбаева',
                'role': 'student',
                'city': 'Алматы',
                'grade': '11',
                'goal': 'ЕНТ',
                'school': 'СШ №42',
                'is_email_verified': True,
                'consent_personal_data': True,
                'consent_privacy_policy': True,
            }
        )
        if created:
            student.set_password('demo_password')
            student.save()
        return student

    def _get_or_create_teacher(self):
        """Get or create teacher named Алия Иванова"""
        teacher, created = User.objects.get_or_create(
            phone='+77011111111',
            defaults={
                'username': 'teacher_aliya',
                'first_name': 'Алия',
                'last_name': 'Иванова',
                'role': 'teacher',
                'city': 'Алматы',
                'is_email_verified': True,
                'consent_personal_data': True,
                'consent_privacy_policy': True,
            }
        )
        if created:
            teacher.set_password('demo_password')
            teacher.save()

            # Create teacher profile
            from hr.models import TeacherProfile
            TeacherProfile.objects.get_or_create(
                teacher=teacher,
                defaults={
                    'subjects': 'Математика, IELTS, Казахский язык',
                    'experience_years': 7,
                    'bio': 'Опытный преподаватель с 7 годами стажа',
                    'meet_link': 'https://zoom.us/j/1234567890',
                    'is_active': True,
                }
            )

        return teacher

    def _get_or_create_course(self, subject, title):
        """Get or create a course"""
        if subject == 'ent_math':
            course_type = 'ent'
        elif subject == 'ielts':
            course_type = 'ielts'
        elif subject == 'ent_kazakh':
            course_type = 'ent'
        else:
            course_type = 'individual'

        course, created = Course.objects.get_or_create(
            subject=subject,
            defaults={
                'title': title,
                'course_type': course_type,
                'description': f'Курс по {title}',
                'price': Decimal('50000.00'),
                'is_active': True,
            }
        )

        # Create modules and lessons if this is a new course
        if created:
            self._create_course_structure(course)

        return course

    def _create_course_structure(self, course):
        """Create modules and lessons for a course"""
        module_count = 3
        lessons_per_module = 4

        for mod_idx in range(1, module_count + 1):
            module, _ = Module.objects.get_or_create(
                course=course,
                order=mod_idx,
                defaults={
                    'title': f'Модуль {mod_idx}',
                }
            )

            for lesson_idx in range(1, lessons_per_module + 1):
                lesson, _ = Lesson.objects.get_or_create(
                    module=module,
                    order=lesson_idx,
                    defaults={
                        'title': f'{course.title} - Урок {lesson_idx}',
                        'video_url': f'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        'is_active': True,
                    }
                )

                # Create a material for each lesson
                Material.objects.get_or_create(
                    lesson=lesson,
                    title=f'Материал для {lesson.title}',
                    defaults={
                        'material_type': 'link',
                        'link': 'https://example.com/material',
                    }
                )

    def _create_or_get_group(self, course, teacher, name, schedule_days, schedule_time):
        """Create or get a group"""
        group, created = Group.objects.get_or_create(
            course=course,
            teacher=teacher,
            name=name,
            defaults={
                'max_students': 15,
                'schedule_days': schedule_days,
                'schedule_time': datetime.strptime(schedule_time, '%H:%M').time(),
                'is_active': True,
            }
        )
        return group

    def _enroll_student(self, student, group):
        """Enroll student in a group"""
        GroupEnrollment.objects.get_or_create(
            student=student,
            group=group,
            defaults={
                'status': 'active',
                'is_trial': False,
            }
        )

    def _create_past_sessions(self, math_group, ielts_group, kazakh_group, student):
        """Create sessions for the past month with attendance records"""
        sessions = []
        now = timezone.now()
        one_month_ago = now - timedelta(days=30)

        # Define schedule: math (mon, wed, fri), ielts (tue, thu), kazakh (sat)
        schedules = [
            (math_group, [0, 2, 4], time(18, 0)),      # Mon, Wed, Fri at 18:00
            (ielts_group, [1, 3], time(19, 0)),         # Tue, Thu at 19:00
            (kazakh_group, [5], time(10, 0)),           # Sat at 10:00
        ]

        current_date = one_month_ago.date()
        while current_date <= now.date():
            for group, weekdays, session_time in schedules:
                if current_date.weekday() in weekdays:
                    scheduled_at = timezone.make_aware(
                        datetime.combine(current_date, session_time)
                    )

                    session, created = GroupSession.objects.get_or_create(
                        group=group,
                        scheduled_at=scheduled_at,
                        defaults={
                            'duration_minutes': 90,
                            'status': 'conducted',
                            'is_conducted': True,
                            'conducted_at': scheduled_at + timedelta(hours=1, minutes=30),
                            'meet_link': 'https://zoom.us/j/1234567890',
                            'access_extended': False,
                        }
                    )

                    if created:
                        # Mark some sessions as rescheduled instead
                        if random.random() < 0.1:  # 10% are rescheduled
                            session.status = 'rescheduled'
                            session.is_conducted = False
                            session.conducted_at = None
                            session.save()

                        # Create attendance record (85% present)
                        if random.random() < 0.85:
                            Attendance.objects.create(
                                session=session,
                                student=student,
                                status='present',
                            )
                        else:
                            Attendance.objects.create(
                                session=session,
                                student=student,
                                status='absent',
                            )

                        sessions.append(session)

            current_date += timedelta(days=1)

        return sessions

    def _create_future_sessions(self, math_group, ielts_group, kazakh_group):
        """Create sessions for the next 2 weeks"""
        sessions = []
        now = timezone.now()
        two_weeks_later = now + timedelta(days=14)

        schedules = [
            (math_group, [0, 2, 4], time(18, 0)),
            (ielts_group, [1, 3], time(19, 0)),
            (kazakh_group, [5], time(10, 0)),
        ]

        current_date = now.date()
        while current_date <= two_weeks_later.date():
            for group, weekdays, session_time in schedules:
                if current_date.weekday() in weekdays:
                    scheduled_at = timezone.make_aware(
                        datetime.combine(current_date, session_time)
                    )

                    session, created = GroupSession.objects.get_or_create(
                        group=group,
                        scheduled_at=scheduled_at,
                        defaults={
                            'duration_minutes': 90,
                            'status': 'scheduled',
                            'is_conducted': False,
                            'meet_link': 'https://zoom.us/j/1234567890',
                            'access_extended': False,
                        }
                    )

                    if created:
                        sessions.append(session)

            current_date += timedelta(days=1)

        return sessions

    def _create_homework_and_submissions(self, sessions, student, teacher):
        """Create homework assignments and student submissions"""
        homework_items = []
        assignments = [
            {'title': 'Алгебра: Квадратные уравнения', 'description': 'Решите 15 квадратных уравнений'},
            {'title': 'IELTS Reading: The Future of Technology', 'description': 'Ответьте на 10 вопросов к тексту'},
            {'title': 'Казахский язык: Сочинение', 'description': 'Напишите сочинение на 500 слов'},
            {'title': 'Геометрия: Тригонометрия', 'description': 'Докажите 5 тригонометрических тождеств'},
            {'title': 'IELTS Writing: Opinion Essay', 'description': 'Напишите эссе (250-300 слов)'},
            {'title': 'Казахский язык: Грамматика', 'description': 'Выполните тест по грамматике'},
            {'title': 'Алгебра: Логарифмы', 'description': 'Решите 12 логарифмических уравнений'},
            {'title': 'IELTS Listening: Lecture', 'description': 'Прослушайте лекцию и ответьте на вопросы'},
            {'title': 'Казахский язык: Диалог', 'description': 'Создайте диалог на казахском языке'},
            {'title': 'Алгебра: Производные', 'description': 'Найдите производные 10 функций'},
        ]

        statuses = ['accepted', 'submitted', 'not_submitted', 'revision_required', 'revision_required']

        for idx, assignment in enumerate(assignments):
            # Get a conducted session as deadline
            conducted_sessions = [s for s in sessions if s.is_conducted]
            if not conducted_sessions:
                continue

            deadline_session = random.choice(conducted_sessions)
            lesson = deadline_session.group.sessions.first().lesson if deadline_session.group.sessions.exists() else None

            if not lesson:
                # Create a dummy lesson if needed
                from courses.models import Module
                module = Module.objects.filter(course=deadline_session.group.course).first()
                if not module:
                    module = Module.objects.create(
                        course=deadline_session.group.course,
                        title='Demo Module',
                        order=1
                    )
                lesson = Lesson.objects.create(
                    module=module,
                    title=f'Lesson for {assignment["title"]}',
                    order=idx + 1
                )

            homework, created = Homework.objects.get_or_create(
                lesson=lesson,
                defaults={
                    'title': assignment['title'],
                    'description': assignment['description'],
                    'homework_type': 'text' if idx % 2 == 0 else 'file',
                    'deadline_session': deadline_session,
                }
            )

            # Create submission
            status = random.choice(statuses)
            submission, _ = HomeworkSubmission.objects.get_or_create(
                homework=homework,
                student=student,
                defaults={
                    'status': status,
                    'text_answer': f'Мой ответ на задание: {assignment["title"]}' if status != 'not_submitted' else '',
                    'submitted_at': timezone.now() - timedelta(days=random.randint(1, 28)) if status != 'not_submitted' else None,
                    'reviewed_by': teacher if status in ['accepted', 'revision_required'] else None,
                    'teacher_comment': 'Хорошо, но нужны исправления.' if status == 'revision_required' else ('Отлично!' if status == 'accepted' else ''),
                    'reviewed_at': timezone.now() - timedelta(days=random.randint(1, 20)) if status in ['accepted', 'revision_required'] else None,
                }
            )

            homework_items.append(homework)

        return homework_items

    def _create_chat_messages(self, student, teacher):
        """Create chat messages between student and teacher"""
        messages = []

        # Create conversation
        conversation, created = Conversation.objects.get_or_create(
            student=student,
            teacher=teacher,
        )

        chat_data = [
            (teacher, "Привет! Как дела с математикой?"),
            (student, "Привет! Все хорошо, но сложновато с логарифмами"),
            (teacher, "Логарифмы - это важная тема. Давайте разберём на следующем уроке подробнее"),
            (student, "Спасибо! Я готовлюсь к ЕНТ, поэтому это критично"),
            (teacher, "Я знаю. Ты хорошо занимаешься. Твои оценки улучшаются"),
            (student, "Спасибо за поддержку! Я буду ещё больше стараться"),
            (teacher, "Не забудь про домашнее задание по производным до среды"),
            (student, "Поняла, спасибо! Я уже начала его делать"),
            (teacher, "Отлично! Если что-то непонятно, спрашивай"),
            (student, "Обязательно спрошу, если будут вопросы"),
            (teacher, "Кстати, как твой прогресс по IELTS?"),
            (student, "IELTS идёт лучше, я уже набираю 6.5 балла на пробных тестах"),
            (teacher, "Это хороший прогресс! Продолжай в том же духе"),
            (student, "Спасибо! Твои объяснения очень помогают"),
        ]

        now = timezone.now()
        for idx, (sender, text) in enumerate(chat_data):
            timestamp = now - timedelta(days=30 - (idx // 2))
            message = Message.objects.create(
                conversation=conversation,
                sender=sender,
                text=text,
                is_read=random.random() < 0.8,
                created_at=timestamp,
            )
            messages.append(message)

        return messages

    def _create_payments(self, student):
        """Create payment records"""
        payments = []

        courses_to_pay = Course.objects.all()[:2]

        for course in courses_to_pay:
            # Create order
            order, order_created = Order.objects.get_or_create(
                student=student,
                course=course,
                defaults={
                    'amount': course.price,
                    'discount_applied': Decimal('0.00'),
                    'final_amount': course.price,
                    'status': 'paid',
                }
            )

            # Create payment
            payment, _ = Payment.objects.get_or_create(
                order=order,
                defaults={
                    'amount': order.final_amount,
                    'status': 'paid',
                    'kaspi_transaction_id': f'kaspi_{order.id}_{random.randint(1000, 9999)}',
                    'paid_at': timezone.now() - timedelta(days=random.randint(5, 30)),
                }
            )

            payments.append(payment)

        return payments

    def _create_notifications(self, student):
        """Create notifications for the student"""
        notifications = []

        notification_texts = [
            ('homework_due', 'Домашнее задание истекает', 'Домашнее задание по математике заканчивается завтра'),
            ('session_starting', 'Урок начинается скоро', 'Ваш урок начинается через 30 минут. Ссылка на zoom доступна'),
            ('homework_reviewed', 'Домашнее задание проверено', 'Учитель проверил ваше сочинение. Посмотрите комментарии'),
            ('payment_confirmed', 'Платёж подтверждён', 'Платёж за курс IELTS успешно обработан'),
            ('general', 'Добро пожаловать', 'Добро пожаловать на платформу!'),
        ]

        now = timezone.now()
        for idx, (notif_type, title, message) in enumerate(notification_texts):
            notification = Notification.objects.create(
                recipient=student,
                notification_type=notif_type,
                title=title,
                message=message,
                is_read=random.random() < 0.5,
                created_at=now - timedelta(days=random.randint(0, 30)),
            )
            notifications.append(notification)

        return notifications
