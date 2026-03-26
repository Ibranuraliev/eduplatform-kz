from django.urls import path
from .views import (
    AvailableGroupsView, JoinGroupView, MyGroupsView,
    MyScheduleView, MarkAttendanceView, MarkSessionConductedView,
    ExtendSessionView, GroupChangeRequestView,
    GroupsForCourseView, MyWaitlistView,
    MyGroupsSmartView, MyAttendanceView,
    TeacherSessionsView, CancelSessionView,
    RescheduleSessionView, UpdateSessionLinkView,
    StudentStatsView, GroupCreateView,
)

urlpatterns = [
    path('', AvailableGroupsView.as_view(), name='group-list'),
    path('<int:pk>/join/', JoinGroupView.as_view(), name='join-group'),
    path('my/', MyGroupsView.as_view(), name='my-groups'),
    path('my-groups/', MyGroupsSmartView.as_view(), name='my-groups-smart'),
    path('schedule/', MyScheduleView.as_view(), name='my-schedule'),
    path('attendance/', MarkAttendanceView.as_view(), name='mark-attendance'),
    path('sessions/<int:pk>/conducted/', MarkSessionConductedView.as_view(), name='session-conducted'),
    path('sessions/<int:pk>/extend/', ExtendSessionView.as_view(), name='session-extend'),
    path('change-request/', GroupChangeRequestView.as_view(), name='group-change-request'),
    path('for-course/<int:course_id>/', GroupsForCourseView.as_view(), name='groups-for-course'),
    path('waitlist/', MyWaitlistView.as_view(), name='my-waitlist'),
    path('teacher-sessions/', TeacherSessionsView.as_view(), name='teacher-sessions'),
    path('sessions/<int:pk>/cancel/', CancelSessionView.as_view(), name='cancel-session'),
    path('sessions/<int:pk>/reschedule/', RescheduleSessionView.as_view(), name='reschedule-session'),
    path('sessions/<int:pk>/link/', UpdateSessionLinkView.as_view(), name='update-session-link'),
    path('student-stats/', StudentStatsView.as_view(), name='student-stats'),
    path('create/', GroupCreateView.as_view(), name='group-create'),
    path('my-attendance/', MyAttendanceView.as_view(), name='my-attendance'),
]
