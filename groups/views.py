from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import Group, GroupEnrollment, GroupSession, Attendance, GroupChangeRequest, WaitlistEntry
from .serializers import (
    GroupSerializer, GroupEnrollmentSerializer, GroupSessionSerializer,
    AttendanceSerializer, GroupChangeRequestSerializer, WaitlistSerializer
)
from courses.models import CourseEnrollment


class AvailableGroupsView(generics.ListAPIView):
    serializer_class = GroupSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        course_id = self.request.query_params.get('course')
        qs = Group.objects.filter(is_active=True)
        if course_id:
            qs = qs.filter(course_id=course_id)
        return qs


class JoinGroupView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            group = Group.objects.get(pk=pk, is_active=True)
        except Group.DoesNotExist:
            return Response({'error': 'Group not found'}, status=status.HTTP_404_NOT_FOUND)

        student = request.user

        if not CourseEnrollment.objects.filter(student=student, course=group.course, is_active=True).exists():
            return Response({'error': 'You must purchase this course first'}, status=status.HTTP_403_FORBIDDEN)

        if GroupEnrollment.objects.filter(student=student, group__course=group.course, status='active').exists():
            return Response({'error': 'You are already in a group for this course'}, status=status.HTTP_400_BAD_REQUEST)

        if group.is_full():
            WaitlistEntry.objects.get_or_create(student=student, group=group)
            return Response({'message': 'Group is full. You have been added to the waitlist.'})

        GroupEnrollment.objects.create(student=student, group=group, status='active')
        return Response({'message': f'Successfully joined group: {group.name}'})


class MyGroupsView(generics.ListAPIView):
    serializer_class = GroupEnrollmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return GroupEnrollment.objects.filter(student=self.request.user, status='active')


class MyGroupsSmartView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role == 'teacher':
            groups = Group.objects.filter(teacher=user, is_active=True).select_related('course')
            result = []
            for g in groups:
                enrollments = g.enrollments.filter(status='active').select_related('student')
                meet_link = ''
                if hasattr(user, 'teacherprofile'):
                    meet_link = user.teacherprofile.meet_link or ''

                # Build deduplicated sessions with lesson data and materials
                group_sessions = GroupSession.objects.filter(
                    group=g, lesson__isnull=False
                ).select_related('lesson').prefetch_related('lesson__materials').order_by('scheduled_at')
                seen_lesson_ids = set()
                sessions_data = []
                for s in group_sessions:
                    if s.lesson_id not in seen_lesson_ids:
                        seen_lesson_ids.add(s.lesson_id)
                        sessions_data.append({
                            'id': s.id,
                            'lesson': s.lesson_id,
                            'lesson_title': s.lesson.title,
                            'lesson_materials': [
                                {
                                    'id': m.id,
                                    'title': m.title,
                                    'material_type': m.material_type,
                                    'link': m.link or '',
                                }
                                for m in s.lesson.materials.all()
                            ],
                        })

                result.append({
                    'id': g.id,
                    'name': g.name,
                    'is_active': g.is_active,
                    'max_students': g.max_students,
                    'schedule_days': g.schedule_days or '',
                    'schedule_time': str(g.schedule_time) if g.schedule_time else '',
                    'course': {'id': g.course.id, 'title': g.course.title, 'course_type': g.course.course_type} if g.course else None,
                    'teacher_profile': {'meet_link': meet_link},
                    'enrollments': [
                        {'id': e.id, 'status': e.status, 'student': {
                            'id': e.student.id,
                            'first_name': e.student.first_name,
                            'last_name': e.student.last_name,
                            'phone': e.student.phone,
                        }} for e in enrollments
                    ],
                    'sessions': sessions_data,
                })
            return Response(result)
        else:
            enrs = GroupEnrollment.objects.filter(student=user, status='active').select_related('group__course', 'group__teacher')
            return Response(GroupEnrollmentSerializer(enrs, many=True).data)




class MyScheduleView(generics.ListAPIView):
    serializer_class = GroupSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        include_past = self.request.query_params.get('include_past', 'false') == 'true'
    
        if user.is_teacher():
            qs = GroupSession.objects.filter(group__in=user.teaching_groups.all())
        else:
            student_groups = GroupEnrollment.objects.filter(
                student=user, status='active'
            ).values_list('group_id', flat=True)
            qs = GroupSession.objects.filter(group_id__in=student_groups)
    
        if not include_past:
            qs = qs.filter(scheduled_at__gte=timezone.now())
    
        return qs.order_by('scheduled_at')
    

