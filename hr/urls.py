from django.urls import path
from .views import (
    ApplyAsTeacherView, ApplicationListView, ReviewApplicationView,
    TeacherProfileView, TeacherListView, RecordLatenessView,
    StudentProgressView,
    TrialLessonRequestView, TrialLessonListView,
    TrialSlotsView, BookTrialView, MyTrialBookingsView,
    VacancyListView, VacancyDetailView, VacancyManageView
)

urlpatterns = [
    path('apply/', ApplyAsTeacherView.as_view(), name='teacher-apply'),
    path('applications/', ApplicationListView.as_view(), name='application-list'),
    path('applications/review/', ReviewApplicationView.as_view(), name='review-application'),
    path('profile/', TeacherProfileView.as_view(), name='teacher-profile'),
    path('teachers/', TeacherListView.as_view(), name='teacher-list'),
    path('lateness/', RecordLatenessView.as_view(), name='record-lateness'),
    path('progress/', StudentProgressView.as_view(), name='student-progress'),
    path('progress/<int:student_id>/', StudentProgressView.as_view(), name='student-progress-detail'),

    # Trial lessons
    path('trial/', TrialLessonRequestView.as_view(), name='trial-request'),
    path('trials/', TrialLessonListView.as_view(), name='trial-list'),
    path('slots/', TrialSlotsView.as_view(), name='trial-slots'),
    path('book-trial/', BookTrialView.as_view(), name='book-trial'),
    path('my-trials/', MyTrialBookingsView.as_view(), name='my-trials'),

    # Vacancies
    path('vacancies/', VacancyListView.as_view(), name='vacancy-list'),
    path('vacancies/all/', VacancyListView.as_view(), name='vacancy-list-all'),  # HR видит все
    path('vacancies/manage/', VacancyManageView.as_view(), name='vacancy-manage'),
    path('vacancies/<int:pk>/', VacancyDetailView.as_view(), name='vacancy-detail'),
]