#views.py original
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated, AllowAny  
import faiss
import numpy as np
import os
import pickle
import re
from datetime import datetime
from django.core.files.storage import default_storage
from django.conf import settings
import google.generativeai as genai  
from .models import (
    ChatHistory,
    ChatMessage,
    Document,
    ProcessedIndex,
    UserAPITokens,
    ConversationMemoryBuffer,
    UserModulePermissions
)
import uuid
from rest_framework.authtoken.models import Token
from django.utils.safestring import mark_safe
import logging
from .models import UserProfile
logger = logging.getLogger(__name__)
from core.models import Project
from openai import OpenAI
from dotenv import load_dotenv
import os
import json
import csv
from io import StringIO, BytesIO
from django.http import HttpResponse, FileResponse
from django.utils import timezone
from django.utils.html import strip_tags
from django.shortcuts import get_object_or_404
from django.contrib.auth import update_session_auth_hash
from llama_parse import LlamaParse


load_dotenv()

OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

if not OPENAI_API_KEY:
    raise ValueError("Missing required API keys in environment variables")



client = OpenAI(api_key=OPENAI_API_KEY)

# Configure Google Generative AI
GOOGLE_API_KEY = "AIzaSyDOKm5KYY6LjLa20IbZg027fQauwyMOKWQ"
genai.configure(api_key=GOOGLE_API_KEY)
# model = genai.GenerativeModel('gemini-1.5-flash')
GENERATIVE_MODEL = genai.GenerativeModel('gemini-1.5-flash', 
    generation_config={
        'temperature': 0.7,
        'max_output_tokens': 1024
    },
    safety_settings={
        genai.types.HarmCategory.HARM_CATEGORY_HATE_SPEECH: genai.types.HarmBlockThreshold.BLOCK_NONE,
        genai.types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: genai.types.HarmBlockThreshold.BLOCK_NONE,
        genai.types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: genai.types.HarmBlockThreshold.BLOCK_NONE,
        genai.types.HarmCategory.HARM_CATEGORY_HARASSMENT: genai.types.HarmBlockThreshold.BLOCK_NONE
    }
)

