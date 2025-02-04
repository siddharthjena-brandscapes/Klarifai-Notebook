# core/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('projects/create/', views.create_project, name='create_project'),
    path('projects/', views.project_list, name='project_list'),
    path('projects/<int:project_id>/', views.project_detail, name='project_detail'),
    path('projects/<int:project_id>/delete/', views.delete_project, name='delete_project'),
    path('projects/<int:project_id>/update/', views.update_project, name='update_project'),
]

print("Available URLs:", [str(pattern) for pattern in urlpatterns])