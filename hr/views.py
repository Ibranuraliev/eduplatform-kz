from django.db import models
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone
from .models import TeacherApplication, TeacherProfile, TeacherLatenessRecord
from .serializers import (
    TeacherApplicationSerializer, ReviewApplicationSerializer,
    TeacherProfileSerializer, TeacherLatenessSerializer
)
from users.models import User


class ApplyAsTeacherView(APIView):
    """POST /api/hr/apply/ — anyone can submit a teacher application"""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = TeacherApplicationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        application = serializer.save()

        return Response({
            'message': 'Application submitted successfully! HR will review it soon.',
            'application_id': application.id
        }, status=status.HTTP_201_CREATED)


class ApplicationListView(generics.ListAPIView):
    """GET /api/hr/applications/ — HR sees all applications"""
    serializer_class = TeacherApplicationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if not self.request.user.is_hr() and not self.request.user.is_admin():
            return TeacherApplication.objects.none()

        status_filter = self.request.query_params.get('status')
        qs = TeacherApplication.objects.all().order_by('-created_at')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs


class ReviewApplicationView(APIView):
    """POST /api/hr/applications/review/ — HR approves or rejects application"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not request.user.is_hr() and not request.user.is_admin():
            return Response(
                {'error': 'Only HR can review applications'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = ReviewApplicationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        try:
            application = TeacherApplication.objects.get(pk=data['application_id'])
        except TeacherApplication.DoesNotExist:
            return Response(
                {'error': 'Application not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        application.status = data['status']
        application.hr_note = data.get('note', '')
        application.reviewed_by = request.user
        application.reviewed_at = timezone.now()
        application.save()

        # If approved → create teacher user account and profile
        if data['status'] == 'approved':
            self._create_teacher_account(application)

        return Response({
            'message': f'Application {data["status"]} successfully ✅',
            'application_id': application.id
        })

    def _create_teacher_account(self, application):
        """Create a user account for approved teacher"""
        # Check if user already exists
        if User.objects.filter(phone=application.phone).exists():
            user = User.objects.get(phone=application.phone)
        else:
            import random
            import string
            # Create new user with teacher role
            temp_password = ''.join(random.choices(string.digits, k=8))
            user = User.objects.create_user(
                username=application.phone,
                phone=application.phone,
                first_name=application.full_name.split()[0],
                last_name=' '.join(application.full_name.split()[1:]),
                password=temp_password,
                role='teacher'
            )

        # Create teacher profile
        TeacherProfile.objects.get_or_create(
            teacher=user,
            defaults={
                'subjects': application.subjects,
                'experience_years': application.experience_years
            }
        )


class TeacherProfileView(generics.RetrieveUpdateAPIView):
    """GET/PUT /api/hr/profile/ — teacher views and updates their profile"""
    serializer_class = TeacherProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        profile, created = TeacherProfile.objects.get_or_create(
            teacher=self.request.user,
            defaults={'subjects': '', 'experience_years': 0}
        )
        return profile


class TeacherListView(generics.ListAPIView):
    """GET /api/hr/teachers/ — admin sees all teachers"""
    serializer_class = TeacherProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if not self.request.user.is_admin() and not self.request.user.is_hr():
            return TeacherProfile.objects.none()
        return TeacherProfile.objects.filter(is_active=True)


class RecordLatenessView(APIView):
    """POST /api/hr/lateness/ — record teacher lateness"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not request.user.is_admin() and not request.user.is_hr():
            return Response(
                {'error': 'Only admin or HR can record lateness'},
                status=status.HTTP_403_FORBIDDEN
            )

        teacher_id = request.data.get('teacher_id')
        session_id = request.data.get('session_id')
        minutes_late = request.data.get('minutes_late', 0)
        note = request.data.get('note', '')

        if not all([teacher_id, session_id]):
            return Response(
                {'error': 'teacher_id and session_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        from groups.models import GroupSession
        try:
            session = GroupSession.objects.get(pk=session_id)
            teacher = User.objects.get(pk=teacher_id, role='teacher')
        except (GroupSession.DoesNotExist, User.DoesNotExist):
            return Response(
                {'error': 'Session or teacher not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        record = TeacherLatenessRecord.objects.create(
            teacher=teacher,
            session=session,
            minutes_late=minutes_late,
            note=note
        )

        return Response({
            'message': 'Lateness recorded successfully',
            'record_id': record.id
        })


class StudentProgressView(APIView):
    """GET /api/hr/progress/<student_id>/ — view student progress"""
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id=None):
        # Students can only see their own progress
        if request.user.is_student():
            student = request.user
        else:
            try:
                student = User.objects.get(pk=student_id, role='student')
            except User.DoesNotExist:
                return Response(
                    {'error': 'Student not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

        from courses.models import CourseEnrollment
        from tests.models import TestAttempt
        from groups.models import GroupEnrollment, Attendance

        enrollments = CourseEnrollment.objects.filter(student=student, is_active=True)
        progress_data = []

        for enrollment in enrollments:
            course = enrollment.course

            # Count total tests in course
            total_tests = 0
            for module in course.modules.all():
                for lesson in module.lessons.all():
                    if hasattr(lesson, 'test'):
                        total_tests += 1

            # Count completed tests
            completed_tests = TestAttempt.objects.filter(
                student=student,
                test__lesson__module__course=course,
                status='completed'
            ).count()

            # Calculate progress percentage
            progress_percent = 0
            if total_tests > 0:
                progress_percent = round((completed_tests / total_tests) * 100, 1)

            # Get attendance stats
            group_enrollment = GroupEnrollment.objects.filter(
                student=student,
                group__course=course,
                status='active'
            ).first()

            attendance_stats = {'present': 0, 'absent': 0, 'total': 0}
            if group_enrollment:
                attendances = Attendance.objects.filter(
                    student=student,
                    session__group=group_enrollment.group
                )
                attendance_stats['present'] = attendances.filter(status='present').count()
                attendance_stats['absent'] = attendances.filter(status='absent').count()
                attendance_stats['total'] = attendances.count()

            progress_data.append({
                'course': course.title,
                'course_id': course.id,
                'progress_percent': progress_percent,
                'completed_tests': completed_tests,
                'total_tests': total_tests,
                'attendance': attendance_stats
            })

        return Response({
            'student': student.get_full_name(),
            'phone': student.phone,
            'courses': progress_data
        })

class TrialLessonRequestView(APIView):
    """POST /api/hr/trial/ - public: submit trial lesson request"""
    permission_classes = []

    def post(self, request):
        from .models import TrialLessonRequest
        data = request.data
        required = ['full_name', 'phone', 'subject']
        missing = [f for f in required if not data.get(f)]
        if missing:
            return Response({'error': f'Required: {missing}'}, status=status.HTTP_400_BAD_REQUEST)

        phone = data.get('phone', '').strip()
        if len(phone) < 10:
            return Response({'error': 'Invalid phone number'}, status=status.HTTP_400_BAD_REQUEST)

        trial = TrialLessonRequest.objects.create(
            full_name=data['full_name'].strip(),
            phone=phone,
            grade=data.get('grade', ''),
            subject=data['subject'],
            goal=data.get('goal', ''),
            convenient_time=data.get('convenient_time', ''),
            comment=data.get('comment', ''),
        )
        return Response({'message': 'Trial lesson request submitted successfully', 'id': trial.id}, status=status.HTTP_201_CREATED)


class TrialLessonListView(APIView):
    """GET /api/hr/trials/ - HR/admin: list all trial requests"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from .models import TrialLessonRequest
        if request.user.role not in ['hr', 'admin']:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        status_filter = request.query_params.get('status')
        qs = TrialLessonRequest.objects.all()
        if status_filter:
            qs = qs.filter(status=status_filter)
        data = [{
            'id': t.id,
            'full_name': t.full_name,
            'phone': t.phone,
            'grade': t.grade,
            'subject': t.subject,
            'goal': t.goal,
            'convenient_time': t.convenient_time,
            'comment': t.comment,
            'status': t.status,
            'manager_note': t.manager_note,
            'created_at': t.created_at.isoformat(),
        } for t in qs]
        return Response(data)

    def patch(self, request):
        from .models import TrialLessonRequest
        if request.user.role not in ['hr', 'admin']:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        trial_id = request.data.get('id')
        try:
            trial = TrialLessonRequest.objects.get(pk=trial_id)
        except TrialLessonRequest.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        if 'status' in request.data:
            trial.status = request.data['status']
        if 'manager_note' in request.data:
            trial.manager_note = request.data['manager_note']
        trial.handled_by = request.user
        trial.save()
        return Response({'message': 'Updated'})


class TrialSlotsView(APIView):
    """GET /api/hr/slots/?subject=ent_math - available slots for a subject.
    Automatically generates TrialSlot records from upcoming group sessions
    when no manual slots exist for the requested subject."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from .models import TrialSlot
        from groups.models import Group, GroupSession
        from django.utils import timezone

        subject = request.query_params.get('subject', '')
        today = timezone.now().date()
        now = timezone.now()

        # ── Auto-generate TrialSlots from active groups with matching subject ──
        # Map subject keys to course_type for fallback (when course.subject is blank)
        SUBJECT_TO_TYPE = {
            'ent_math': 'ent', 'ent_kazakh': 'ent',
            'ent_russian': 'ent', 'ent_history': 'ent',
            'ielts': 'ielts',
            'sat_math': 'sat', 'sat_english': 'sat',
            'math': 'individual', 'physics': 'individual',
            'chemistry': 'individual', 'biology': 'individual',
            'english': 'individual', 'kazakh': 'individual',
            'russian': 'individual', 'history': 'individual',
        }

        # ── Build response: manual TrialSlots + GroupSession-based virtual slots ──
        data = []

        # 1. Manual TrialSlots created by admin
        slots_qs = TrialSlot.objects.filter(
            is_active=True,
            date__gte=today,
        ).select_related('teacher')
        if subject:
            slots_qs = slots_qs.filter(
                models.Q(subject=subject) | models.Q(subject='')
            )
        for s in slots_qs:
            bookings = s.trial_bookings.filter(status__in=['new', 'confirmed']).count()
            if bookings >= s.max_bookings:
                continue
            data.append({
                'id': s.id,
                'date': s.date.isoformat(),
                'time_start': str(s.time_start)[:5],
                'duration_minutes': s.duration_minutes,
                'teacher_name': s.teacher.get_full_name() if s.teacher else '',
                'spots_left': s.max_bookings - bookings,
                'slot_type': 'manual',
            })

        # 2. Virtual slots from upcoming GroupSessions (no DB write needed)
        # NOTE: course.subject may contain free text (e.g. 'Mathematics'), not the
        # canonical key (e.g. 'ent_math'), so we match by course_type only.
        if subject:
            course_type = SUBJECT_TO_TYPE.get(subject)
            if course_type:
                groups = Group.objects.filter(
                    is_active=True,
                    course__course_type=course_type,
                ).select_related('teacher', 'course')
            else:
                # No course_type mapping — skip group session lookup
                groups = Group.objects.none()

            for group in groups:
                spots = group.max_students - group.current_student_count()
                if spots <= 0:
                    continue

                upcoming_sessions = GroupSession.objects.filter(
                    group=group,
                    scheduled_at__gt=now,
                    status='scheduled',
                ).order_by('scheduled_at')[:5]

                for session in upcoming_sessions:
                    s_date_str = session.scheduled_at.date().isoformat()
                    s_time_str = session.scheduled_at.strftime('%H:%M')

                    # Skip if already covered by a manual TrialSlot at same date/time
                    already_covered = any(
                        d['date'] == s_date_str and d['time_start'] == s_time_str
                        for d in data
                    )
                    if already_covered:
                        continue

                    # Use negative session ID to distinguish from manual slot IDs
                    data.append({
                        'id': -session.id,
                        'session_id': session.id,
                        'date': s_date_str,
                        'time_start': s_time_str,
                        'duration_minutes': session.duration_minutes,
                        'teacher_name': group.teacher.get_full_name() if group.teacher else '',
                        'spots_left': spots,
                        'slot_type': 'group_session',
                    })

        return Response(data)


class BookTrialView(APIView):
    """POST /api/hr/book-trial/ - student books a trial slot.
    Accepts either slot_id (manual TrialSlot) or session_id (GroupSession-based virtual slot)."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from .models import TrialSlot, TrialLessonBooking
        from groups.models import GroupSession

        slot_id = request.data.get('slot_id')
        session_id = request.data.get('session_id')
        subject = request.data.get('subject')
        comment = request.data.get('comment', '')

        if not subject:
            return Response({'error': 'subject is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Check student doesn't already have an active booking
        existing = TrialLessonBooking.objects.filter(
            student=request.user,
            status__in=['new', 'confirmed']
        ).first()
        if existing:
            return Response({'error': 'You already have a pending trial lesson booking'}, status=status.HTTP_400_BAD_REQUEST)

        # ── Case 1: session-based virtual slot (slot_id is negative or session_id provided) ──
        raw_slot_id = slot_id
        if isinstance(slot_id, (int, str)):
            try:
                raw_slot_id = int(slot_id)
            except (ValueError, TypeError):
                raw_slot_id = None

        if session_id or (raw_slot_id is not None and raw_slot_id < 0):
            actual_session_id = session_id or abs(raw_slot_id)
            try:
                session = GroupSession.objects.select_related('group__teacher').get(
                    pk=actual_session_id, status='scheduled'
                )
            except GroupSession.DoesNotExist:
                return Response({'error': 'Session not found or no longer scheduled'}, status=status.HTTP_404_NOT_FOUND)

            group = session.group
            spots = group.max_students - group.current_student_count()
            if spots <= 0:
                return Response({'error': 'This group is now full'}, status=status.HTTP_400_BAD_REQUEST)

            s_date = session.scheduled_at.date()
            s_time = session.scheduled_at.time().replace(second=0, microsecond=0)

            # Get or create a TrialSlot for this session
            slot, _ = TrialSlot.objects.get_or_create(
                date=s_date,
                time_start=s_time,
                teacher=group.teacher,
                subject=subject,
                defaults={
                    'duration_minutes': session.duration_minutes,
                    'max_bookings': spots,
                    'is_active': True,
                }
            )
        else:
            # ── Case 2: manual TrialSlot ──
            if not slot_id:
                return Response({'error': 'slot_id or session_id is required'}, status=status.HTTP_400_BAD_REQUEST)
            try:
                slot = TrialSlot.objects.get(pk=raw_slot_id, is_active=True)
            except TrialSlot.DoesNotExist:
                return Response({'error': 'Slot not found'}, status=status.HTTP_404_NOT_FOUND)

            if not slot.is_available():
                return Response({'error': 'This slot is no longer available'}, status=status.HTTP_400_BAD_REQUEST)

        booking = TrialLessonBooking.objects.create(
            student=request.user,
            slot=slot,
            subject=subject,
            comment=comment,
        )

        return Response({
            'message': 'Trial lesson booked successfully!',
            'booking_id': booking.id,
            'date': slot.date.isoformat(),
            'time': str(slot.time_start)[:5],
        }, status=status.HTTP_201_CREATED)


class MyTrialBookingsView(APIView):
    """GET /api/hr/my-trials/ - student sees their trial bookings"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from .models import TrialLessonBooking
        bookings = TrialLessonBooking.objects.filter(
            student=request.user
        ).select_related('slot__teacher')

        data = [{
            'id': b.id,
            'subject': b.subject,
            'status': b.status,
            'manager_note': b.manager_note,
            'date': b.slot.date.isoformat(),
            'time': str(b.slot.time_start)[:5],
            'duration_minutes': b.slot.duration_minutes,
            'teacher_name': b.slot.teacher.get_full_name() if b.slot.teacher else '',
            'created_at': b.created_at.isoformat(),
        } for b in bookings]

        return Response(data)
    
from .models import Vacancy


class VacancyListView(APIView):
    """GET /api/hr/vacancies/ — public list of active vacancies"""
    permission_classes = [AllowAny]

    def get(self, request):
        vacancies = Vacancy.objects.filter(status='active').order_by('-created_at')
        data = [{
            'id':           v.id,
            'title':        v.title,
            'type':         v.type,
            'subject':      v.subject,
            'description':  v.description,
            'requirements': v.requirements,
            'conditions':   v.conditions,
            'salary':       v.salary,
            'schedule':     v.schedule,
            'status':       v.status,
            'created_at':   v.created_at.isoformat(),
        } for v in vacancies]
        return Response(data)


class VacancyDetailView(APIView):
    """GET /api/hr/vacancies/<pk>/"""
    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            v = Vacancy.objects.get(pk=pk)
        except Vacancy.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
        return Response({
            'id':           v.id,
            'title':        v.title,
            'type':         v.type,
            'subject':      v.subject,
            'description':  v.description,
            'requirements': v.requirements,
            'conditions':   v.conditions,
            'salary':       v.salary,
            'schedule':     v.schedule,
            'status':       v.status,
            'created_at':   v.created_at.isoformat(),
        })


class VacancyManageView(APIView):
    """POST /api/hr/vacancies/manage/ — HR creates vacancy
       PATCH /api/hr/vacancies/manage/?id=<pk> — HR updates
       DELETE /api/hr/vacancies/manage/?id=<pk> — HR deletes"""
    permission_classes = [IsAuthenticated]

    def _check_perm(self, user):
        return user.is_hr() or user.is_admin()

    def post(self, request):
        if not self._check_perm(request.user):
            return Response({'error': 'HR only'}, status=403)

        data = request.data
        v = Vacancy.objects.create(
            title=data.get('title', ''),
            type=data.get('type', 'teacher'),
            subject=data.get('subject', ''),
            description=data.get('description', ''),
            requirements=data.get('requirements', ''),
            conditions=data.get('conditions', ''),
            salary=data.get('salary', ''),
            schedule=data.get('schedule', ''),
            status=data.get('status', 'active'),
            created_by=request.user,
        )
        return Response({'message': 'Вакансия создана', 'id': v.id}, status=201)

    def patch(self, request):
        if not self._check_perm(request.user):
            return Response({'error': 'HR only'}, status=403)

        pk = request.query_params.get('id')
        if not pk:
            return Response({'error': 'id required'}, status=400)

        try:
            v = Vacancy.objects.get(pk=pk)
        except Vacancy.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        fields = ['title', 'type', 'subject', 'description', 'requirements', 'conditions', 'salary', 'schedule', 'status']
        for f in fields:
            if f in request.data:
                setattr(v, f, request.data[f])
        v.save()
        return Response({'message': 'Вакансия обновлена'})

    def delete(self, request):
        if not self._check_perm(request.user):
            return Response({'error': 'HR only'}, status=403)

        pk = request.query_params.get('id')
        if not pk:
            return Response({'error': 'id required'}, status=400)

        try:
            v = Vacancy.objects.get(pk=pk)
            v.delete()
        except Vacancy.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        return Response({'message': 'Вакансия удалена'})