class MarkAttendanceView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not request.user.is_teacher() and not request.user.is_admin():
            return Response({'error': 'Only teachers can mark attendance'}, status=403)

        # Поддержка массива records (из TeacherDashboard)
        records = request.data.get('records', [])
        if not records:
            # Старый формат — одна запись
            session_id  = request.data.get('session_id')
            student_id  = request.data.get('student_id')
            att_status  = request.data.get('status', 'present')
            if not session_id or not student_id:
                return Response({'error': 'session_id and student_id are required'}, status=400)
            records = [{'session_id': session_id, 'student_id': student_id, 'is_present': att_status == 'present'}]

        saved = []
        for r in records:
            att, _ = Attendance.objects.update_or_create(
                session_id=r['session_id'],
                student_id=r['student_id'],
                defaults={'status': 'present' if r.get('is_present') else 'absent'}
            )
            saved.append(att.id)

        return Response({'message': 'Attendance saved', 'count': len(saved)})


class MarkSessionConductedView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if not request.user.is_teacher() and not request.user.is_admin():
            return Response({'error': 'Only teachers can mark sessions as conducted'}, status=status.HTTP_403_FORBIDDEN)
        try:
            session = GroupSession.objects.get(pk=pk)
        except GroupSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)
        session.is_conducted = True
        session.conducted_at = timezone.now()
        session.status = 'conducted'
        session.save()
        return Response({'message': 'Session marked as conducted'})


class ExtendSessionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if not request.user.is_teacher():
            return Response({'error': 'Only teachers can extend sessions'}, status=status.HTTP_403_FORBIDDEN)
        try:
            session = GroupSession.objects.get(pk=pk)
        except GroupSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)
        session.access_extended = True
        session.save()
        return Response({'message': 'Session extended by 15 minutes'})


class GroupChangeRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        student = request.user
        reason = request.data.get('reason', '')

        if not reason.strip():
            return Response({'error': 'Reason is required'}, status=400)

        # Найти текущую активную группу студента
        enrollment = GroupEnrollment.objects.filter(
            student=student, status='active'
        ).select_related('group').first()

        if not enrollment:
            return Response({'error': 'You are not enrolled in any group'}, status=400)

        current_group = enrollment.group

        # Проверить нет ли уже активной заявки
        if GroupChangeRequest.objects.filter(
            student=student,
            current_group=current_group,
            status__in=['created', 'in_review']
        ).exists():
            return Response({'error': 'You already have a pending group change request'}, status=400)

        change_request = GroupChangeRequest.objects.create(
            student=student,
            current_group=current_group,
            requested_group=current_group,  # admin выберет новую группу вручную
            reason=reason
        )
        return Response({
            'message': 'Group change request submitted',
            'request_id': change_request.id,
            'status': 'created'
        })


class GroupsForCourseView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, course_id):
        student = request.user
        groups = Group.objects.filter(course_id=course_id, is_active=True).select_related('course', 'teacher')

        existing = GroupEnrollment.objects.filter(
            student=student, group__course_id=course_id, status='active'
        ).select_related('group').first()

        waitlisted = WaitlistEntry.objects.filter(student=student, group__course_id=course_id).first()

        data = []
        for g in groups:
            upcoming = GroupSession.objects.filter(group=g, scheduled_at__gte=timezone.now()).order_by('scheduled_at')[:3]
            is_wl = WaitlistEntry.objects.filter(student=student, group=g).exists()
            data.append({
                'id': g.id,
                'name': g.name,
                'teacher_name': g.teacher.get_full_name() if g.teacher else '—',
                'max_students': g.max_students,
                'student_count': g.current_student_count(),
                'is_full': g.is_full(),
                'is_waitlisted': is_wl,
                'schedule_days': g.schedule_days or '',
                'schedule_time': str(g.schedule_time) if g.schedule_time else '',
                'upcoming_sessions': [
                    {'id': s.id, 'scheduled_at': s.scheduled_at.isoformat(),
                     'duration_minutes': s.duration_minutes,
                     'lesson_title': s.lesson.title if s.lesson else None}
                    for s in upcoming
                ],
            })

        return Response({
            'groups': data,
            'already_enrolled': GroupEnrollmentSerializer(existing).data if existing else None,
            'waitlisted_group_id': waitlisted.group_id if waitlisted else None,
        })


