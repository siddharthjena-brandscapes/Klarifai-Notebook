


# backend/urls.py
from django.conf import settings
from django.contrib import admin
from django.urls import path, include
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/ideas/', include('ideaGen.urls')),
    
    path('api/', include('chat.urls')),

    path('api/core/', include('core.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)