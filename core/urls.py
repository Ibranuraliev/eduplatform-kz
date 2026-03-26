from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/users/', include('users.urls')),
    path('api/courses/', include('courses.urls')),
    path('api/groups/', include('groups.urls')),
    path('api/homework/', include('homework.urls')),
    path('api/tests/', include('tests.urls')),
    path('api/payments/', include('payments.urls')),
    path('api/hr/', include('hr.urls')),
    path('api/admin-panel/', include('admin_panel.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/chat/', include('chat.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