class MyWaitlistView(generics.ListAPIView):
    serializer_class = WaitlistSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return WaitlistEntry.objects.filter(student=self.request.user)


class MyAttendanceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        records = Attendance.objects.filter(student=request.user).select_related('session__group').order_by('-session__scheduled_at')
        data = [
            {'id': a.id, 'session_id': a.session.id, 'group_name': a.session.group.name,
             'scheduled_at': a.session.scheduled_at.isoformat(), 'is_present': a.status == 'present', 'status': a.status}
            for a in records
        ]
        return Response(data)
class TeacherSessionsView(APIView):
    """GET /api/groups/teacher-sessions/?days=14
    Returns all sessions for teacher's groups in the next N days"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_teacher() and not request.user.is_admin():
            return Response({'error': 'Teachers only'}, status=403)

        days = int(request.query_params.get('days', 14))
        now = timezone.now()
        end = now + timezone.timedelta(days=days)

        sessions = GroupSession.objects.filter(
            group__teacher=request.user,
            scheduled_at__gte=now,
            scheduled_at__lte=end,
        ).select_related('group', 'group__course').order_by('scheduled_at')

        data = [{
            'id':             s.id,
            'group_id':       s.group.id,
            'group_name':     s.group.name,
            'course_title':   s.group.course.title,
            'scheduled_at':   s.scheduled_at.isoformat(),
            'duration_minutes': s.duration_minutes,
            'status':         s.status,
            'meet_link':      s.meet_link,
            'is_conducted':   s.is_conducted,
            'student_count':  s.group.current_student_count(),
        } for s in sessions]

        return Response(data)


class CancelSessionView(APIView):
    """POST /api/groups/sessions/<pk>/cancel/"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            session = GroupSession.objects.select_related('group').get(pk=pk)
        except GroupSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=404)

        if not request.user.is_admin() and session.group.teacher != request.user:
            return Response({'error': 'Not your session'}, status=403)

        session.status = 'cancelled'
        session.save()

        # Send notification to all students in the group
        from notifications.models import Notification
        enrollments = session.group.enrollments.filter(status='active').select_related('student')
        for e in enrollments:
            Notification.objects.create(
                user=e.student,
                title='Урок отменён',
                message=f'Урок группы {session.group.name} '
                        f'({session.scheduled_at.strftime("%d.%m %H:%M")}) отменён.',
                type='warning',
            )

        return Response({'message': 'Session cancelled'})


