# core/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('projects/create/', views.create_project, name='create_project'),
    path('projects/', views.project_list, name='project_list'),
    path('projects/<int:project_id>/', views.project_detail, name='project_detail'),
    path('projects/<int:project_id>/delete/', views.delete_project, name='delete_project'),
    path('projects/<int:project_id>/update/', views.update_project, name='update_project'),
    # New URL pattern for document upload
    path('projects/upload-document-for-prompt/', views.upload_document_for_prompt, name='upload_document_for_prompt'),
    path('projects/enhance-prompt/', views.enhance_prompt_with_ai, name='enhance_prompt_with_ai'),
   path('projects/<int:project_id>/archive/', views.archive_project, name='archive_project'),
path('projects/<int:project_id>/unarchive/', views.unarchive_project, name='unarchive_project'),
path('projects/archived/', views.archived_projects, name='archived_projects'),
]

print("Available URLs:", [str(pattern) for pattern in urlpatterns])