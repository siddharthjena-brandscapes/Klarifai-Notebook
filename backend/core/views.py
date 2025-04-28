# core/views.py
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.core.exceptions import PermissionDenied
from .models import Project, ProjectModule, DocumentQAModule, IdeaGeneratorModule
from django.db import transaction
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from .utils import update_project_timestamp

import tempfile
import os
import fitz  # PyMuPDF for PDF handling
from pptx import Presentation
import google.generativeai as genai
 
 
@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def archive_project(request, project_id):
    """Archive a project by setting is_active to False"""
    try:
        project = get_object_or_404(Project, id=project_id, user=request.user)
        project.is_active = False
        project.save()
        
        return JsonResponse({
            'status': 'success',
            'message': f'Project "{project.name}" has been archived successfully',
            'project_id': project.id
        })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)


@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def unarchive_project(request, project_id):
    """Restore a project from archive by setting is_active to True"""
    try:
        # Find the project even if it's archived (is_active=False)
        project = get_object_or_404(Project, id=project_id, user=request.user)
        project.is_active = True
        project.save()
        
        return JsonResponse({
            'status': 'success',
            'message': f'Project "{project.name}" has been restored successfully',
            'project_id': project.id
        })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)


@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def archived_projects(request):
    """Get a list of all archived projects"""
    projects = Project.objects.filter(user=request.user, is_active=False)
    return JsonResponse({
        'projects': [{
            'id': project.id,
            'name': project.name,
            'description': project.description,
            'category': project.category,
            'created_at': project.created_at.isoformat(),
            'updated_at': project.updated_at.isoformat(),
            'selected_modules': project.selected_modules,
        } for project in projects]
    })
@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def enhance_prompt_with_ai(request):
    try:
        # Get the user-written prompt from the request
        data = request.data
        user_prompt = data.get('prompt', '')
       
        if not user_prompt or len(user_prompt.strip()) < 10:
            return JsonResponse({
                'status': 'error',
                'message': 'Please provide a more detailed initial description (at least 10 characters).'
            }, status=400)
       
        # Initialize Gemini model
        model = initialize_gemini()
        if not model:
            return JsonResponse({
                'status': 'error',
                'message': 'Failed to initialize AI model.'
            }, status=500)
       
        # Create prompt for enhancing the user's input
        ai_prompt = f"""
        You are an expert at improving and enhancing text descriptions for AI projects.
        Please enhance and expand the following project description to make it more detailed,
        well-structured, and effective. Maintain the original intent and key points, but
        make it more professional, clear, and comprehensive.
       
        Original description:
        ---
        {user_prompt}
        ---
       
        Please provide an enhanced version that:
        1. Is well-organized with clear structure
        2. Expands on key concepts
        3. Uses professional language
        4. Provides more context where helpful
        5. Is comprehensive but concise
        """
       
        # Generate the enhanced prompt
        try:
            response = model.generate_content(ai_prompt)
            enhanced_prompt = response.text
           
            return JsonResponse({
                'status': 'success',
                'enhanced_prompt': enhanced_prompt
            })
        except Exception as e:
            print(f"Error generating enhanced prompt: {str(e)}")
            return JsonResponse({
                'status': 'error',
                'message': 'Failed to enhance the prompt. Please try again or use the original description.'
            }, status=500)
           
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)
 
 
@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def upload_document_for_prompt(request):
    try:
        if 'document' not in request.FILES:
            return JsonResponse({
                'status': 'error',
                'message': 'No document file provided'
            }, status=400)
       
        document_file = request.FILES['document']
        file_name = document_file.name.lower()
       
        # Extract text based on file type
        if file_name.endswith('.pdf'):
            document_text = extract_text_from_pdf(document_file)
        elif file_name.endswith(('.pptx', '.ppt')):
            document_text = extract_text_from_ppt(document_file)
        elif file_name.endswith('.txt'):
            document_text = extract_text_from_txt(document_file)
        else:
            return JsonResponse({
                'status': 'error',
                'message': 'Unsupported file format. Please upload PDF, PPTX, or TXT files.'
            }, status=400)
       
        # Generate prompt from document content
        generated_prompt = generate_prompt(document_text)
       
        return JsonResponse({
            'status': 'success',
            'prompt': generated_prompt
        })
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)
 
# Helper functions for document processing
 
def extract_text_from_pdf(pdf_file):
    with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
        tmp_file.write(pdf_file.read())
        tmp_path = tmp_file.name
   
    doc = fitz.open(tmp_path)
    text = ""
    for page in doc:
        text += page.get_text()
   
    os.unlink(tmp_path)  # Delete temp file
    return text
 
def extract_text_from_ppt(ppt_file):
    with tempfile.NamedTemporaryFile(delete=False, suffix='.pptx') as tmp_file:
        tmp_file.write(ppt_file.read())
        tmp_path = tmp_file.name
   
    presentation = Presentation(tmp_path)
    text = ""
   
    for slide in presentation.slides:
        for shape in slide.shapes:
            if hasattr(shape, "text"):
                text += shape.text + "\n"
   
    os.unlink(tmp_path)  # Delete temp file
    return text

def extract_text_from_txt(txt_file):
    # For text files, we can simply read the content directly
    text = txt_file.read()
    
    # Decode bytes to string if necessary
    if isinstance(text, bytes):
        text = text.decode('utf-8', errors='replace')
        
    return text
 
def initialize_gemini():
    api_key = "AIzaSyC5Dqjx0DLbkRXH9YWqWZ1SPTK0w0C4oFY"  # In production, get this from settings or env vars
   
    if not api_key:
        return None
   
    genai.configure(api_key=api_key)
    return genai.GenerativeModel('gemini-1.5-pro')
 
def generate_prompt(document_text):
    model = initialize_gemini()
    if not model:
        return "Failed to initialize AI model. Please provide a description manually."
   
    prompt = """
    You are an assistant that creates effective prompts based on document content.
    Create a detailed, well-structured prompt that captures the key information from the document.
    The prompt should be designed to help a chatbot provide relevant and accurate responses about the document's content.
    Structure the prompt in a way that guides the chatbot to understand the document's main topics, key points, and important details.
    dont write anything like prmopt for chatbot: (in the heading ), just write the prompt
   
    Create a prompt based on the following document content:
   
    """
   
    prompt += document_text[:8000]
   
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Error generating prompt: {str(e)}")
        return "Failed to generate prompt. Please provide a description manually."



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
            if not all([name, category]):
                return JsonResponse({
                    'status': 'error',
                    'message': 'Missing required fields'
                }, status=400)
            
            # Check if project with same name already exists for this user
            if Project.objects.filter(user=request.user, name=name).exists():
                return JsonResponse({
                    'status': 'error',
                    'message': 'Project with this name already exists for your account'
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
            
            
            return JsonResponse({
                'status': 'success',
                'project': {
                    'id': project.id,
                    'name': project.name,
                    'description': project.description,
                    'category': project.category,
                    'created_at': project.created_at.isoformat(),
                    'updated_at': project.updated_at.isoformat(),
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
            'updated_at': project.updated_at.isoformat(),
            'selected_modules': project.selected_modules,
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
            'updated_at': project.updated_at.isoformat(),
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
        project_name = project.name  # Store project name before deleting
        project.delete()  # Permanently delete the project
           
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

        update_project_timestamp(project_id, request.user)
        
        return JsonResponse({
            'status': 'success',
            'project': {
                'id': project.id,
                'name': project.name,
                'description': project.description,
                'category': project.category,
                'created_at': project.created_at.isoformat(),
                'updated_at': project.updated_at.isoformat(),
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