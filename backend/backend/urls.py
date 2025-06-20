


# backend/urls.py
from django.conf import settings
from django.contrib import admin
from django.urls import path, include
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/ideas/', include('ideaGen.urls')), #Ideagen Module
    
    path('api/', include('chat.urls',)), #Doc Q/A module
    path('api/notebook/', include('notebook.urls')), #Notebook Module

    path('api/core/', include('core.urls')), #Core project module
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)