from django.urls import path
from .views import (
    CourseListView, CourseDetailView, PackageListView,
    MyCoursesView, LessonDetailView,
    MarkLessonCompleteView, CourseProgressView,
    AddMaterialView, DeleteMaterialView,
)

urlpatterns = [
    path('', CourseListView.as_view(), name='course-list'),
    path('<int:pk>/', CourseDetailView.as_view(), name='course-detail'),
    path('<int:pk>/progress/', CourseProgressView.as_view(), name='course-progress'),
    path('packages/', PackageListView.as_view(), name='package-list'),
    path('my/', MyCoursesView.as_view(), name='my-courses'),
    path('lessons/<int:pk>/', LessonDetailView.as_view(), name='lesson-detail'),
    path('lessons/<int:pk>/complete/', MarkLessonCompleteView.as_view(), name='lesson-complete'),
    path('lessons/<int:pk>/materials/', AddMaterialView.as_view(), name='add-material'),
    path('materials/<int:pk>/', DeleteMaterialView.as_view(), name='delete-material'),
]