class RescheduleSessionView(APIView):
    """POST /api/groups/sessions/<pk>/reschedule/
    Body: { new_datetime: '2026-03-10T18:00:00', meet_link: '...' }"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            session = GroupSession.objects.select_related('group').get(pk=pk)
        except GroupSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=404)

        if not request.user.is_admin() and session.group.teacher != request.user:
            return Response({'error': 'Not your session'}, status=403)

        new_dt_str = request.data.get('new_datetime')
        meet_link  = request.data.get('meet_link', session.meet_link)

        if not new_dt_str:
            return Response({'error': 'new_datetime is required'}, status=400)

        try:
            from django.utils.dateparse import parse_datetime
            new_dt = parse_datetime(new_dt_str)
            if new_dt is None:
                raise ValueError
        except (ValueError, TypeError):
            return Response({'error': 'Invalid datetime format. Use ISO 8601.'}, status=400)

        old_dt = session.scheduled_at
        session.scheduled_at = timezone.make_aware(new_dt) if timezone.is_naive(new_dt) else new_dt
        session.status = 'rescheduled'
        session.meet_link = meet_link
        session.save()

        # Notify students
        from notifications.models import Notification
        enrollments = session.group.enrollments.filter(status='active').select_related('student')
        for e in enrollments:
            Notification.objects.create(
                user=e.student,
                title='Урок перенесён',
                message=f'Урок группы {session.group.name} перенесён с '
                        f'{old_dt.strftime("%d.%m %H:%M")} на '
                        f'{session.scheduled_at.strftime("%d.%m %H:%M")}.',
                type='info',
            )

        return Response({'message': 'Session rescheduled', 'new_datetime': session.scheduled_at.isoformat()})


class UpdateSessionLinkView(APIView):
    """PATCH /api/groups/sessions/<pk>/link/
    Body: { meet_link: 'https://zoom.us/...' }"""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            session = GroupSession.objects.select_related('group').get(pk=pk)
        except GroupSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=404)

        if not request.user.is_admin() and session.group.teacher != request.user:
            return Response({'error': 'Not your session'}, status=403)

        meet_link = request.data.get('meet_link', '').strip()
        session.meet_link = meet_link
        session.save()

        return Response({'message': 'Link updated', 'meet_link': meet_link})

class GroupCreateView(APIView):
    """POST /api/groups/create/ — teacher (or admin) creates a new group"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role not in ('teacher', 'admin'):
            return Response({'error': 'Teachers and admins only'}, status=status.HTTP_403_FORBIDDEN)

        from courses.models import Course

        name          = request.data.get('name', '').strip()
        course_id     = request.data.get('course_id')
        max_students  = int(request.data.get('max_students', 15))
        schedule_days = request.data.get('schedule_days', '').strip()
        schedule_time = request.data.get('schedule_time', '').strip() or None

        if not name:
            return Response({'error': 'Название группы обязательно'}, status=status.HTTP_400_BAD_REQUEST)
        if not course_id:
            return Response({'error': 'course_id обязателен'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            course = Course.objects.get(pk=course_id, is_active=True)
        except Course.DoesNotExist:
            return Response({'error': 'Курс не найден'}, status=status.HTTP_404_NOT_FOUND)

        teacher = request.user if request.user.role == 'teacher' else None

        group = Group.objects.create(
            name=name,
            course=course,
            teacher=teacher,
            max_students=max_students,
            schedule_days=schedule_days,
            schedule_time=schedule_time,
            is_active=True,
        )

        return Response({
            'id':           group.id,
            'name':         group.name,
            'course':       {'id': course.id, 'title': course.title, 'course_type': course.course_type},
            'max_students': group.max_students,
            'schedule_days': group.schedule_days or '',
            'schedule_time': str(group.schedule_time) if group.schedule_time else '',
        }, status=status.HTTP_201_CREATED)


class StudentStatsView(APIView):
    """GET /api/groups/student-stats/ — teacher gets stats for all their students"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'teacher':
            return Response({'error': 'Teachers only'}, status=status.HTTP_403_FORBIDDEN)

        from django.db.models import Avg
        from homework.models import HomeworkSubmission
        from tests.models import TestAttempt

        groups = Group.objects.filter(teacher=request.user, is_active=True)
        stats = []

        for group in groups:
            enrollments = group.enrollments.filter(status='active').select_related('student')
            lesson_ids = list(
                GroupSession.objects.filter(group=group, lesson__isnull=False)
                .values_list('lesson_id', flat=True)
            )
            total_sessions = GroupSession.objects.filter(group=group, is_conducted=True).count()

            for enr in enrollments:
                student = enr.student

                attended = Attendance.objects.filter(
                    session__group=group, student=student, status='present'
                ).count()
                attendance_pct = round(attended / total_sessions * 100) if total_sessions > 0 else None

                hw_subs = HomeworkSubmission.objects.filter(
                    student=student, homework__lesson_id__in=lesson_ids
                )
                hw_accepted = hw_subs.filter(status='accepted').count()
                hw_total = hw_subs.count()

                test_attempts = TestAttempt.objects.filter(
                    student=student, test__lesson_id__in=lesson_ids, status='completed'
                )
                avg_score = test_attempts.aggregate(avg=Avg('score'))['avg']

                stats.append({
                    'student_id': student.id,
                    'student_name': student.get_full_name(),
                    'student_phone': student.phone,
                    'group_id': group.id,
                    'group_name': group.name,
                    'attendance_percent': attendance_pct,
                    'attended': attended,
                    'total_sessions': total_sessions,
                    'hw_accepted': hw_accepted,
                    'hw_total': hw_total,
                    'avg_test_score': round(float(avg_score), 1) if avg_score else None,
                })

        return Response(stats)