class SignupView(APIView):
    # Explicitly set permission to allow any user (including unauthenticated)
    permission_classes = [AllowAny]
    authentication_classes = []  # Disable authentication checks

    def post(self, request):
        # Extract data from request
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        huggingface_token = request.data.get('huggingface_token', '')
        gemini_token = request.data.get('gemini_token', '')
        llama_token = request.data.get('llama_token', '')  # New field for Llama API token

        # Validate input
        if not username or not email or not password:
            return Response({
                'error': 'Please provide username, email, and password'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check if user already exists
        if User.objects.filter(username=username).exists():
            return Response({
                'error': 'Username already exists'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Create new user
        try:
            user = User.objects.create_user(
                username=username, 
                email=email, 
                password=password
            )
            
            # Create API tokens record
            UserAPITokens.objects.create(
                user=user,
                huggingface_token=huggingface_token,
                gemini_token=gemini_token,
                llama_token=llama_token  # Save the Llama API token
            )
            
            # Generate token for the new user
            token, _ = Token.objects.get_or_create(user=user)
            
            return Response({
                'message': 'User created successfully',
                'token': token.key,
                'username': user.username
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class LoginView(APIView):
    # Explicitly set permission to allow any user (including unauthenticated)
    permission_classes = [AllowAny]
    authentication_classes = []  # Disable authentication checks

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        # Validate input
        if not username or not password:
            return Response({
                'error': 'Please provide username and password'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Authenticate user
        user = authenticate(username=username, password=password)

        if user:
            # Generate or get existing token
            token, _ = Token.objects.get_or_create(user=user)
            
            return Response({
                'token': token.key,
                'username': user.username
            }, status=status.HTTP_200_OK)
        
        return Response({
            'error': 'Invalid credentials'
        }, status=status.HTTP_401_UNAUTHORIZED)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]
 
    def post(self, request):
        user = request.user
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
 
        if not current_password or not new_password:
            return Response({'message': 'Both current and new password are required'}, status=status.HTTP_400_BAD_REQUEST)
 
        if not user.check_password(current_password):  # Use user.check_password()
            return Response({'message': 'Current password is incorrect'}, status=status.HTTP_400_BAD_REQUEST)
 
        user.set_password(new_password)
        user.save()
        update_session_auth_hash(request, user)  # Important: Keep user logged in
 
        return Response({'message': 'Password updated successfully'}, status=status.HTTP_200_OK)

#new
class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def get(self, request):
        user = request.user
        try:
            profile = UserProfile.objects.get(user=user)
            if profile.profile_picture:
                profile_picture = request.build_absolute_uri(profile.profile_picture.url)
            else:
                profile_picture = f'https://ui-avatars.com/api/?name={user.username}&background=random'
        except UserProfile.DoesNotExist:
            profile_picture = f'https://ui-avatars.com/api/?name={user.username}&background=random'


         # Get module permissions data
        try:
            module_permissions = user.module_permissions.disabled_modules
        except (AttributeError, UserModulePermissions.DoesNotExist):
            # Create module permissions if they don't exist
            module_permissions = {}
            UserModulePermissions.objects.create(user=user, disabled_modules={})

        
        return Response({
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'profile_picture': profile_picture,
            'date_joined': user.date_joined,
             'disabled_modules': module_permissions
        }, status=status.HTTP_200_OK)

    def post(self, request):
        try:
            user = request.user
            profile_picture = request.FILES.get('profile_picture')
            
            if not profile_picture:
                return Response({
                    'error': 'No profile picture provided'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate file type
            allowed_types = ['image/jpeg', 'image/png', 'image/gif']
            if profile_picture.content_type not in allowed_types:
                return Response({
                    'error': 'Invalid file type. Only JPG, PNG, and GIF are allowed.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate file size (2MB limit)
            if profile_picture.size > 2 * 1024 * 1024:
                return Response({
                    'error': 'File size too large. Maximum size is 2MB.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get or create profile
            profile, created = UserProfile.objects.get_or_create(user=user)
            
            # Delete old profile picture if it exists
            if profile.profile_picture:
                try:
                    old_file_path = profile.profile_picture.path
                    if os.path.exists(old_file_path):
                        os.remove(old_file_path)
                except Exception as e:
                    print(f"Error deleting old profile picture: {e}")
            
            # Generate unique filename
            file_extension = os.path.splitext(profile_picture.name)[1]
            unique_filename = f"{user.username}_{uuid.uuid4().hex[:8]}{file_extension}"
            
            # Save the new profile picture
            profile.profile_picture.save(
                unique_filename,
                profile_picture,
                save=True
            )
            
            # Build the full URL
            profile_picture_url = request.build_absolute_uri(profile.profile_picture.url)
            
            return Response({
                'message': 'Profile picture updated successfully',
                'profile_picture': profile_picture_url
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class GetUserDocumentsView(APIView):
    def get(self, request):
        try:
            user = request.user
            main_project_id = request.query_params.get('main_project_id')
            print(f"Getting documents for user {user.username} and project {main_project_id}")
            if not main_project_id:
                return Response({
                    'error': 'Main project ID is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            documents = Document.objects.filter(user=user, main_project_id=main_project_id).select_related('processedindex')
        
            document_list = []
            for doc in documents:
                try:
                    processed = doc.processedindex
                    document_data = {
                        'id': doc.id,
                        'filename': doc.filename,
                        'uploaded_at': doc.uploaded_at.strftime('%Y-%m-%d %H:%M'),
                        'summary': processed.summary,
                        'follow_up_questions': [
                            processed.follow_up_question_1,
                            processed.follow_up_question_2,
                            processed.follow_up_question_3
                        ] if all([processed.follow_up_question_1,
                                processed.follow_up_question_2,
                                processed.follow_up_question_3]) else []
                    }
                    document_list.append(document_data)

                   
                except ProcessedIndex.DoesNotExist:
                    document_data = {
                        'id': doc.id,
                        'filename': doc.filename,
                        'uploaded_at': doc.uploaded_at.strftime('%Y-%m-%d %H:%M'),
                        'summary': 'Document processing pending',
                        'follow_up_questions': []
                    }
                    document_list.append(document_data)
            
         
            
            return Response(document_list, status=status.HTTP_200_OK)
        
        except Exception as e:
            print(f"Error in GetUserDocumentsView: {str(e)}")
            return Response(
                {'error': f'Failed to fetch documents: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ManageConversationView(APIView):
    permission_classes = [IsAuthenticated]
    
    def update_conversation(self, request, conversation_id):
        try:
            # Log incoming request data for debugging
            print(f"Incoming update request for conversation {conversation_id}")
            print(f"Request data: {request.data}")

            # Validate input
            new_title = request.data.get('title')
            is_active = request.data.get('is_active', True)

            if not new_title or not new_title.strip():
                return Response(
                    {'error': 'Title cannot be empty'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Find the conversation
            try:
                conversation = ChatHistory.objects.get(
                    conversation_id=conversation_id, 
                    user=request.user
                )
            except ChatHistory.DoesNotExist:
                return Response(
                    {'error': 'Conversation not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Update the title and active status
            conversation.title = new_title.strip()
            conversation.is_active = is_active
            conversation.save()

            # Log successful update
            print(f"Conversation {conversation_id} updated successfully")
            print(f"New title: {conversation.title}")

            return Response({
                'message': 'Conversation title updated successfully',
                'conversation_id': str(conversation.conversation_id),
                'new_title': conversation.title,
                'is_active': conversation.is_active
            }, status=status.HTTP_200_OK)

        except Exception as e:
            # Comprehensive error logging
            print(f"Error updating conversation title: {str(e)}")
            logger.error(f"Conversation title update error: {str(e)}")

            return Response(
                {'error': 'Failed to update conversation title', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def put(self, request, conversation_id):
        return self.update_conversation(request, conversation_id)

    def patch(self, request, conversation_id):
        return self.update_conversation(request, conversation_id)

class DocumentProcessingMixin:
    def extract_text_from_file(self, file_path):
        """Extract text from different file types."""
        from pathlib import Path
        ext = Path(file_path).suffix.lower()
        if ext == '.pdf':
            return self.extract_text_from_pdf(file_path)
        elif ext == '.docx':
            return self.extract_text_from_docx(file_path)
        elif ext == '.pptx':
            return self.extract_text_from_pptx(file_path)
        elif ext == '.xlsx':
            return self.extract_text_from_xlsx(file_path)
        else:
            return ""

    def extract_text_from_pdf(self, file_path):
        import fitz
        text = ""
        with fitz.open(file_path) as doc:
            for page in doc:
                text += page.get_text()
        return text

    def extract_text_from_docx(self, file_path):
        import docx
        doc = docx.Document(file_path)
        text = [para.text for para in doc.paragraphs]
        return "\n".join(text)

    def extract_text_from_pptx(self, file_path):
        import pptx
        pres = pptx.Presentation(file_path)
        text = []
        for slide in pres.slides:
            for shape in slide.shapes:
                if hasattr(shape, "text"):
                    text.append(shape.text)
        return "\n".join(text)

    def extract_text_from_xlsx(self, file_path):
        import openpyxl
        wb = openpyxl.load_workbook(file_path, data_only=True)
        text = []
        for sheet in wb.sheetnames:
            ws = wb[sheet]
            text.append(f"Sheet: {sheet}")
            for row in ws.iter_rows(values_only=True):
                row_text = [str(cell) if cell is not None else "" for cell in row]
                text.append(" | ".join(row_text))
        return "\n".join(text)

    def clean_text(self, text):
        """Clean and normalize extracted text."""
        import re
        import unicodedata
        
        # Remove excessive whitespace while preserving paragraph breaks
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'\n\s*\n', '\n\n', text)
        text = text.strip()
        
        # Remove any control characters
        text = ''.join(char for char in text if unicodedata.category(char)[0] != 'C')
        
        return text

    def generate_summary(self, text, file_name):
        """Generates a summary covering the entire text using GPT-4 with formatted HTML-like output."""
        import tiktoken
        import re
        
        if not text.strip():
            return "No extractable text found in the document.", []
        
        # Create the detailed prompt with formatting instructions
        format_prompt = f"""
        Please analyze this document '{file_name}' and provide:
        1. A concise summary of the main points and key findings
        
        Content: {{content}}

        ### Instructions:
        - Use semantic HTML-like tags for structure
        - Provide a clear, organized summary
        - Highlight key insights with <b> tags
        - Use <p> tags for paragraphs
        - Use <ul> and <li> for list-based information

        ### Expected Response Format:
        <b>Summary Overview</b>
        <p>High-level introduction to the document's main theme</p>

        <b>Key Highlights</b>
        <ul>
            <li>First major insight</li>
            <li>Second major insight</li>
            <li>Third major insight</li>
        </ul>

        <b>Detailed Insights</b>
        <p>Expanded explanation of the document's core content and significance</p>
        """
        
        encoding = tiktoken.get_encoding("cl100k_base")
        tokens = encoding.encode(text)
        MAX_TOKENS_ALLOWED = 3500
        
        if len(tokens) > MAX_TOKENS_ALLOWED:
            # Split into chunks that do not exceed the token limit
            chunk_size = MAX_TOKENS_ALLOWED
            chunks = []
            for i in range(0, len(tokens), chunk_size):
                chunk_tokens = tokens[i:i+chunk_size]
                chunk_text = encoding.decode(chunk_tokens)
                chunks.append(chunk_text)
                
            partial_summaries = []
            for idx, chunk in enumerate(chunks):
                try:
                    chunk_prompt = format_prompt.replace("{content}", chunk)
                    completion = client.chat.completions.create(
                        model="gpt-4o",
                        messages=[
                            {"role": "developer", "content": "You are a document summarization expert."},
                            {"role": "user", "content": chunk_prompt}
                        ],
                        temperature=0.3,
                        max_tokens=500
                    )
                    partial_summary = completion.choices[0].message.content
                    partial_summaries.append(partial_summary)
                except Exception as e:
                    print(f"Error generating summary for chunk {idx}: {str(e)}")
                    partial_summaries.append(f"Summary generation error for chunk {idx}.")
            
            combined_text = "\n\n".join(partial_summaries)
            try:
                final_prompt = f"""
                Combine these partial summaries into a cohesive, comprehensive summary for document '{file_name}':

                {combined_text}

                ### Instructions:
                - Use semantic HTML-like tags for structure
                - Provide a clear, organized summary
                - Highlight key insights with <b> tags
                - Use <p> tags for paragraphs
                - Use <ul> and <li> for list-based information

                ### Expected Response Format:
                <b>Summary Overview</b>
                <p>High-level introduction to the document's main theme</p>

                <b>Key Highlights</b>
                <ul>
                    <li>First major insight</li>
                    <li>Second major insight</li>
                    <li>Third major insight</li>
                </ul>

                <b>Detailed Insights</b>
                <p>Expanded explanation of the document's core content and significance</p>
                """
                
                final_completion = client.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {"role": "developer", "content": "You are a document summarization expert."},
                        {"role": "user", "content": final_prompt}
                    ],
                    temperature=0.3,
                    max_tokens=1000
                )
                summary_text = final_completion.choices[0].message.content
                
                # Format the response
                summary_text = self.format_summary_response(summary_text)
                
                return summary_text, []
            except Exception as e:
                print(f"Error generating final summary: {str(e)}")
                return self.format_summary_response("\n".join(partial_summaries)), []
        else:
            try:
                full_prompt = format_prompt.replace("{content}", text)
                completion = client.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {"role": "developer", "content": "You are a document summarization expert."},
                        {"role": "user", "content": full_prompt}
                    ],
                    temperature=0.3,
                    max_tokens=1000
                )
                summary_text = completion.choices[0].message.content
                
                # Format the response
                summary_text = self.format_summary_response(summary_text)
                
                return summary_text, []
            except Exception as e:
                print(f"Error generating summary: {str(e)}")
                return self.format_error_message(file_name), []
        
    def format_summary_response(self, response_text):
        """Ensures proper HTML-like formatting in the summary response."""
        # Wrap paragraphs in <p> tags if not already wrapped
        response_text = re.sub(r'^(?!<[p|b|u|ul|li])(.*?)$', r'<p>\1</p>', response_text, flags=re.MULTILINE)
        
        # Ensure bold tags for section headers
        section_headers = ['Summary Overview', 'Key Highlights', 'Detailed Insights']
        for header in section_headers:
            response_text = response_text.replace(header, f'<b>{header}</b>')
        
        return response_text

    def format_error_message(self, file_name):
        """Returns a formatted error message."""
        return f"""
        <b>Summary Generation Error</b>
        <p>Unable to generate a comprehensive summary for {file_name}</p>
        
        <b>Possible Reasons</b>
        <ul>
            <li>Document may be too complex</li>
            <li>Parsing issues encountered</li>
            <li>Insufficient context extracted</li>
        </ul>
        """
    
from rest_framework.parsers import JSONParser






class ConsolidatedSummaryView(DocumentProcessingMixin, APIView):
    parser_classes = (JSONParser,)



    def load_faiss_index(self, session_id):
    
        try:
            index_file = f"faiss_indexes/{session_id}_index.faiss"
            pickle_file = f"faiss_indexes/{session_id}_chunks.pkl"
            index = faiss.read_index(index_file)
            with open(pickle_file, "rb") as f:
                chunks = pickle.load(f)
            return index, chunks
        except Exception as e:
            print(f"Error loading FAISS index: {str(e)}")
            return None, []
        


    def format_summary_response(self, response_text):
        """Ensures proper HTML-like formatting in the summary response."""
        # Wrap paragraphs in <p> tags if not already wrapped
        response_text = re.sub(r'^(?!<[p|b|u|ul|li])(.*?)$', r'<p>\1</p>', response_text, flags=re.MULTILINE)
        
        # Ensure bold tags for section headers
        section_headers = ['Summary Overview', 'Key Highlights', 'Detailed Insights']
        for header in section_headers:
            response_text = response_text.replace(header, f'<b>{header}</b>')
        
        return response_text

    def hierarchical_summary(self, chunks, group_size=10):
        """
        Generates a consolidated summary by grouping the chunk texts, summarizing each group,
        and then summarizing the aggregated group summaries.
        Enhanced to track document sources for better consolidated summaries.
        """
        import tiktoken
        encoding = tiktoken.get_encoding("cl100k_base")
            
        # Organize chunks by source document first
        chunks_by_source = {}
        for chunk in chunks:
            source = chunk.get('source', 'Unknown Source')
            if source not in chunks_by_source:
                chunks_by_source[source] = []
            chunks_by_source[source].append(chunk)
            
        # Process each document separately at first
        all_group_summaries = []
        for source, source_chunks in chunks_by_source.items():
            group_summaries = []
            # Group chunks to avoid exceeding token limits
            for i in range(0, len(source_chunks), group_size):
                group_text = "\n\n".join(chunk['text'] for chunk in source_chunks[i:i+group_size])
                    
                # Ensure we don't exceed token limits for the API call
                tokens = encoding.encode(group_text)
                if len(tokens) > 8000:
                    group_text = encoding.decode(tokens[:8000])
                    
                # Generate summary for this group
                try:
                    completion = client.chat.completions.create(
                        model="gpt-4o",
                        messages=[
                            {"role": "developer", "content": "You are a document summarization expert."},
                            {"role": "user", "content": f"Summarize the following text from document '{source}'. Cover all key details:\n\n{group_text}"}
                        ],
                        temperature=0.3,
                        max_tokens=500
                    )
                    group_summary = completion.choices[0].message.content
                    group_summaries.append(f"[From {source}] {group_summary}")
                except Exception as e:
                    print(f"Error generating group summary for {source}: {str(e)}")
                    # Add a placeholder if summarization fails
                    group_summaries.append(f"[From {source}] Summary generation error for chunk group {i//group_size}.")
            
            # Get document-level summary first
            document_summary = "\n\n".join(group_summaries)
            try:
                doc_completion = client.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {"role": "developer", "content": "You are a document summarization expert."},
                        {"role": "user", "content": f"Combine these partial summaries into a cohesive summary for document '{source}':\n\n{document_summary}"}
                    ],
                    temperature=0.3,
                    max_tokens=800
                )
                doc_final_summary = f"<b>Document: {source}</b>\n{doc_completion.choices[0].message.content}"
                all_group_summaries.append(doc_final_summary)
            except Exception as e:
                print(f"Error generating document summary for {source}: {str(e)}")
                all_group_summaries.append(f"<b>Document: {source}</b>\n{document_summary}")
        
        # Combine all document summaries for a final consolidated summary
        aggregated_summary = "\n\n".join(all_group_summaries)
        
        # Generate final consolidated summary
        try:
            final_completion = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "developer", "content": "You are a document summarization expert."},
                    {"role": "user", "content": f"""
                    Combine these document summaries into a cohesive, comprehensive consolidated summary.
                    First provide a high-level overview of all documents, then highlight key points across documents,
                    and finally discuss any important similarities, differences, or connections between the documents.
                    
                    {aggregated_summary}
                    
                    Format your response with HTML-like tags:
                    <b>Consolidated Summary</b>
                    <p>Overall summary of all documents together</p>
                    
                    <b>Key Points Across Documents</b>
                    <ul>
                        <li>First key point across documents</li>
                        <li>Second key point across documents</li>
                        <li>Third key point across documents</li>
                    </ul>
                    
                    <b>Document Relationships</b>
                    <p>Analysis of how the documents relate to each other, including any contradictions, complementary information, or overlapping themes.</p>
                    """}
                ],
                temperature=0.3,
                max_tokens=1200
            )
            final_summary = final_completion.choices[0].message.content
        except Exception as e:
            print(f"Error generating final consolidated summary: {str(e)}")
            # Fallback to a simpler message with the aggregated summaries
            final_summary = f"""
            <b>Consolidated Summary</b>
            <p>The following summarizes content from multiple documents:</p>
            
            {aggregated_summary}
            """
        
        return final_summary

    def post(self, request):
        document_ids = request.data.get('document_ids', [])
        main_project_id = request.data.get('main_project_id')
        user = request.user

        if not document_ids or len(document_ids) < 2:
            return Response({
                'error': 'Please select at least two documents for a consolidated summary'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Verify project access
            main_project = Project.objects.get(id=main_project_id, user=user)
            
            # Get all selected documents
            documents = Document.objects.filter(
                id__in=document_ids,
                user=user,
                main_project=main_project
            )
            
            if not documents or documents.count() < 2:
                return Response({
                    'error': 'Could not find requested documents'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Collect document chunks for hierarchical summarization
            all_chunks = []
            
            for document in documents:
                try:
                    processed_index = ProcessedIndex.objects.get(document=document)
                    
                    # Load FAISS index chunks for this document
                    _, chunks = self.load_faiss_index(processed_index.metadata.split('/')[-1].split('_')[0])
                    
                    # Add these chunks to our collection
                    all_chunks.extend(chunks)
                    
                except ProcessedIndex.DoesNotExist:
                    # Skip documents that haven't been processed
                    continue
            
            if not all_chunks:
                return Response({
                    'error': 'No processed content found for the selected documents'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Generate hierarchical summary across all documents
            consolidated_summary = self.hierarchical_summary(all_chunks)
            
            # Format the summary with HTML-like tags
            formatted_summary = self.format_summary_response(consolidated_summary)
            
            return Response({
                'consolidated_summary': formatted_summary
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"Error generating consolidated summary: {str(e)}")
            return Response({
                'error': str(e),
                'detail': 'An error occurred while generating the consolidated summary'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DocumentUploadView(DocumentProcessingMixin, APIView):
    parser_classes = (MultiPartParser, FormParser)
    def post(self, request):
        files = request.FILES.getlist('files')
        user = request.user
        main_project_id = request.data.get('main_project_id')

        try:
            main_project = Project.objects.get(id=main_project_id, user=user)
            uploaded_docs = []
            last_processed_doc_id = None
            processed_data = None  # Initialize processed_data outside the loop

            for file in files:
                # Check for existing document
                existing_doc = Document.objects.filter(
                    user=user, 
                    filename=file.name,
                    main_project=main_project
                ).first()

                if existing_doc:
                    try:
                        processed_index = ProcessedIndex.objects.get(document=existing_doc)
                        uploaded_docs.append({
                            'id': existing_doc.id,
                            'filename': existing_doc.filename,
                            
                        })
                        last_processed_doc_id = existing_doc.id
                        
                    except ProcessedIndex.DoesNotExist:
                        # Process the document if no existing index
                        processed_data = self.process_document(file, user)  # Pass user to process_document
                        
                        # Create ProcessedIndex with markdown_path if available
                        ProcessedIndex.objects.create(
                            document=existing_doc,
                            faiss_index=processed_data['index_path'],
                            metadata=processed_data['metadata_path'],
                            summary="",
                            markdown_path=processed_data.get('markdown_path', '')  # Use empty string if not available
                        )

                        uploaded_docs.append({
                            'id': existing_doc.id,
                            'filename': existing_doc.filename,
                            
                        })
                        last_processed_doc_id = existing_doc.id
                else:
                    # Create new document first
                    document = Document.objects.create(
                        user=user, 
                        file=file, 
                        filename=file.name,
                        main_project=main_project
                    )
                    
                    # Then process it
                    processed_data = self.process_document(file, user)  # Pass user to process_document
                    
                    # Create ProcessedIndex with markdown_path if available
                    ProcessedIndex.objects.create(
                        document=document,
                        faiss_index=processed_data['index_path'],
                        metadata=processed_data['metadata_path'],
                        summary="",
                        markdown_path=processed_data.get('markdown_path', '')  # Use empty string if not available
                    )

                    uploaded_docs.append({
                        'id': document.id,
                        'filename': document.filename,
                        
                    })
                    last_processed_doc_id = document.id

                    print(f"Uploaded Document - ID: {document.id}")
                    print(f"Filename: {document.filename}")
                    

            # Store the last processed document ID in the session
            request.session['active_document_id'] = last_processed_doc_id

            # Ensure we have processed_data before using it
            if processed_data is None:
                return Response({
                    'error': 'No documents were successfully processed'
                }, status=status.HTTP_400_BAD_REQUEST)

            return Response({
                'message': 'Documents uploaded successfully',
                'documents': [{
                    'id': doc['id'],
                    'filename': doc['filename'],
                } for doc in uploaded_docs],
                'active_document_id': last_processed_doc_id
            }, status=status.HTTP_201_CREATED)


        except Exception as e:
            print(f"Error processing document: {str(e)}")  # Add this for debugging
            return Response({
                'error': str(e),
                'detail': 'An error occurred while processing the document'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    # -------------------------------
    # Keep the complexity detection from original code
    # -------------------------------
    def detect_document_complexity(self, file_path):
        """Detect if PDF contains images."""
        import fitz
        try:
            doc = fitz.open(file_path)
            for page in doc:
                images = page.get_images()
                if images:
                    return True
            return False
        except Exception as e:
            print(f"Error detecting images in PDF: {e}")
            return False
    
    # Add LlamaParse integration from Streamlit code
    def process_complex_document_with_llamaparse(self, file_path, file_name, user):
        """
        Process complex document using LlamaParse with user's API token.
        """
        import tempfile
        import uuid
        import numpy as np
        import faiss
        import pickle
        import os
        from llama_parse import LlamaParse
        
        try:
            # Get the user's Llama API token
            try:
                user_api_tokens = UserAPITokens.objects.get(user=user)
                llama_api_key = user_api_tokens.llama_token
                
                # If no token is saved for the user, use a fallback mechanism or raise an error
                if not llama_api_key:
                    logger.warning(f"No Llama API token found for user {user.username}")
                    # Optional: You could implement a fallback or raise an error
                    raise ValueError("Llama API token is required for processing complex documents")
                    
            except UserAPITokens.DoesNotExist:
                logger.error(f"No API tokens record found for user {user.username}")
                raise ValueError("User API tokens not configured")
            
            parser = LlamaParse(
                api_key=llama_api_key,  # Use the user's Llama API token
                result_type="markdown",
                verbose=True,
                images=True,
                premium_mode=True
            )
            
            parsed_documents = parser.load_data(file_path)
            full_text = '\n'.join([doc.text for doc in parsed_documents])
            
            # Save markdown (adapted from Streamlit implementation)
            base_name = os.path.splitext(file_name)[0]
            safe_name = re.sub(r'[^\w\-_.]', '_', base_name)
            md_path = os.path.join("markdown_files", f"{safe_name}.md")
            os.makedirs("markdown_files", exist_ok=True)
            with open(md_path, "w", encoding='utf-8') as f:
                f.write(full_text)
            
            # Create FAISS index
            text_embedding_dim = 1536  # OpenAI embedding dimension
            faiss_index = faiss.IndexFlatL2(text_embedding_dim)
            metadata_store = []
            
            # Create chunks with overlap for better retrieval (from Streamlit implementation)
            chunked_texts = []
            for doc in parsed_documents:
                # Original document as a chunk
                chunked_texts.append(doc.text)
                metadata_store.append({
                    "content": doc.text,
                    "source_file": file_name
                })
                
                # Create additional smaller chunks for better retrieval
                words = doc.text.split()
                chunk_size = 200  # Smaller chunk size as in Streamlit
                stride = 100      # With overlap
                
                if len(words) > chunk_size:
                    for i in range(0, len(words) - chunk_size, stride):
                        chunk = " ".join(words[i:i+chunk_size])
                        if len(chunk.split()) > 50:  # Ensure chunk has substantial content
                            chunked_texts.append(chunk)
                            metadata_store.append({
                                "content": chunk,
                                "source_file": file_name
                            })
            
            # Process in batches to avoid API limitations
            if chunked_texts:
                batch_size = 50  # Adjust based on API limits
                for i in range(0, len(chunked_texts), batch_size):
                    batch = chunked_texts[i:i+batch_size]
                    embeddings = self.get_embeddings(batch)
                    
                    if embeddings:
                        faiss_index.add(np.array(embeddings).astype('float32'))
                    else:
                        print(f"Failed to generate embeddings for a batch in {file_name}. Continuing with next batch...")
            
            # Save index and metadata
            session_id = uuid.uuid4().hex
            index_file, pickle_file = self.save_faiss_index(faiss_index, metadata_store, session_id)
            
            return {
                'index_path': index_file,
                'metadata_path': pickle_file,
                'full_text': full_text,
                'markdown_path': md_path  # Include the markdown path
            }
            
        except Exception as e:
            print(f"Error in complex document processing: {str(e)}")
            raise
    def split_text_into_chunks(self, text, chunk_size=1500, chunk_overlap=300):
        """
        Splits text into chunks while attempting to preserve sentence and paragraph structure.
        If the text is very short, a single chunk is returned.
        """
        if len(text) <= chunk_size:
            return [text]
        chunks = []
        start = 0
        text_length = len(text)
        while start < text_length:
            end = min(start + chunk_size, text_length)
            # Try to find a paragraph break to end the chunk
            if end < text_length:
                break_point = text.rfind("\n\n", start, end)
                if break_point != -1 and break_point > start + chunk_size // 2:
                    end = break_point + 2
                else:
                    # Fallback to sentence break
                    sentence_break = text.rfind(". ", start, end)
                    if sentence_break != -1 and sentence_break > start + chunk_size // 2:
                        end = sentence_break + 2
                    else:
                        # Fallback to space
                        space_break = text.rfind(" ", start, end)
                        if space_break != -1 and space_break > start + chunk_size // 2:
                            end = space_break + 1
            chunks.append(text[start:end])
            start = end - chunk_overlap if end < text_length else text_length
        return chunks
    
    # Extract text function from Streamlit implementation
    def extract_text_from_file(self, file_path):
        """Extract text from various file types."""
        import os
        import re
        from docx import Document
        import fitz  # PyMuPDF for PDFs
        import csv
        import io
        
        file_ext = os.path.splitext(file_path)[1].lower()
        
        try:
            if file_ext == '.pdf':
                pdf_document = fitz.open(file_path)
                text = ""
                for page_num in range(len(pdf_document)):
                    page = pdf_document[page_num]
                    text += page.get_text()
                return text
                
            elif file_ext == '.docx':
                doc = Document(file_path)
                return ' '.join([paragraph.text for paragraph in doc.paragraphs])
                
            elif file_ext == '.txt':
                with open(file_path, 'r', encoding='utf-8') as file:
                    return file.read()
                    
            elif file_ext == '.csv':
                text = []
                with open(file_path, 'r', encoding='utf-8') as file:
                    csv_reader = csv.reader(file)
                    headers = next(csv_reader, None)
                    if headers:
                        text.append(','.join(headers))
                    for row in csv_reader:
                        text.append(','.join(row))
                return '\n'.join(text)
                
            else:
                return f"Unsupported file type: {file_ext}"
                
        except Exception as e:
            print(f"Error extracting text: {str(e)}")
            return f"Error extracting text: {str(e)}"
    
    # Clean text function (from Streamlit)
    def clean_text(self, text):
        """Clean extracted text by removing extra whitespace and special characters."""
        # Remove extra whitespace
        cleaned = re.sub(r'\s+', ' ', text)
        # Remove special characters that might cause issues
        cleaned = re.sub(r'[^\w\s.,;:!?"\'\-()]', ' ', cleaned)
        return cleaned.strip()
   
    def get_embeddings(self, texts):
        """
        Gets embeddings using OpenAI's text-embedding-3-small model.
        """
        try:
            response = client.embeddings.create(
                input=texts,
                model="text-embedding-3-small"
            )
            return [data.embedding for data in response.data]
        except Exception as e:
            print(f"Error getting embeddings: {str(e)}")
            return []

    # -------------------------------
    # FAISS functions for persistence from Streamlit
    # -------------------------------
    def create_faiss_index(self, embeddings):
        import numpy as np
        import faiss
        
        dimension = len(embeddings[0])
        index = faiss.IndexFlatL2(dimension)
        vectors = np.array(embeddings).astype('float32')
        index.add(vectors)
        return index

    def save_faiss_index(self, index, chunks, session_id):
        import os
        import pickle
        import faiss
        
        os.makedirs("faiss_indexes", exist_ok=True)
        index_file = f"faiss_indexes/{session_id}_index.faiss"
        pickle_file = f"faiss_indexes/{session_id}_chunks.pkl"
        faiss.write_index(index, index_file)
        with open(pickle_file, "wb") as f:
            pickle.dump(chunks, f)
        return index_file, pickle_file

    def load_faiss_index(self, session_id):
        import faiss
        import pickle
        
        try:
            index_file = f"faiss_indexes/{session_id}_index.faiss"
            pickle_file = f"faiss_indexes/{session_id}_chunks.pkl"
            index = faiss.read_index(index_file)
            with open(pickle_file, "rb") as f:
                chunks = pickle.load(f)
            return index, chunks
        except Exception as e:
            print(f"Error loading FAISS index: {str(e)}")
            return None, []

    # -------------------------------
    # Process documents function that integrates with Django database
    # -------------------------------
    def process_document(self, file, user):
        """
        Process documents: extraction, chunking, embeddings, FAISS creation
        While maintaining compatibility with the Django database structure.
        Now integrates complex document handling with LlamaParse and user-specific API tokens.
        """
        import tempfile
        import os
        import uuid
        import numpy as np
        import faiss
        
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.name)[1]) as tmp_file:
                for chunk in file.chunks():
                    tmp_file.write(chunk)
                file_path = tmp_file.name
                
            try:
                # Check document complexity (keep this from original code)
                is_complex = self.detect_document_complexity(file_path)

                # Process document based on complexity
                if is_complex:
                    # Now using the LlamaParse approach for complex documents
                    print(f"Complex document detected: {file.name}. Using LlamaParse...")
                    return self.process_complex_document_with_llamaparse(file_path, file.name, user)
                else:
                    # Original simple document processing
                    extracted_text = self.extract_text_from_file(file_path)
                
                if not extracted_text:
                    raise ValueError("No content could be extracted from the document")
                
                # Clean the text
                cleaned_text = self.clean_text(extracted_text)
                
                # Create document record for processing
                doc = {
                    'text': cleaned_text,
                    'name': file.name
                }
                
                all_chunks = []
                # Split text into chunks
                chunks = self.split_text_into_chunks(doc['text'])
                for i, chunk in enumerate(chunks):
                    all_chunks.append({
                        'text': chunk,
                        'source': doc['name'],
                        'chunk_id': i
                    })
                
                # Get embeddings for all chunks
                embeddings = self.get_embeddings([chunk['text'] for chunk in all_chunks])
                
                if not embeddings:
                    raise ValueError("Failed to generate embeddings for document chunks")
                
                # Create FAISS index
                index = self.create_faiss_index(embeddings)
                
                # Generate a unique session ID for this document
                session_id = uuid.uuid4().hex
                
                # Save the index and chunks
                index_file, pickle_file = self.save_faiss_index(index, all_chunks, session_id)
                
                return {
                    'index_path': index_file,
                    'metadata_path': pickle_file,
                    'full_text': doc['text']
                }
                
            finally:
                # Clean up temporary file
                if os.path.exists(file_path):
                    os.unlink(file_path)
                    
        except Exception as e:
            print(f"Error in process_document: {str(e)}")
            raise
        

class GenerateDocumentSummaryView(DocumentProcessingMixin, APIView):
    def post(self, request):
        document_ids = request.data.get('document_ids', [])
        user = request.user
        main_project_id = request.data.get('main_project_id')

        try:
            documents = Document.objects.filter(
                id__in=document_ids,
                user=user,
                main_project=main_project_id
            )

            if not documents:
                return Response({
                    'error': 'No valid documents found'
                }, status=status.HTTP_404_NOT_FOUND)

            all_summaries = []
            for document in documents:
                with open(document.file.path, 'rb') as file:
                    # Using inherited methods from the mixin
                    text = self.extract_text_from_file(file.name)
                    cleaned_text = self.clean_text(text)
                    summary, _ = self.generate_summary(cleaned_text, document.filename)
                    
                    processed_index, created = ProcessedIndex.objects.get_or_create(
                        document=document,
                        defaults={
                            'summary': summary
                        }
                    )
                    if not created:
                        processed_index.summary = summary
                        processed_index.save()

                    all_summaries.append({
                        'document_id': document.id,
                        'filename': document.filename,
                        'summary': summary
                    })

            return Response({
                'message': 'Summaries generated successfully',
                'summaries': all_summaries
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)     
class DeleteDocumentView(APIView):
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, document_id):
        try:
            # Find the document and ensure it belongs to the current user
            document = Document.objects.get(
                id=document_id, 
                user=request.user
            )
            
            # Optional: Delete associated ProcessedIndex
            try:
                processed_index = ProcessedIndex.objects.get(document=document)
                processed_index.delete()
            except ProcessedIndex.DoesNotExist:
                pass
            
            # Delete the document
            document.delete()
            
            return Response(
                {'message': 'Document deleted successfully'}, 
                status=status.HTTP_200_OK
            )
        
        except Document.DoesNotExist:
            return Response(
                {'error': 'Document not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to delete document: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GetChatHistoryView(APIView):
    def get(self, request):
        try:
            user = request.user
            main_project_id = request.query_params.get('main_project_id')
            
            print(f"Getting chat history for user {user.username} and project {main_project_id}")
            
            if not main_project_id:
                return Response({
                    'error': 'Main project ID is required'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Filter conversations by both user and main_project_id
            conversations = ChatHistory.objects.filter(
                user=user,
                main_project_id=main_project_id,
                is_active=True
            ).order_by('-created_at')
            
            history = []
            for conversation in conversations:
                messages = conversation.messages.all().order_by('created_at')
                message_list = [
                    {
                        'role': message.role,
                        'content': message.content,
                        'created_at': message.created_at.strftime('%Y-%m-%d %H:%M'),
                        'citations': message.citations or []
                    } for message in messages
                ]
                
                history.append({
                    'conversation_id': str(conversation.conversation_id),
                    'title': conversation.title or f"Chat from {conversation.created_at.strftime('%Y-%m-%d %H:%M')}",
                    'created_at': conversation.created_at.strftime('%Y-%m-%d %H:%M'),
                    'messages': message_list,
                    'preview': message_list[0]['content'] if message_list else "",
                    'follow_up_questions': conversation.follow_up_questions or [],
                    'selected_documents': [str(doc.id) for doc in conversation.documents.all()]
                })

            return Response(history, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"Error in GetChatHistoryView: {str(e)}")
            return Response(
                {'error': f'Failed to fetch chat history: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        
class SetActiveDocumentView(APIView):
    def post(self, request):
        try:
            document_id = request.data.get('document_id')
            
            if not document_id:
                return Response(
                    {'error': 'Document ID is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Verify the document exists and belongs to the user
            try:
                document = Document.objects.get(
                    id=document_id, 
                    user=request.user
                )
                
                # Check if document is processed
                ProcessedIndex.objects.get(document=document)
            except Document.DoesNotExist:
                return Response(
                    {'error': 'Document not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            except ProcessedIndex.DoesNotExist:
                return Response(
                    {'error': 'Document not processed'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Set the active document in the session
            request.session['active_document_id'] = document_id

            return Response({
                'message': 'Active document set successfully',
                'active_document_id': document_id,
                'filename': document.filename
            }, status=status.HTTP_200_OK)
        
        except Document.DoesNotExist:
            return Response(
                {'error': 'Document not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        except Exception as e:
            import traceback
            print(f"Detailed Error: {str(e)}")
            print(traceback.format_exc())  # This will print the full stack trace
            return Response(
                {'error': f'An unexpected error occurred: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
def post_process_response(response_text):
    """
    Post-process the generated response to improve formatting and readability
    but preserve the original meaning and content quality.
    
    Args:
        response_text (str): Raw generated response text
    
    Returns:
        str: Cleaned and formatted response
    """
    try:
        import re
        # Create a copy of the original text before processing
        original_text = response_text
        
        # Only remove explicit section headers - not content
        response_text = re.sub(r'^[IVX]+\.\s*[\w\s]+:', '', response_text, flags=re.MULTILINE)
        response_text = re.sub(r'^\d+\.\s*[\w\s]+:', '', response_text, flags=re.MULTILINE)
        
        # Remove specific section headers but keep their content
        section_headers = [
            'Contextual Insight', 
            'Structured Response', 
            'Analytical Depth', 
            'Interactive Engagement'
        ]
        for header in section_headers:
            response_text = response_text.replace(header + ':', '')
        
        # Clean up extra whitespace while preserving paragraph structure
        response_text = re.sub(r'\n{3,}', '\n\n', response_text)
        
        # If the processed text is significantly shorter or might have lost content,
        # revert to the original
        if len(response_text) < len(original_text) * 0.9:
            logger.warning("Post-processing reduced content significantly, reverting to original")
            return original_text
            
        return response_text.strip()
    
    except Exception as e:
        logger.error(f"Error in post-processing response: {str(e)}", exc_info=True)
        return response_text  # Return original if any error occurs


import uuid
import os
import pickle
import numpy as np
import faiss
import re
from datetime import datetime
import logging
from sklearn.feature_extraction.text import TfidfVectorizer

logger = logging.getLogger(__name__)

class ChatView(APIView):
    permission_classes = [IsAuthenticated]

    def __init__(self, post_process_func=post_process_response):
        self.post_process_func = post_process_func

    def post(self, request):
        try:
            # Extract data with more robust handling
            message = request.data.get('message')
            conversation_id = request.data.get('conversation_id')
            main_project_id = request.data.get('main_project_id')
            selected_documents = request.data.get('selected_documents', [])
            
            # Extract web_mode flag from request
            use_web_knowledge = request.data.get('use_web_knowledge', False)
            
            # Extract general_chat_mode flag
            general_chat_mode = request.data.get('general_chat_mode', False)

            if not main_project_id:
                return Response({
                    'error': 'Main project ID is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate message
            if not message:
                return Response(
                    {'error': 'Message is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            user = request.user
            
            # Skip document validation if in general chat mode
            if not general_chat_mode:
                # First, check for active document in session
                active_document_id = request.session.get('active_document_id')
                
                if not selected_documents:
                    active_document_id = request.session.get('active_document_id')
                    if active_document_id:
                        selected_documents = [active_document_id]
                
                # Validate document selection only when not in general chat mode
                if not selected_documents:
                    return Response(
                        {'error': 'Please select at least one document or set an active document'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            # Get answer based on mode
            if general_chat_mode:
                # Process request in general chat mode (no documents needed)
                answer = self.get_general_chat_answer(message, use_web_knowledge)
                all_chunks = []  # No document chunks in general mode
                combined_text = ""
            else:
                # Process with documents
                try:
                    processed_docs = ProcessedIndex.objects.filter(
                        document_id__in=selected_documents, 
                        document__user=user
                    )
                    
                    if not processed_docs.exists():
                        return Response(
                            {'error': 'No valid documents found'},
                            status=status.HTTP_404_NOT_FOUND
                        )
                except Exception as e:
                    return Response(
                        {'error': f'Document retrieval error: {str(e)}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Use the Streamlit retrieval approach here
                all_chunks = []
                content_sources = []
                
                # Create a merged FAISS index and metadata store from all selected documents
                # (Similar to the Streamlit approach of merging indices)
                all_metadata_store = []
                
                # Load FAISS indices and chunks for all selected documents
                for proc_doc in processed_docs:
                    if not proc_doc.faiss_index or not proc_doc.metadata:
                        continue
                    
                    if not os.path.exists(proc_doc.faiss_index) or not os.path.exists(proc_doc.metadata):
                        continue
                    
                    # Load FAISS index and metadata
                    try:
                        with open(proc_doc.metadata, 'rb') as f:
                            chunks = pickle.load(f)
                        
                        # Add document source information to each chunk
                        for chunk in chunks:
                            if isinstance(chunk, dict) and 'source_file' not in chunk:
                                chunk['source_file'] = proc_doc.document.filename
                            
                        # Add to all metadata store
                        all_metadata_store.extend(chunks)
                        
                    except Exception as e:
                        logger.error(f"Error loading metadata for {proc_doc.document.filename}: {str(e)}")
                        continue
                
                # Now search using the Streamlit approach
                if all_metadata_store:
                    # Combine all indices into a single query
                    similar_contents, content_sources = self.search_similar_content(
                        message, 
                        processed_docs,
                        all_metadata_store
                    )
                    
                    # Generate answer using Streamlit's generate_response
                    answer = self.generate_response(message, similar_contents, content_sources)
                    all_chunks = [{'text': content, 'source': source} for content, source in zip(similar_contents, content_sources)]
                else:
                    answer = "I couldn't find any relevant information in the documents."
                    all_chunks = []
            
            # Extract main response and citation info (if any)
            if "\n\n*Sources:" in answer:
                parts = answer.split("\n\n*Sources:")
                clean_response = parts[0]
                source_info = parts[1].split('*\n')[0] if len(parts) > 1 else ""
            else:
                clean_response = answer
                source_info = ""
            
            # Generate follow-up questions (either from documents or general chat)
            if general_chat_mode:
                follow_up_questions = self.generate_general_follow_up_questions(message, clean_response)
            else:
                if all_chunks:
                    context_texts = [chunk.get('text', '') for chunk in all_chunks[:3]]
                    follow_up_questions = self.generate_follow_up_questions(context_texts)
                else:
                    follow_up_questions = [
                        "What else would you like to know about this document?",
                        "Would you like me to elaborate on any specific point?",
                        "Do you have any other questions I can help with?"
                    ]
            
            # Create citations from chunks (empty in general chat mode)
            citations = []
            if not general_chat_mode:
                for chunk in all_chunks:
                    chunk_text = chunk.get('text', '')
                    citations.append({
                        'source_file': chunk.get('source', 'Unknown'),
                        'page_number': chunk.get('chunk_id', 'Unknown'),
                        'section_title': 'Unknown',
                        'snippet': chunk_text[:200] + "..." if len(chunk_text) > 200 else chunk_text,
                        'document_id': next((str(doc.document.id) for doc in processed_docs if doc.document.filename == chunk.get('source')), 'Unknown')
                    })

            # Prepare conversation details
            conversation_id = conversation_id or str(uuid.uuid4())
            title = f"Chat {datetime.now().strftime('%Y-%m-%d %H:%M')}"

            # Create or retrieve conversation
            conversation, created = ChatHistory.objects.get_or_create(
                user=user,
                conversation_id=conversation_id,
                main_project_id=main_project_id,
                defaults={
                    'title': title,
                    'is_active': True,
                    'follow_up_questions': follow_up_questions,
                }
            )

            # Create user message
            user_message = ChatMessage.objects.create(
                chat_history=conversation,
                role='user',
                content=message
            )

            # Create AI response message
            ai_message = ChatMessage.objects.create(
                chat_history=conversation,
                role='assistant',
                content=clean_response,
                citations=citations
            )

            # Add selected documents to the conversation (skip if general chat mode)
            if selected_documents and not general_chat_mode:
                documents = Document.objects.filter(
                    id__in=selected_documents, 
                    user=user
                )
                conversation.documents.set(documents)

            # Update conversation details
            conversation.title = title
            conversation.follow_up_questions = follow_up_questions
            conversation.save()

            response_data = {
                'response': clean_response,
                'follow_up_questions': follow_up_questions,
                'conversation_id': str(conversation.conversation_id),
                'citations': citations,
                'active_document_id': request.session.get('active_document_id') if not general_chat_mode else None,
                'sources_info': source_info,
                'use_web_knowledge': use_web_knowledge,
                'general_chat_mode': general_chat_mode
            }

            # Print detailed chat response information
            print("\n--- Chat Interaction Logged ---")
            print(f"User Question: {message}")
            print(f"Mode: {'General Chat' if general_chat_mode else 'Document Chat'}")
            print(f"Web Knowledge: {'On' if use_web_knowledge else 'Off'}")
            print(f"Assistant Response: {clean_response[:500]}...")  # First 500 chars
            print("Follow-up Questions:")
            for i, q in enumerate(follow_up_questions, 1):
                print(f"{i}. {q}")
            print("-----------------------------\n")

            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Unexpected error in ChatView: {str(e)}", exc_info=True)
            return Response(
                {'error': f'An unexpected error occurred: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    # Keep general chat answer function as is
    def get_general_chat_answer(self, question, use_web_knowledge=False):
        try:
            # Choose the appropriate prompt based on whether web knowledge is enabled
            if use_web_knowledge:
                system_message = """You are a helpful, friendly AI assistant. Provide informative, thoughtful responses 
                using your knowledge base. Use semantic HTML tags for structure (<b>, <p>, <ul>, <li>) and maintain 
                a natural, conversational tone. Format your response to be clear and readable."""
            else:
                system_message = """You are a helpful, friendly AI assistant. Provide informative, thoughtful responses 
                using your knowledge base. Use semantic HTML tags for structure (<b>, <p>, <ul>, <li>) and maintain 
                a natural, conversational tone. Format your response to be clear and readable."""
            
            # Simple user prompt for general chat
            user_prompt = f"""
            Please provide a helpful response to the following query:
            
            USER QUERY: {question}
            
            RESPONSE FORMAT REQUIREMENTS:
            1. Begin with a brief introductory paragraph
            2. Use <b> tags for key section headings when applicable
            3. Use <p> tags for detailed explanations
            4. Use <ul> and <li> for list-based information when applicable
            5. Ensure the response flows naturally and is easy to read
            """
            
            completion = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.2,
                max_tokens=2000
            )
            
            answer_text = completion.choices[0].message.content
            usage = completion.usage
            #token_info = f"(Tokens used: prompt {usage.prompt_tokens}, completion {usage.completion_tokens}, total {usage.prompt_tokens + usage.completion_tokens})"
            
            return f"{answer_text}"
                
        except Exception as e:
            logger.error(f"Error getting general chat answer: {str(e)}")
            return "Sorry, an error occurred while processing your question."
    
    # Implement Streamlit's generate_response function
    def generate_response(self, query, context, sources):
        """Generate a response using OpenAI's chat completion API - ported from Streamlit"""
        if not context:
            return "I cannot answer this question based on the provided documents."
        
        # Limit number of tokens by selecting most relevant chunks
        # while ensuring they're comprehensive and diverse
        selected_context = []
        selected_sources = []
        seen_content_hashes = set()
        
        # Take first 8 chunks (most relevant ones)
        initial_count = min(8, len(context))
        for i in range(initial_count):
            selected_context.append(context[i])
            selected_sources.append(sources[i])
            # Add a content hash to avoid repetition
            seen_content_hashes.add(context[i][:100])
        
        # Add more diverse chunks from the remaining context
        for i in range(initial_count, len(context)):
            content_hash = context[i][:100]
            # Check if content is sufficiently different from what we've seen
            if content_hash not in seen_content_hashes:
                selected_context.append(context[i])
                selected_sources.append(sources[i])
                seen_content_hashes.add(content_hash)
                # Limit to 15 total pieces of context for token limit reasons
                if len(selected_context) >= 15:
                    break
        
        # Create context with source information
        contextualized_content = []
        for content, source in zip(selected_context, selected_sources):
            contextualized_content.append(f"From document '{source}':\n{content}")
        full_context = "\n\n".join(contextualized_content)
        
        # Define the user prompt (from Streamlit)
        user_prompt = f"""
        Based ONLY on the following context from multiple documents, answer the question. If relevant details are not fully available, provide the information that is present and kindly note any specific information that is missing. Be helpful by mentioning related information that may assist in answering the question, and offer to expand on available details if useful. Additionally, provide quantitative details where needed.
     
        RESPONSE GENERATION GUIDELINES:
        - Provide a DETAILED, COMPREHENSIVE, and THOROUGH answer.
        - Include ALL relevant information from the context in your response.
        - Prioritize completeness over brevity - make sure to include details.
        - If multiple perspectives or data points exist, include all of them.
        - When appropriate, organize information with clear sections and structure as well as in tabular formats where applicable.
        - In case of data where we have trends, comparisons and / or segments and patterns, represent the data in as many table as necessary.
        - Maintain a natural, conversational tone.
        - Ensure the response is directly derived from the provided document context.
        - If the document does NOT contain relevant information, explicitly state that and summarize related available content instead.
     
        DOCUMENT CONTEXT:
        {full_context}
     
        USER QUERY: {query}
     
        RESPONSE FORMAT REQUIREMENTS:
        1. Begin with a comprehensive summary of all key information related to the query
        2. Follow with detailed elaboration on each aspect of the question
        3. Include specific details, examples, and supporting evidence from the documents
        4. When appropriate, organize information into logical sections
        5. Conclude with any additional relevant information from the context
        6. Use <b> tags for key section headings
        7. Use <p> tags for detailed explanations
        8. Use <ul> and <li> for list-based information
        9. Use <table> and <tr>, <td> for tabular information
     
        CRITICAL CONSTRAINTS:
        - Use ONLY information from the provided document.
        - DO NOT generate speculative or external information.
        - Ensure clarity, accuracy, and comprehensive coverage of all relevant details.
        - Avoid summarizing or condensing important information - include all relevant details.
        """
        
        # Define system message
        system_message = "You are a document analysis expert. Provide a comprehensive and detailed answer using only available information."
        
        try:
            # Call the OpenAI chat completion API (using o3-mini as in Streamlit)
            completion = client.chat.completions.create(
                model="o3-mini",
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": user_prompt}
                ]
            )
            
            # Extract the answer from the response
            answer = completion.choices[0].message.content
            
            # If answer seems too short, try to generate a more detailed one
            if len(answer.split()) < 100:  # If less than ~100 words
                enhanced_system_message = "You are a document analysis expert. The previous response was too brief. Provide an EXTREMELY DETAILED and COMPREHENSIVE response including ALL information from the context."
                
                completion = client.chat.completions.create(
                    model="o3-mini",
                    messages=[
                        {"role": "system", "content": enhanced_system_message},
                        {"role": "user", "content": user_prompt}
                    ]
                )
                
                answer = completion.choices[0].message.content
                
        except Exception as e:
            # If there's an error (e.g., token limit), try with fewer context chunks
            reduced_context = "\n\n".join(contextualized_content[:8])
            fallback_prompt = f"""
            Based ONLY on the following context, provide a comprehensive answer to the question: {query}
            
            CONTEXT:
            {reduced_context}
            
            Ensure the response is detailed and covers all relevant information from the context.
            """
            
            try:
                fallback_completion = client.chat.completions.create(
                    model="o3-mini",
                    messages=[
                        {"role": "system", "content": "You are a document analysis expert."},
                        {"role": "user", "content": fallback_prompt}
                    ],
                    temperature=0.5
                )
                
                answer = fallback_completion.choices[0].message.content
            except Exception as nested_e:
                # Last resort fallback
                answer = f"An error occurred while generating the response: {str(e)}. Please try a more specific question or with fewer documents."

        # Add source information
        source_list = list(set(sources))
        source_info = ", ".join(source_list)
        return f"{answer}\n\n*Sources: {source_info}*"
    
    # Keep follow-up question generation as is
    def generate_general_follow_up_questions(self, question, answer):
        prompt = f"""
        Based on this user question and your answer, suggest 3 relevant follow-up questions that the user might want to ask next.
        The questions should be short, interesting, and directly related to the topic.
        
        User Question: {question}
        
        Your Answer (abbreviated): {answer[:500]}...
        """
        
        try:
            response = GENERATIVE_MODEL.generate_content(prompt)
            questions = response.text.split('\n')
            # Filter out empty lines and remove numbering if present
            questions = [q.strip().lstrip('0123456789. ') for q in questions if q.strip()]
            return questions[:3]
        except Exception as e:
            return [
                "What else would you like to know about this topic?",
                "Would you like me to elaborate on any specific point?",
                "Do you have any other questions I can help with?"
            ]

    # Get embeddings (same as in DocumentUploadView)
    def get_embeddings(self, texts):
        """
        Gets embeddings using OpenAI's text-embedding-3-small model.
        """
        try:
            response = client.embeddings.create(
                input=texts,
                model="text-embedding-3-small"
            )
            return [data.embedding for data in response.data]
        except Exception as e:
            logger.error(f"Error getting embeddings: {str(e)}")
            return []
            
    # Implement Streamlit's search_similar_content function
    def search_similar_content(self, query, processed_docs, metadata_store, k=40):
        """Search for similar content using the Streamlit approach"""
        # Get embeddings for the query
        query_embedding = self.get_embeddings([query])
        if not query_embedding:
            return [], []
        
        # Need to search each document's FAISS index separately
        all_results = []
        all_distances = []
        all_sources = []
        
        for proc_doc in processed_docs:
            if not proc_doc.faiss_index or not os.path.exists(proc_doc.faiss_index):
                continue
                
            # Load the FAISS index
            try:
                index = faiss.read_index(proc_doc.faiss_index)
                # Search this index
                distances, indices = index.search(np.array([query_embedding[0]]).astype('float32'), min(k, index.ntotal))
                
                # Extract results for this document
                doc_metadata = [md for md in metadata_store if md.get('source_file') == proc_doc.document.filename]
                
                for i, idx in enumerate(indices[0]):
                    if idx < len(doc_metadata):
                        metadata_item = doc_metadata[idx]
                        # Check if 'content' exists (complex docs) or use 'text' (simple docs)
                        content = metadata_item.get('content', metadata_item.get('text', ''))
                        source = metadata_item.get('source_file', metadata_item.get('source', proc_doc.document.filename))
                        
                        all_results.append(content)
                        all_distances.append(distances[0][i])
                        all_sources.append(source)
                        
            except Exception as e:
                logger.error(f"Error searching index for {proc_doc.document.filename}: {str(e)}")
                continue
        
        # Combine and sort results by similarity score
        combined_results = list(zip(all_results, all_sources, all_distances))
        sorted_results = sorted(combined_results, key=lambda x: x[2])  # Sort by distance (smaller is better)
        
        # Use TF-IDF for better ranking as in Streamlit implementation
        results = [res[0] for res in sorted_results]
        sources = [res[1] for res in sorted_results]
        
        # Apply TF-IDF if we have results
        if results:
            try:
                from sklearn.feature_extraction.text import TfidfVectorizer
                
                # Create a TF-IDF vectorizer
                vectorizer = TfidfVectorizer(stop_words='english', max_features=100)
                tfidf_matrix = vectorizer.fit_transform([query] + results)
                
                # Calculate similarity scores
                tfidf_scores = tfidf_matrix[0].dot(tfidf_matrix.T).toarray().flatten()[1:]
                
                # Calculate combined scores (70% TF-IDF, 30% embedding similarity)
                similarity_scores = [1 / (1 + dist) for dist in all_distances]
                combined_scores = [0.7 * tf + 0.3 * sim for tf, sim in zip(tfidf_scores, similarity_scores)]
                
                # Re-sort results by combined score
                combined_results = list(zip(results, sources, combined_scores))
                sorted_results = sorted(combined_results, key=lambda x: x[2], reverse=True)
                
                # Extract sorted content and sources
                results = [res[0] for res in sorted_results]
                sources = [res[1] for res in sorted_results]
                
                # Remove duplicates while preserving order
                seen_content = set()
                filtered_results = []
                filtered_sources = []
                
                for content, source in zip(results, sources):
                    # Use first 100 chars as a content signature
                    content_hash = content[:100] if content else ""
                    if content_hash and content_hash not in seen_content:
                        seen_content.add(content_hash)
                        filtered_results.append(content)
                        filtered_sources.append(source)
                
                # Limit results to top matches
                return filtered_results[:min(len(filtered_results), 15)], filtered_sources[:min(len(filtered_sources), 15)]
                
            except Exception as e:
                logger.error(f"Error applying TF-IDF ranking: {str(e)}")
                # Fall back to distance-based ranking
                results = [res[0] for res in sorted_results[:15]]
                sources = [res[1] for res in sorted_results[:15]]
                return results, sources
        
        return results[:min(len(results), 15)], sources[:min(len(sources), 15)]
    
    def generate_follow_up_questions(self, context):
        context_sample = "\n".join(context[:3]) if context else ""
        prompt = f"""
        Based on this context, suggest 3 relevant follow-up questions, the length of the questions should be short:
        {context_sample}
        """
        
        try:
            response = GENERATIVE_MODEL.generate_content(prompt)
            questions = response.text.split('\n')
            # Filter out empty lines and remove numbering if present
            questions = [q.strip().lstrip('0123456789. ') for q in questions if q.strip()]
            return questions[:3]
        except Exception as e:
            return [
                "What additional information would you like to know?",
                "Would you like me to elaborate on any specific point?",
                "How can I help clarify this information further?"
            ]
        
class GetConversationView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, conversation_id=None):
        try:
            user = request.user
            
            if conversation_id:
                # Fetch specific conversation
                try:
                    conversation = ChatHistory.objects.get(
                        conversation_id=conversation_id, 
                        user=user
                    )
                    
                    # Retrieve all messages for this conversation
                    messages = conversation.messages.all().order_by('created_at')
                    
                    # Prepare message list
                    message_list = [
                        {
                            'role': message.role,
                            'content': message.content,
                            'created_at': message.created_at.strftime('%Y-%m-%d %H:%M'),
                            'citations': message.citations or []
                        } for message in messages
                    ]
                    
                    return Response({
                        'conversation_id': str(conversation.conversation_id),
                        'title': conversation.title or f"Chat from {conversation.created_at.strftime('%Y-%m-%d %H:%M')}",
                        'created_at': conversation.created_at.strftime('%Y-%m-%d %H:%M'),
                        'messages': message_list,
                        'follow_up_questions': conversation.follow_up_questions or [],
                        'selected_documents': [
                            str(doc.id) for doc in conversation.documents.all()
                        ]
                    }, status=status.HTTP_200_OK)
                
                except ChatHistory.DoesNotExist:
                    return Response(
                        {'error': 'Conversation not found'}, 
                        status=status.HTTP_404_NOT_FOUND
                    )
            
            else:
                # Fetch all conversations for the user
                conversations = ChatHistory.objects.filter(user=user) \
                    .filter(is_active=True) \
                    .order_by('-created_at')
                
                conversation_list = []
                for conversation in conversations:
                    # Get the first and last messages
                    messages = conversation.messages.all().order_by('created_at')
                    
                    if messages:
                        first_message = messages.first()
                        last_message = messages.last()
                        
                        conversation_list.append({
                            'conversation_id': str(conversation.conversation_id),
                            'title': conversation.title or f"Chat from {conversation.created_at.strftime('%Y-%m-%d %H:%M')}",
                            'created_at': conversation.created_at.strftime('%Y-%m-%d %H:%M'),
                            'first_message': first_message.content,
                            'last_message': last_message.content,
                            'message_count': messages.count(),
                            'follow_up_questions': conversation.follow_up_questions or []
                        })
                
                return Response(conversation_list, status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch conversations: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    # Add PATCH method to handle title updates
    def patch(self, request, conversation_id):
        try:
            # Log incoming request data for debugging
            print(f"PATCH request for conversation {conversation_id}")
            print(f"Request data: {request.data}")

            # Validate input
            new_title = request.data.get('title')
            is_active = request.data.get('is_active', True)

            if not new_title or not new_title.strip():
                return Response(
                    {'error': 'Title cannot be empty'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Find the conversation
            try:
                conversation = ChatHistory.objects.get(
                    conversation_id=conversation_id, 
                    user=request.user
                )
            except ChatHistory.DoesNotExist:
                return Response(
                    {'error': 'Conversation not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Update the title and active status
            conversation.title = new_title.strip()
            conversation.is_active = is_active
            conversation.save()

            # Log successful update
            print(f"Conversation {conversation_id} updated successfully")
            print(f"New title: {conversation.title}")

            return Response({
                'message': 'Conversation title updated successfully',
                'conversation_id': str(conversation.conversation_id),
                'new_title': conversation.title,
                'is_active': conversation.is_active
            }, status=status.HTTP_200_OK)

        except Exception as e:
            # Comprehensive error logging
            print(f"Error updating conversation title: {str(e)}")
            logger.error(f"Conversation title update error: {str(e)}")

            return Response(
                {'error': 'Failed to update conversation title', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    # Also implement PUT for completeness
    def put(self, request, conversation_id):
        return self.patch(request, conversation_id)

# Optional: Add a view to delete a conversation
class DeleteConversationView(APIView):
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, conversation_id):
        try:
            conversation = ChatHistory.objects.get(
                conversation_id=conversation_id, 
                user=request.user
            )
            
            conversation.delete()
            return Response(
                {'message': 'Conversation deleted successfully'}, 
                status=status.HTTP_200_OK
            )
        
        except ChatHistory.DoesNotExist:
            return Response(
                {'error': 'Conversation not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to delete conversation: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
class ChatDownloadView(APIView):
    permission_classes = [IsAuthenticated]
    
    def clean_html_content(self, content):
        """Strip HTML tags and normalize whitespace for better readability"""
        # Replace <p>, <div>, etc. with newlines before stripping tags
        content = re.sub(r'</(p|div|h\d|li)>', '\n', content)
        content = re.sub(r'<br\s*/?>', '\n', content)
        
        # Replace list tags with bullets and newlines
        content = re.sub(r'<li>', '• ', content)
        content = re.sub(r'<ul>', '\n', content)
        content = re.sub(r'</ul>', '\n', content)
        
        # Convert <b> or <strong> to uppercase or add asterisks
        bold_content = re.findall(r'<(b|strong)>(.*?)</\1>', content)
        for tag, text in bold_content:
            content = content.replace(f'<{tag}>{text}</{tag}>', f'*{text}*')
        
        # Strip remaining HTML tags
        cleaned_content = strip_tags(content)
        
        # Normalize whitespace
        cleaned_content = re.sub(r'\n\s*\n', '\n\n', cleaned_content)
        cleaned_content = re.sub(r' {2,}', ' ', cleaned_content)
        
        return cleaned_content.strip()
    
    # Update this method in the ChatDownloadView class to improve text formatting

    def format_messages_for_download(self, messages, format_type='txt'):
        """
        Format messages for download in specified format
        """
        if format_type == 'json':
            # For JSON, we just need to structure the data
            return messages
        
        # For text format, create a readable conversation
        formatted_text = ""
        for msg in messages:
            role = "You" if msg['role'] == 'user' else "Assistant"
            timestamp = datetime.fromisoformat(msg['created_at'].replace(' ', 'T'))
            formatted_date = timestamp.strftime('%Y-%m-%d %H:%M:%S')
            
            # Clean the content if it has HTML formatting
            content = self.clean_html_content(msg['content'])
            
            formatted_text += f"[{formatted_date}] {role}:\n"
            formatted_text += f"{content}\n\n"
            
            # Add citations if they exist
            if msg.get('citations') and len(msg['citations']) > 0:
                formatted_text += "Sources:\n"
                for i, citation in enumerate(msg['citations'], 1):
                    formatted_text += f"  {i}. {citation.get('source_file', 'Unknown')}"
                    if citation.get('page_number'):
                        formatted_text += f", Page: {citation['page_number']}"
                    formatted_text += "\n"
                formatted_text += "\n"
                
        return formatted_text
        
    def generate_filename(self, conversation=None, date_range=None):
            """Generate appropriate filename based on download type"""
            timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
            
            if conversation:
                # Single conversation download
                title = conversation.title or f"Chat_{conversation.conversation_id[:8]}"
                # Replace spaces and special chars for filename safety
                safe_title = "".join([c if c.isalnum() else "_" for c in title])
                return f"{safe_title}_{timestamp}"
            
            if date_range:
                # Date range download
                start_date = date_range.get('start_date', 'all')
                end_date = date_range.get('end_date', 'now')
                return f"Chats_{start_date}_to_{end_date}_{timestamp}"
            
            # Default filename if neither is provided
            return f"Chat_export_{timestamp}"
        
        # Update this method in the ChatDownloadView class to fix the PDF generation

    def create_pdf(self, content, title="Chat Export"):
        """
        Create a PDF file from the provided content with improved handling of user messages
        """
        try:
            from reportlab.lib.pagesizes import letter, A4
            from reportlab.lib import colors
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
            from reportlab.lib.units import inch
            
            buffer = BytesIO()
            
            # Create the PDF document
            doc = SimpleDocTemplate(
                buffer,
                pagesize=A4,
                rightMargin=72,
                leftMargin=72,
                topMargin=72,
                bottomMargin=72
            )
            
            # Define styles
            styles = getSampleStyleSheet()
            styleN = styles["BodyText"]
            styleH = styles["Heading1"]
            styleH2 = styles["Heading2"]
            styleH3 = styles["Heading3"]
            
            # Create a custom style for user messages
            user_style = ParagraphStyle(
                name='UserStyle',
                parent=styles['BodyText'],
                fontName='Helvetica-Bold',
                fontSize=10,
                textColor=colors.blue
            )
            
            # Create a custom style for assistant messages
            assistant_style = ParagraphStyle(
                name='AssistantStyle',
                parent=styles['BodyText'],
                fontSize=10
            )
            
            # Create a custom style for citations
            citation_style = ParagraphStyle(
                name='CitationStyle',
                parent=styles['BodyText'],
                fontSize=8,
                textColor=colors.gray
            )
            
            # Create the content elements
            elements = []
            
            # Add title
            elements.append(Paragraph(title, styleH))
            elements.append(Spacer(1, 0.25*inch))
            
            # Process content by parsing our text formatting
            if isinstance(content, list):
                # Handle multiple conversations
                for conversation in content:
                    elements.append(Paragraph(f"Conversation: {conversation['title']}", styleH2))
                    elements.append(Paragraph(f"Date: {conversation['created_at']}", styleN))
                    elements.append(Spacer(1, 0.1*inch))
                    
                    for message in conversation['messages']:
                        # Message header
                        role = "You" if message['role'] == 'user' else "Assistant"
                        elements.append(Paragraph(f"[{message['created_at']}] {role}:", styleH3))
                        
                        # Choose style based on role
                        current_style = user_style if message['role'] == 'user' else assistant_style
                        
                        # Message content - split paragraphs
                        paragraphs = self.clean_html_content(message['content']).split('\n\n')
                        for para in paragraphs:
                            if para.strip():
                                elements.append(Paragraph(para, current_style))
                                elements.append(Spacer(1, 0.05*inch))
                        
                        # Add citations if they exist
                        if message.get('citations') and len(message['citations']) > 0:
                            citation_text = "Sources: "
                            citations = []
                            for i, citation in enumerate(message['citations'], 1):
                                source = citation.get('source_file', 'Unknown')
                                page = citation.get('page_number', '')
                                if page:
                                    citations.append(f"{i}. {source}, Page: {page}")
                                else:
                                    citations.append(f"{i}. {source}")
                            
                            elements.append(Paragraph(", ".join(citations), citation_style))
                        
                        elements.append(Spacer(1, 0.2*inch))
                    
                    elements.append(Spacer(1, 0.5*inch))
            else:
                # Single conversation as formatted text - parse line by line for better control
                lines = content.split('\n')
                i = 0
                while i < len(lines):
                    line = lines[i].strip()
                    
                    if not line:
                        i += 1
                        continue
                    
                    # Check if this line is a message header
                    header_match = re.match(r'\[(.*?)\] (You|Assistant):', line)
                    if header_match:
                        timestamp, role = header_match.groups()
                        elements.append(Paragraph(f"[{timestamp}] {role}:", styleH3))
                        
                        # Set current style based on role
                        current_style = user_style if role == "You" else assistant_style
                        
                        # Move to next line to start collecting message content
                        i += 1
                        message_content = []
                        
                        # Collect all lines until next header or sources
                        while i < len(lines) and not re.match(r'\[(.*?)\] (You|Assistant):', lines[i]) and not lines[i].startswith("Sources:"):
                            if lines[i].strip():
                                message_content.append(lines[i])
                            i += 1
                        
                        # Join message content and split into paragraphs
                        if message_content:
                            para_text = "\n".join(message_content)
                            paragraphs = para_text.split('\n\n')
                            for para in paragraphs:
                                if para.strip():
                                    elements.append(Paragraph(para, current_style))
                                    elements.append(Spacer(1, 0.05*inch))
                        
                        # Check if next line is Sources
                        if i < len(lines) and lines[i].startswith("Sources:"):
                            elements.append(Paragraph(lines[i], citation_style))
                            i += 1
                            # Include additional source lines
                            while i < len(lines) and lines[i].strip() and not re.match(r'\[(.*?)\] (You|Assistant):', lines[i]):
                                elements.append(Paragraph(lines[i], citation_style))
                                i += 1
                    else:
                        # For any other type of line, just add it as regular text
                        elements.append(Paragraph(line, styleN))
                        i += 1
                
            # Build the PDF
            doc.build(elements)
            
            # Get the value of the BytesIO buffer
            pdf = buffer.getvalue()
            buffer.close()
            
            return pdf
            
        except Exception as e:
            print(f"Error creating PDF: {str(e)}")
            # Return a simple error PDF
            try:
                buffer = BytesIO()
                doc = SimpleDocTemplate(buffer, pagesize=letter)
                styles = getSampleStyleSheet()
                elements = []
                elements.append(Paragraph(f"Error creating PDF: {str(e)}", styles["Heading1"]))
                doc.build(elements)
                pdf = buffer.getvalue()
                buffer.close()
                return pdf
            except:
                # If even the error PDF fails, return a placeholder
                return b"PDF generation failed"
    
    def post(self, request):
        user = request.user
        conversation_id = request.data.get('conversation_id')
        date_range = request.data.get('date_range')
        format_type = request.data.get('format', 'txt').lower()
        main_project_id = request.data.get('main_project_id')
        
        if not main_project_id:
            return Response({
                'error': 'Main project ID is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate format type
        if format_type not in ['txt', 'json', 'csv', 'pdf']:
            return Response({
                'error': 'Invalid format. Supported formats: txt, json, csv, pdf'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            if conversation_id:
                # Download a single conversation
                try:
                    conversation = ChatHistory.objects.get(
                        conversation_id=conversation_id,
                        user=user,
                        main_project_id=main_project_id
                    )
                except ChatHistory.DoesNotExist:
                    return Response({
                        'error': 'Conversation not found'
                    }, status=status.HTTP_404_NOT_FOUND)
                
                # Get all messages for this conversation
                messages = conversation.messages.all().order_by('created_at')
                
                # Format messages for download
                message_list = [
                    {
                        'role': message.role,
                        'content': message.content,
                        'created_at': message.created_at.strftime('%Y-%m-%d %H:%M'),
                        'citations': message.citations or []
                    } for message in messages
                ]
                
                filename = self.generate_filename(conversation)
                title = conversation.title or f"Chat {conversation.conversation_id[:8]}"
                
            elif date_range:
                # Download conversations within date range
                start_date = date_range.get('start_date')
                end_date = date_range.get('end_date')
                
                # Build query for conversations within date range
                query = {
                    'user': user,
                    'main_project_id': main_project_id
                }
                
                if start_date:
                    query['created_at__gte'] = start_date
                
                if end_date:
                    query['created_at__lte'] = end_date
                
                # Get conversations matching the criteria
                conversations = ChatHistory.objects.filter(**query).order_by('-created_at')
                
                if not conversations.exists():
                    return Response({
                        'error': 'No conversations found within specified date range'
                    }, status=status.HTTP_404_NOT_FOUND)
                
                # Initialize data structure for all conversations
                all_conversations = []
                
                # Get messages for each conversation
                for conv in conversations:
                    messages = conv.messages.all().order_by('created_at')
                    
                    message_list = [
                        {
                            'role': message.role,
                            'content': message.content,
                            'created_at': message.created_at.strftime('%Y-%m-%d %H:%M'),
                            'citations': message.citations or []
                        } for message in messages
                    ]
                    
                    all_conversations.append({
                        'conversation_id': str(conv.conversation_id),
                        'title': conv.title or f"Chat from {conv.created_at.strftime('%Y-%m-%d %H:%M')}",
                        'created_at': conv.created_at.strftime('%Y-%m-%d %H:%M'),
                        'messages': message_list
                    })
                
                filename = self.generate_filename(date_range=date_range)
                message_list = all_conversations  # Use the full conversation structure
                title = f"Chats from {start_date or 'all time'} to {end_date or 'present'}"
                
            else:
                return Response({
                    'error': 'Either conversation_id or date_range must be provided'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Generate download file based on requested format
            if format_type == 'json':
                # JSON format
                json_data = json.dumps(message_list, indent=2)
                response = HttpResponse(json_data, content_type='application/json')
                response['Content-Disposition'] = f'attachment; filename="{filename}.json"'
                
            elif format_type == 'csv':
                # CSV format
                csv_buffer = StringIO()
                csv_writer = csv.writer(csv_buffer)
                
                if conversation_id:
                    # Single conversation CSV format
                    csv_writer.writerow(['Timestamp', 'Role', 'Content', 'Citations'])
                    
                    for msg in message_list:
                        # Clean HTML from content
                        clean_content = self.clean_html_content(msg['content'])
                        citations = ', '.join([f"{c.get('source_file', 'Unknown')}" for c in msg.get('citations', [])])
                        csv_writer.writerow([
                            msg['created_at'],
                            'You' if msg['role'] == 'user' else 'Assistant',
                            clean_content,
                            citations
                        ])
                else:
                    # Multiple conversations CSV format
                    csv_writer.writerow(['Conversation', 'Timestamp', 'Role', 'Content', 'Citations'])
                    
                    for conv in message_list:
                        for msg in conv['messages']:
                            # Clean HTML from content
                            clean_content = self.clean_html_content(msg['content'])
                            citations = ', '.join([f"{c.get('source_file', 'Unknown')}" for c in msg.get('citations', [])])
                            csv_writer.writerow([
                                conv['title'],
                                msg['created_at'],
                                'You' if msg['role'] == 'user' else 'Assistant',
                                clean_content,
                                citations
                            ])
                
                response = HttpResponse(csv_buffer.getvalue(), content_type='text/csv')
                response['Content-Disposition'] = f'attachment; filename="{filename}.csv"'
            
            elif format_type == 'pdf':
                # PDF format
                if conversation_id:
                    # Single conversation
                    formatted_text = self.format_messages_for_download(message_list, 'txt')
                    pdf_content = self.create_pdf(formatted_text, title)
                else:
                    # Multiple conversations
                    pdf_content = self.create_pdf(message_list, title)
                
                response = HttpResponse(pdf_content, content_type='application/pdf')
                response['Content-Disposition'] = f'attachment; filename="{filename}.pdf"'
                
            else:
                # Default: TXT format
                if conversation_id:
                    # Single conversation
                    formatted_text = self.format_messages_for_download(message_list, format_type)
                else:
                    # Multiple conversations
                    formatted_text = ""
                    for conv in message_list:
                        formatted_text += f"=== {conv['title']} ===\n"
                        formatted_text += f"Date: {conv['created_at']}\n\n"
                        formatted_text += self.format_messages_for_download(conv['messages'], format_type)
                        formatted_text += "\n\n" + "="*50 + "\n\n"
                
                response = HttpResponse(formatted_text, content_type='text/plain')
                response['Content-Disposition'] = f'attachment; filename="{filename}.txt"'
            
            return response
            
        except Exception as e:
            print(f"Error downloading chat: {str(e)}")
            return Response({
                'error': f'Failed to download chat: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

class GenerateIdeaContextView(APIView):
    """
    API endpoint to extract structured idea generation parameters
    from documents or query results.
    """
   
    def post(self, request):
        user = request.user
        document_id = request.data.get('document_id')
        query = request.data.get('query')
        main_project_id = request.data.get('main_project_id')
       
        # Validate input - need either document_id or query
        if not document_id and not query:
            return Response({
                'error': 'Either document_id or query parameter is required'
            }, status=status.HTTP_400_BAD_REQUEST)
           
        try:
            # Case 1: Using Document ID - fetch existing parameters or extract new ones
            if document_id:
                document = get_object_or_404(Document, id=document_id, user=user)
                
                # Get document name without extension
                document_name_no_ext = self.remove_file_extension(document.filename)
                
                # Generate a unique project name - handle the case when main_project_id is None
                suggested_project_name = f"Ideas from {document_name_no_ext}"
                if main_project_id:
                    try:
                        suggested_project_name = self.generate_unique_project_name(document_name_no_ext, main_project_id)
                    except Exception as e:
                        # Log the error but continue with the default name
                        print(f"Error generating unique project name: {str(e)}")
               
                try:
                    # Check if we already have parameters stored
                    processed_index = ProcessedIndex.objects.get(document=document)
                   
                    # If parameters exist, return them
                    if processed_index.idea_parameters:
                        return Response({
                            'document_id': document_id,
                            'document_name': document.filename,
                            'document_name_no_ext': document_name_no_ext,
                            'idea_parameters': processed_index.idea_parameters,
                            'suggested_project_name': suggested_project_name
                        })
                   
                    # If no parameters yet, extract them from the document
                    index_file = processed_index.faiss_index
                    metadata_file = processed_index.metadata
                   
                    # Load index and metadata
                    index, chunks = self.load_faiss_index_from_paths(index_file, metadata_file)
                   
                    # Extract parameters from document content
                    full_text = " ".join([chunk['text'] for chunk in chunks])
                    idea_params = self.extract_idea_parameters(full_text, chunks)
                   
                    # Save the parameters for future use
                    processed_index.idea_parameters = idea_params
                    processed_index.save()
                   
                    return Response({
                        'document_id': document_id,
                        'document_name': document.filename,
                        'document_name_no_ext': document_name_no_ext,
                        'idea_parameters': idea_params,
                        'suggested_project_name': suggested_project_name
                    })
                   
                except ProcessedIndex.DoesNotExist:
                    return Response({
                        'error': 'Document has not been processed yet'
                    }, status=status.HTTP_404_NOT_FOUND)
           
            # Case 2: Using Query - search across documents and extract from relevant chunks
            else:
                # Get active/selected document
                active_doc_id = request.session.get('active_document_id')
                if not active_doc_id:
                    return Response({
                        'error': 'No active document selected'
                    }, status=status.HTTP_400_BAD_REQUEST)
               
                document = get_object_or_404(Document, id=active_doc_id, user=user)
                processed_index = get_object_or_404(ProcessedIndex, document=document)
                
                # Get document name without extension
                document_name_no_ext = self.remove_file_extension(document.filename)
                
                # Generate a unique project name - handle the case when main_project_id is None
                suggested_project_name = f"Ideas from {document_name_no_ext}"
                if main_project_id:
                    try:
                        suggested_project_name = self.generate_unique_project_name(document_name_no_ext, main_project_id)
                    except Exception as e:
                        # Log the error but continue with the default name
                        print(f"Error generating unique project name: {str(e)}")
               
                # Load index and metadata
                index_file = processed_index.faiss_index
                metadata_file = processed_index.metadata
                index, chunks = self.load_faiss_index_from_paths(index_file, metadata_file)
               
                # Get embedding for query
                query_embedding = self.get_query_embedding(query)
               
                # Search for relevant chunks
                relevant_chunks = self.search_faiss_index(index, chunks, query_embedding, k=5)
               
                # Extract parameters from relevant chunks
                idea_params = self.extract_idea_parameters(query, relevant_chunks)
               
                return Response({
                    'document_id': active_doc_id,
                    'document_name': document.filename,
                    'document_name_no_ext': document_name_no_ext,
                    'query': query,
                    'idea_parameters': idea_params,
                    'suggested_project_name': suggested_project_name
                })
               
        except Exception as e:
            print(f"Error generating idea context: {str(e)}")
            return Response({
                'error': str(e),
                'detail': 'An error occurred while generating idea context'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def remove_file_extension(self, filename):
        """
        Remove file extension from filename
        """
        import os
        return os.path.splitext(filename)[0]
    
    def generate_unique_project_name(self, document_name, main_project_id):
        """
        Generate a unique project name based on document name,
        adding (1), (2), etc. if needed to avoid duplicates
        """
        from ideaGen.models import Project
        
        base_name = f"Ideas from {document_name}"
        project_name = base_name
        counter = 1
        
        # Check for existing projects with this name in the main project
        while Project.objects.filter(
            name=project_name,
            main_project_id=main_project_id
        ).exists():
            # Increment counter and update name
            project_name = f"{base_name} ({counter})"
            counter += 1
            
        return project_name
   
    def load_faiss_index_from_paths(self, index_file, metadata_file):
        """Load FAISS index and metadata from file paths"""
        import faiss
        import pickle
       
        try:
            index = faiss.read_index(index_file)
            with open(metadata_file, "rb") as f:
                chunks = pickle.load(f)
            return index, chunks
        except Exception as e:
            print(f"Error loading FAISS index: {str(e)}")
            return None, []
   
    def get_query_embedding(self, query):
        """Get embedding for the query"""
        from openai import OpenAI
        client = OpenAI()  # Initialize the client
       
        try:
            response = client.embeddings.create(
                input=[query],
                model="text-embedding-3-small"
            )
            return response.data[0].embedding
        except Exception as e:
            print(f"Error getting embedding for query: {str(e)}")
            raise
   
    def search_faiss_index(self, index, chunks, query_embedding, k=5):
        """Search FAISS index for relevant chunks"""
        import numpy as np
       
        # Convert embedding to numpy array
        query_vector = np.array([query_embedding]).astype('float32')
       
        # Search index
        distances, indices = index.search(query_vector, k=k)
       
        # Get relevant chunks
        results = []
        for i in indices[0]:
            if i < len(chunks):
                results.append(chunks[i])
       
        return results
   
    def extract_idea_parameters(self, context, relevant_chunks=None):
        """
        Extract structured parameters for the Idea Generator
       
        Args:
            context (str): Either full document content or query
            relevant_chunks (list, optional): List of relevant chunks from search
           
        Returns:
            dict: Structured parameters for idea generation
        """
        from openai import OpenAI
        client = OpenAI()  # Initialize the client
        import json
       
        try:
            # If relevant chunks are provided, use them for extraction context
            if relevant_chunks and len(relevant_chunks) > 0:
                extraction_context = "\n\n".join([chunk['text'] for chunk in relevant_chunks])
            else:
                # If no chunks available, use the context directly
                extraction_context = context
               
            # Create extraction prompt
            extraction_prompt = f"""
            Extract the following key parameters from the provided context.
            If a parameter isn't explicitly mentioned, infer it from context or leave it blank.
           
            Context:
            {extraction_context}
           
            Extract these parameters:
            - Brand_Name: The company or product brand mentioned
            - Category: The product category or market area
            - Concept: The main idea, campaign, or product concept
            - Benefits: Key benefits or value propositions (list up to 3)
            - RTB: Reason to Believe - evidence supporting the benefits (list up to 3)
            - Ingredients: Key ingredients or components (if applicable)
            - Features: Notable product/service features (list up to 3)
            - Theme: Overall theme or tone
            - Demographics: Target audience demographics
           
            Format the response as a valid JSON object with these fields.
            """
           
            # Call LLM to extract parameters
            response = client.chat.completions.create(
                model="gpt-4o",  
                messages=[
                    {"role": "system", "content": "You are a specialist in extracting structured information from documents."},
                    {"role": "user", "content": extraction_prompt}
                ],
                response_format={"type": "json_object"}
            )
           
            # Parse JSON response
            extracted_params = json.loads(response.choices[0].message.content)
           
            return extracted_params
       
        except Exception as e:
            print(f"Error extracting idea parameters: {str(e)}")
            # Return empty structure if extraction fails
            return {
                "Brand_Name": "",
                "Category": "",
                "Concept": "",
                "Benefits": "",
                "RTB": "",
                "Ingredients": "",
                "Features": "",
                "Theme": "",
                "Demographics": ""
            }
#  admin 

from django.db import transaction
from .models import UserAPITokens
 
class AdminUserManagementView(APIView):
    def get(self, request):
        try:
            # Check if the requesting user is an admin
            if not request.user.username == 'admin':
                return Response({
                    'error': 'Unauthorized. Only admin users can access this endpoint'
                }, status=status.HTTP_403_FORBIDDEN)
           
            # Get all users with their API tokens
            users = User.objects.all()
           
            user_data = []
            for user in users:
                # Get API tokens if they exist
                api_tokens = None
                try:
                    api_tokens = user.api_tokens
                except UserAPITokens.DoesNotExist:
                    pass

                # Get disabled modules
                try:
                    module_permissions = user.module_permissions.disabled_modules
                except (AttributeError, UserModulePermissions.DoesNotExist):
                    module_permissions = {}
                    # Create module permissions if they don't exist
                    UserModulePermissions.objects.create(user=user, disabled_modules={})
               
                user_info = {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'disabled_modules': module_permissions,
                    'api_tokens': {
                        'huggingface_token': api_tokens.huggingface_token if api_tokens else None,
                        'gemini_token': api_tokens.gemini_token if api_tokens else None,
                        'llama_token': api_tokens.llama_token if api_tokens else None  # Include Llama token
                    }
                }
                user_data.append(user_info)
           
            return Response(user_data, status=status.HTTP_200_OK)
           
        except Exception as e:
            print(f"Error in AdminUserManagementView.get: {str(e)}")
            return Response(
                {'error': f'Failed to fetch user data: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
   
    @transaction.atomic
    def post(self, request):
        try:
            # Check if the requesting user is an admin
            if not request.user.username == 'admin':
                return Response({
                    'error': 'Unauthorized. Only admin users can create new users'
                }, status=status.HTTP_403_FORBIDDEN)
           
            # Extract data from request
            username = request.data.get('username')
            email = request.data.get('email')
            password = request.data.get('password')
            huggingface_token = request.data.get('huggingface_token')
            gemini_token = request.data.get('gemini_token')
            llama_token = request.data.get('llama_token')  # Get Llama token
           
            # Validate required fields
            if not all([username, email, password]):
                return Response({
                    'error': 'Username, email, and password are required fields'
                }, status=status.HTTP_400_BAD_REQUEST)
           
            # Check if username already exists
            if User.objects.filter(username=username).exists():
                return Response({
                    'error': 'Username already exists'
                }, status=status.HTTP_400_BAD_REQUEST)
           
            # Create the user
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password
            )
           
            # Create API tokens for the user
            UserAPITokens.objects.create(
                user=user,
                huggingface_token=huggingface_token,
                gemini_token=gemini_token,
                llama_token=llama_token  # Save Llama token
            )
           
            return Response({
                'success': True,
                'message': f'User {username} created successfully',
                'user_id': user.id
            }, status=status.HTTP_201_CREATED)
           
        except Exception as e:
            print(f"Error in AdminUserManagementView.post: {str(e)}")
            return Response(
                {'error': f'Failed to create user: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
   
    @transaction.atomic
    def put(self, request):
        try:
            # Check if the requesting user is an admin
            if not request.user.username == 'admin':
                return Response({
                    'error': 'Unauthorized. Only admin users can update user data'
                }, status=status.HTTP_403_FORBIDDEN)
           
            # Extract data from request
            user_id = request.data.get('user_id')
            huggingface_token = request.data.get('huggingface_token')
            gemini_token = request.data.get('gemini_token')
            llama_token = request.data.get('llama_token')  # Get Llama token
           
            if not user_id:
                return Response({
                    'error': 'User ID is required'
                }, status=status.HTTP_400_BAD_REQUEST)
           
            # Get the user
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response({
                    'error': 'User not found'
                }, status=status.HTTP_404_NOT_FOUND)
           
            # Update API tokens
            api_tokens, created = UserAPITokens.objects.get_or_create(user=user)
           
            if huggingface_token is not None:
                api_tokens.huggingface_token = huggingface_token
           
            if gemini_token is not None:
                api_tokens.gemini_token = gemini_token
                
            if llama_token is not None:
                api_tokens.llama_token = llama_token  # Update Llama token
           
            api_tokens.save()
           
            return Response({
                'success': True,
                'message': f'API tokens for user {user.username} updated successfully'
            }, status=status.HTTP_200_OK)
           
        except Exception as e:
            print(f"Error in AdminUserManagementView.put: {str(e)}")
            return Response(
                {'error': f'Failed to update user API tokens: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
   
    @transaction.atomic
    def delete(self, request):
        try:
            # Check if the requesting user is an admin
            if not request.user.username == 'admin':
                return Response({
                    'error': 'Unauthorized. Only admin users can delete users'
                }, status=status.HTTP_403_FORBIDDEN)
           
            # Extract user_id from query parameters
            user_id = request.query_params.get('user_id')
           
            if not user_id:
                return Response({
                    'error': 'User ID is required'
                }, status=status.HTTP_400_BAD_REQUEST)
           
            # Don't allow deleting the admin user
            if User.objects.get(id=user_id).username == 'admin':
                return Response({
                    'error': 'Cannot delete the admin user'
                }, status=status.HTTP_400_BAD_REQUEST)
           
            # Get and delete the user
            try:
                user = User.objects.get(id=user_id)
                username = user.username
                user.delete()  # This will also delete related UserAPITokens due to CASCADE
               
                return Response({
                    'success': True,
                    'message': f'User {username} deleted successfully'
                }, status=status.HTTP_200_OK)
               
            except User.DoesNotExist:
                return Response({
                    'error': 'User not found'
                }, status=status.HTTP_404_NOT_FOUND)
           
        except Exception as e:
            print(f"Error in AdminUserManagementView.delete: {str(e)}")
            return Response(
                {'error': f'Failed to delete user: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class AdminUserModuleView(APIView):
    def patch(self, request, user_id):
        try:
            # Check if the requesting user is an admin
            if not request.user.username == 'admin':
                return Response({
                    'error': 'Unauthorized. Only admin users can update module permissions'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Get the user
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response({
                    'error': 'User not found'
                }, status=status.HTTP_404_NOT_FOUND)
                
            # Extract disabled_modules from request data
            disabled_modules = request.data.get('disabled_modules', {})
            
            # Get or create module permissions
            module_permissions, created = UserModulePermissions.objects.get_or_create(user=user)
            module_permissions.disabled_modules = disabled_modules
            module_permissions.save()
            
            # Get API tokens if they exist
            api_tokens = None
            try:
                api_tokens = user.api_tokens  # Assuming this relation exists
            except AttributeError:
                pass
            
            # Return updated user data
            return Response({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'disabled_modules': module_permissions.disabled_modules,
                'api_tokens': {
                    'huggingface_token': getattr(api_tokens, 'huggingface_token', None) if api_tokens else None,
                    'gemini_token': getattr(api_tokens, 'gemini_token', None) if api_tokens else None,
		            'llama_token': getattr(api_tokens, 'llama_token', None) if api_tokens else None
                }
            }, status=status.HTTP_200_OK)
                
        except Exception as e:
            print(f"Error in AdminUserModuleView.patch: {str(e)}")
            return Response(
                {'error': f'Failed to update module permissions: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# Add this to your views.py

class OriginalDocumentView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, document_id):
        try:
            # Get the document making sure it belongs to the user
            document = get_object_or_404(Document, id=document_id, user=request.user)
            
            # Get the file path
            file_path = document.file.path
            
            # Check if file exists
            if not os.path.exists(file_path):
                return Response(
                    {'error': 'Document file not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
                
            # Determine content type based on file extension
            content_type = self.get_content_type(file_path)
            
            # Create a file response
            response = FileResponse(
                open(file_path, 'rb'),
                content_type=content_type
            )
            
            # Set content disposition to attachment with the original filename
            response['Content-Disposition'] = f'inline; filename="{document.filename}"'
            
            # Log the file access
            self.log_document_view(request.user, document)
            
            return response
            
        except Exception as e:
            print(f"Error serving original document: {str(e)}")
            return Response(
                {'error': f'Failed to retrieve document: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def get_content_type(self, file_path):
        """Determine content type based on file extension"""
        extension = os.path.splitext(file_path)[1].lower()
        
        content_types = {
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.xls': 'application/vnd.ms-excel',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.ppt': 'application/vnd.ms-powerpoint',
            '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            '.txt': 'text/plain',
            '.csv': 'text/csv',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif'
        }
        
        return content_types.get(extension, 'application/octet-stream')
    
    def log_document_view(self, user, document):
        """Log document view for analytics (optional)"""
        try:
            # You can create a DocumentViewLog model to track this
            # For now, we'll just log it
            logger.info(f"User {user.username} viewed document {document.id}: {document.filename}")
            
            # If you want to track view counts, you could add this to your Document model:
            # document.view_count = F('view_count') + 1
            # document.last_viewed_at = timezone.now()
            # document.save(update_fields=['view_count', 'last_viewed_at'])
        except Exception as e:
            logger.error(f"Error logging document view: {str(e)}")
            # Don't raise the exception - this is a non-critical feature

class DocumentViewLogView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, document_id):
        """Log when a user views a document"""
        try:
            # Get the document ensuring it belongs to the user
            document = get_object_or_404(Document, id=document_id, user=request.user)
            
            # You could create a model to track this if needed
            # For example:
            # DocumentViewLog.objects.create(
            #     user=request.user,
            #     document=document,
            #     view_date=timezone.now()
            # )
            
            # For simplicity, just update the document's view count
            document.view_count = F('view_count') + 1  # This requires adding view_count field to Document model
            document.last_viewed_at = timezone.now()  # This requires adding last_viewed_at field to Document model
            document.save(update_fields=['view_count', 'last_viewed_at'])
            
            return Response({
                'success': True,
                'message': 'Document view logged successfully'
            }, status=status.HTTP_200_OK)
            
        except Document.DoesNotExist:
            return Response({
                'error': 'Document not found'
            }, status=status.HTTP_404_NOT_FOUND)
            
        except Exception as e:
            print(f"Error logging document view: {str(e)}")
            # Return success anyway - this is a non-critical feature
            return Response({
                'success': True,
                'message': 'Continued without logging view'
            }, status=status.HTTP_200_OK)



