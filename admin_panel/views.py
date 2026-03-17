from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Sum, Count


class AdminStatsView(APIView):
    """GET /api/admin-panel/stats/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_admin():
            return Response({'error': 'Admins only'}, status=403)

        from users.models import User
        from courses.models import CourseEnrollment
        from payments.models import Order
        from groups.models import Group

        total_students  = User.objects.filter(role='student').count()
        total_teachers  = User.objects.filter(role='teacher').count()
        total_groups    = Group.objects.filter(is_active=True).count()
        total_revenue   = Order.objects.filter(status='paid').aggregate(s=Sum('final_amount'))['s'] or 0
        pending_orders  = Order.objects.filter(status='created').count()
        total_enrollments = CourseEnrollment.objects.filter(is_active=True).count()

        return Response({
            'total_students':    total_students,
            'total_teachers':    total_teachers,
            'total_groups':      total_groups,
            'total_revenue':     float(total_revenue),
            'pending_orders':    pending_orders,
            'total_enrollments': total_enrollments,
        })


class AdminUsersView(APIView):
    """GET /api/admin-panel/users/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_admin():
            return Response({'error': 'Admins only'}, status=403)

        from users.models import User
        users = User.objects.all().order_by('-date_joined')[:200]
        data = [{
            'id':         u.id,
            'first_name': u.first_name,
            'last_name':  u.last_name,
            'phone':      u.phone,
            'role':       u.role,
            'is_active':  u.is_active,
            'created_at': u.date_joined.isoformat(),
        } for u in users]
        return Response(data)


class AdminGroupsView(APIView):
    """GET /api/admin-panel/groups/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_admin():
            return Response({'error': 'Admins only'}, status=403)

        from groups.models import Group
        groups = Group.objects.select_related('course', 'teacher').filter(is_active=True)
        data = [{
            'id':            g.id,
            'name':          g.name,
            'course_title':  g.course.title,
            'teacher_name':  f"{g.teacher.first_name} {g.teacher.last_name}" if g.teacher else '—',
            'max_students':  g.max_students,
            'current_count': g.current_student_count(),
            'schedule_days': g.schedule_days,
            'schedule_time': str(g.schedule_time) if g.schedule_time else None,
        } for g in groups]
        return Response(data)


class AdminPaymentsView(APIView):
    """GET /api/admin-panel/payments/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_admin():
            return Response({'error': 'Admins only'}, status=403)

        from payments.models import Order
        orders = Order.objects.select_related('student', 'course').order_by('-created_at')[:100]
        data = [{
            'id':           o.id,
            'student_name': f"{o.student.first_name} {o.student.last_name}",
            'student_phone':o.student.phone,
            'course_title': o.course.title if o.course else (o.package.title if o.package else '—'),
            'amount':       float(o.amount),
            'final_amount': float(o.final_amount),
            'discount':     float(o.discount_applied),
            'status':       o.status,
            'created_at':   o.created_at.isoformat(),
        } for o in orders]
        return Response(data)


class AdminRefundsView(APIView):
    """GET /api/admin-panel/refunds/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_admin():
            return Response({'error': 'Admins only'}, status=403)

        from payments.models import RefundRequest
        refunds = RefundRequest.objects.select_related('student', 'order__course').order_by('-created_at')[:100]
        data = [{
            'id':             r.id,
            'student_name':   f"{r.student.first_name} {r.student.last_name}",
            'student_phone':  r.student.phone,
            'course_title':   r.order.course.title if r.order and r.order.course else '—',
            'order_amount':   float(r.order.final_amount) if r.order else 0,
            'refund_amount':  float(r.refund_amount) if r.refund_amount else None,
            'reason':         r.reason,
            'payment_details':r.payment_details,
            'status':         r.status,
            'finance_note':   r.finance_note or '',
            'statement_file': r.statement_file.url if r.statement_file else None,
            'created_at':     r.created_at.isoformat(),
        } for r in refunds]
        return Response(data)


class AdminHRApplicationsView(APIView):
    """GET /api/admin-panel/hr-applications/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_admin():
            return Response({'error': 'Admins only'}, status=403)

        from hr.models import TeacherApplication
        apps = TeacherApplication.objects.all().order_by('-created_at')
        data = [{
            'id':               a.id,
            'full_name':        a.full_name,
            'phone':            a.phone,
            'subjects':         a.subjects,
            'experience_years': a.experience_years,
            'status':           a.status,
            'hr_note':          a.hr_note or '',
            'resume':           a.resume.url if a.resume else None,
            'diploma':          a.diploma.url if a.diploma else None,
            'created_at':       a.created_at.isoformat(),
        } for a in apps]
        return Response(data)


class AdminGroupChangeRequestsView(APIView):
    """GET /api/admin-panel/group-change-requests/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_admin():
            return Response({'error': 'Admins only'}, status=403)

        from groups.models import GroupChangeRequest
        reqs = GroupChangeRequest.objects.select_related(
            'student', 'current_group', 'requested_group'
        ).order_by('-created_at')
        data = [{
            'id':              r.id,
            'student_name':    f"{r.student.first_name} {r.student.last_name}",
            'student_phone':   r.student.phone,
            'current_group':   r.current_group.name,
            'requested_group': r.requested_group.name if r.requested_group_id else '—',
            'reason':          r.reason,
            'status':          r.status,
            'created_at':      r.created_at.isoformat(),
        } for r in reqs]
        return Response(data)


class AdminGroupChangeActionView(APIView):
    """POST /api/admin-panel/group-change-requests/<id>/approve|reject/"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk, action):
        if not request.user.is_admin():
            return Response({'error': 'Admins only'}, status=403)

        from groups.models import GroupChangeRequest, GroupEnrollment
        try:
            req = GroupChangeRequest.objects.get(pk=pk)
        except GroupChangeRequest.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        if action == 'approve':
            req.status = 'approved'
            req.reviewed_by = request.user
            req.save()
            # Move student to new group if requested_group exists
            if req.requested_group_id:
                GroupEnrollment.objects.filter(
                    student=req.student, group=req.current_group
                ).update(status='left')
                GroupEnrollment.objects.get_or_create(
                    student=req.student, group=req.requested_group,
                    defaults={'status': 'active'}
                )
        elif action == 'reject':
            req.status = 'rejected'
            req.reviewed_by = request.user
            req.save()
        else:
            return Response({'error': 'Invalid action'}, status=400)

        return Response({'message': f'Request {action}d'})