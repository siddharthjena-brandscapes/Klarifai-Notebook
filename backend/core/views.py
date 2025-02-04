# core/views.py
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.core.exceptions import PermissionDenied
from .models import Project, ProjectModule, ProjectActivity, DocumentQAModule, IdeaGeneratorModule
from django.db import transaction
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated



@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def create_project(request):
    try:
        with transaction.atomic():
            # Get data from request.data instead of request.POST
            data = request.data
            
            # Extract fields
            name = data.get('name')
            description = data.get('description')
            category = data.get('category')
            selected_modules = data.get('selected_modules', [])
            
            # Validate required fields
            if not all([name, description, category]):
                return JsonResponse({
                    'status': 'error',
                    'message': 'Missing required fields'
                }, status=400)
            
            # Create the project
            project = Project.objects.create(
                name=name,
                description=description,
                category=category,
                user=request.user,
                selected_modules=selected_modules
            )
            
            # Create project modules
            for module_type in selected_modules:
                project_module = ProjectModule.objects.create(
                    project=project,
                    module_type=module_type
                )
                
                # Create specific module instances based on type
                if module_type == 'document-qa':
                    DocumentQAModule.objects.create(project_module=project_module)
                elif module_type == 'idea-generator':
                    IdeaGeneratorModule.objects.create(project_module=project_module)
            
            # Record activity
            ProjectActivity.objects.create(
                project=project,
                activity_type='created',
                description=f'Project "{project.name}" created',
                user=request.user
            )
            
            return JsonResponse({
                'status': 'success',
                'project': {
                    'id': project.id,
                    'name': project.name,
                    'description': project.description,
                    'category': project.category,
                    'created_at': project.created_at.isoformat(),
                    'selected_modules': project.selected_modules
                }
            })
    except Exception as e:
        # Log the full error for debugging
        import traceback
        print(traceback.format_exc())
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)
    
    
@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def project_list(request):
    projects = Project.objects.filter(user=request.user, is_active=True)
    return JsonResponse({
        'projects': [{
            'id': project.id,
            'name': project.name,
            'description': project.description,
            'category': project.category,
            'created_at': project.created_at.isoformat(),
            'selected_modules': project.selected_modules,
            'activities': [{
                'type': activity.activity_type,
                'description': activity.description,
                'created_at': activity.created_at.isoformat()
            } for activity in project.activities.all()[:5]]
        } for project in projects]
    })

@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def project_detail(request, project_id):
    project = get_object_or_404(Project, id=project_id)
    
    if project.user != request.user:
        raise PermissionDenied
    
    return JsonResponse({
        'project': {
            'id': project.id,
            'name': project.name,
            'description': project.description,
            'category': project.category,
            'created_at': project.created_at.isoformat(),
            'selected_modules': project.selected_modules,
            'modules': [{
                'type': module.module_type,
                'data': get_module_data(module)
            } for module in project.modules.all()]
        }
    })

def get_module_data(module):
    if module.module_type == 'document-qa':
        qa_module = module.document_qa
        return {
            'documents': [{
                'id': doc.id,
                'filename': doc.filename
            } for doc in qa_module.documents.all()],
            'chat_histories': [{
                'id': chat.id,
                'title': chat.title
            } for chat in qa_module.chat_histories.all()]
        }
    elif module.module_type == 'idea-generator':
        idea_module = module.idea_generator
        return {
            'product_ideas': [{
                'id': idea.id,
                'product': idea.product,
                'brand': idea.brand
            } for idea in idea_module.product_ideas.all()]
        }
    return {}

@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def delete_project(request, project_id):
    if request.method == 'POST':
        project = get_object_or_404(Project, id=project_id, user=request.user)
        project.is_active = False
        project.save()
        
        ProjectActivity.objects.create(
            project=project,
            activity_type='deleted',
            description=f'Project "{project.name}" deleted',
            user=request.user
        )
        
        return JsonResponse({'status': 'success'})
    
    return JsonResponse({'status': 'error', 'message': 'Invalid request method'})

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import transaction
from .models import Project, ProjectModule

@api_view(['PUT'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def update_project(request, project_id):
    try:
        project = get_object_or_404(Project, id=project_id, user=request.user)
        
        # Update project fields
        project.name = request.data.get('name', project.name)
        project.description = request.data.get('description', project.description)
        project.category = request.data.get('category', project.category)
        
        # Update selected_modules if provided
        if 'selected_modules' in request.data:
            project.selected_modules = request.data['selected_modules']
            
        project.save()
        
        # Record activity
        ProjectActivity.objects.create(
            project=project,
            activity_type='updated',
            description=f'Project "{project.name}" updated',
            user=request.user
        )
        
        return JsonResponse({
            'status': 'success',
            'project': {
                'id': project.id,
                'name': project.name,
                'description': project.description,
                'category': project.category,
                'created_at': project.created_at.isoformat(),
                'selected_modules': project.selected_modules
            }
        })
        
    except Project.DoesNotExist:
        return JsonResponse({
            'status': 'error',
            'message': 'Project not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)