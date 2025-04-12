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
from django.utils.deprecation import MiddlewareMixin
import google.generativeai as genai  
from .models import (
    ChatHistory,
    ChatMessage,
    Document,
    ProcessedIndex,
    UserAPITokens,
    ConversationMemoryBuffer,
    UserModulePermissions,
    UserUploadPermissions
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

from io import StringIO, BytesIO
from django.http import HttpResponse, FileResponse, JsonResponse
from django.utils import timezone
from django.utils.html import strip_tags
from django.shortcuts import get_object_or_404
from django.contrib.auth import update_session_auth_hash
from llama_parse import LlamaParse
import requests
from bs4 import BeautifulSoup
import re
from duckduckgo_search import DDGS
from urllib.parse import urlparse
import nltk
from nltk.tokenize import sent_tokenize
from django.utils.html import strip_tags
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')


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

        target_user_id = request.data.get('target_user_id')
        
        if target_user_id and request.user.username == 'admin':
            # Admin uploading for another user
            try:
                user = User.objects.get(id=target_user_id)
            except User.DoesNotExist:
                return Response({
                    'error': 'Target user not found'
                }, status=status.HTTP_404_NOT_FOUND)
        else:
            # Regular upload
            user = request.user

        try:
            permissions = UserModulePermissions.objects.get(user=user)
            if permissions.disabled_modules.get('document-upload', False):
                return Response({
                    'error': 'Document uploads are disabled for this user'
                }, status=status.HTTP_403_FORBIDDEN)
        except UserModulePermissions.DoesNotExist:
            pass

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
                        'text': chunk,  # Consistent key name 'text' for all chunks
                        'source': doc['name'],
                        'source_file': doc['name'],  # Add source_file for consistency with LlamaParse
                        'chunk_id': i
                    })
                
                # Get embeddings for all chunks
                text_chunks = [chunk['text'] for chunk in all_chunks]
                print(f"Getting embeddings for {len(text_chunks)} text chunks")
                embeddings = self.get_embeddings(text_chunks)
                
                if not embeddings:
                    raise ValueError("Failed to generate embeddings for document chunks")
                
                # Create FAISS index
                index = self.create_faiss_index(embeddings)
                
                # Generate a unique session ID for this document
                session_id = uuid.uuid4().hex
                
                # Save the index and chunks
                index_file, pickle_file = self.save_faiss_index(index, all_chunks, session_id)
                
                print(f"Document processed successfully: {len(all_chunks)} chunks created")
                
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
from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.tools.duckduckgo import DuckDuckGoTools

logger = logging.getLogger(__name__)

class ChatView(APIView):
    permission_classes = [IsAuthenticated]

    def __init__(self, post_process_func=post_process_response):
        self.post_process_func = post_process_func
        self.agent = Agent(
                model=OpenAIChat(id="gpt-4o"),
                description="""You are a helpful, friendly AI assistant providing informative and thoughtful responses.
                Use semantic HTML tags for structure (<b>, <p>, <ul>, <li>) to enhance readability.
                Maintain a natural, conversational tone.
                Provide comprehensive and clear explanations, breaking down complex topics into easily understandable sections.
                When using web search, prioritize recent, reliable, and relevant information to support your responses.""",
                tools=[DuckDuckGoTools()],
                show_tool_calls=True,
                markdown=True
            )

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

            # Extract response_length preference (new parameter)
            response_length = request.data.get('response_length', 'comprehensive')
            
            # Extract response_format parameter or default to 'natural'
            response_format = request.data.get('response_format', 'natural')

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

            conversation_context = ""
            if conversation_id:
                try:
                    # Try to get existing conversation
                    conversation = ChatHistory.objects.get(
                        conversation_id=conversation_id,
                        user=user
                    )
                    
                    # Get last 5 conversation messages (max 10 messages = 5 turns)
                    recent_messages = ChatMessage.objects.filter(
                        chat_history=conversation
                    ).order_by('-created_at')[:10]
                    
                    # Format for context
                    if recent_messages:
                        context_messages = []
                        for msg in recent_messages:
                            prefix = "User: " if msg.role == 'user' else "Assistant: "
                            context_messages.append(f"{prefix}{msg.content[:150]}...")
                        
                        conversation_context = "Previous conversation:\n" + "\n".join(reversed(context_messages))
                    
                    # Try to get memory buffer
                    try:
                        memory_buffer = ConversationMemoryBuffer.objects.get(conversation=conversation)
                        if memory_buffer.context_summary:
                            conversation_context += f"\n\nConversation Summary: {memory_buffer.context_summary}"
                    except ConversationMemoryBuffer.DoesNotExist:
                        # No memory buffer yet, that's fine
                        pass
                        
                except ChatHistory.DoesNotExist:
                    # No conversation yet, that's fine
                    pass
            
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

            # Log the inputs for debugging
            print(f"Chat request received")
            print(f"Message: {message}")
            print(f"General chat mode: {general_chat_mode}")
            print(f"Use web knowledge: {use_web_knowledge}")
            print(f"Selected documents: {selected_documents}")
            print(f"Response format: {response_format}")
            print(f"Response length: {response_length}")
            print(f"Has conversation context: {bool(conversation_context)}")

            # Process document search early to get context for format detection
            all_chunks = []
            content_sources = []
            similar_contents = []  # Store document content separately
            
            if not general_chat_mode:
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
                        
                    # Log the processed docs for debugging
                    print(f"Found {processed_docs.count()} processed documents")
                    for doc in processed_docs:
                        print(f"Document: {doc.document.filename}")
                        print(f"FAISS index path: {doc.faiss_index}")
                        print(f"Metadata path: {doc.metadata}")
                        print(f"Markdown path: {doc.markdown_path}")
                        
                except Exception as e:
                    print(f"Error fetching documents: {str(e)}")
                    return Response(
                        {'error': f'Document retrieval error: {str(e)}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Create a merged metadata store from all selected documents
                all_metadata_store = []
                
                # Load FAISS indices and chunks for all selected documents
                for proc_doc in processed_docs:
                    if not proc_doc.faiss_index or not proc_doc.metadata:
                        print(f"Missing index or metadata for {proc_doc.document.filename}")
                        continue
                    
                    if not os.path.exists(proc_doc.faiss_index) or not os.path.exists(proc_doc.metadata):
                        print(f"Index or metadata file does not exist for {proc_doc.document.filename}")
                        continue
                    
                    # Check if this is a LlamaParse document with direct markdown access
                    if proc_doc.markdown_path and os.path.exists(proc_doc.markdown_path):
                        print(f"Found LlamaParse markdown for {proc_doc.document.filename}")
                        # Add dummy entry that will be handled by search_similar_content
                        all_metadata_store.append({
                            'is_llamaparse': True,
                            'source_file': proc_doc.document.filename,
                            'document_id': proc_doc.document.id
                        })
                    
                    # Load metadata - this is needed for both LlamaParse and simple documents
                    try:
                        with open(proc_doc.metadata, 'rb') as f:
                            chunks = pickle.load(f)
                        
                        # Validate the chunks format
                        if not isinstance(chunks, list):
                            print(f"Warning: chunks is not a list for {proc_doc.document.filename}, type: {type(chunks)}")
                            if chunks:  # If it's a non-empty object, try to adapt it
                                chunks = [chunks]
                            else:
                                chunks = []
                        
                        # Add document source information to each chunk
                        for chunk in chunks:
                            if isinstance(chunk, dict):
                                if 'source_file' not in chunk:
                                    chunk['source_file'] = proc_doc.document.filename
                                
                                # Ensure 'text' key exists
                                if 'text' not in chunk:
                                    for key in ['content', 'document_content', 'chunk_text']:
                                        if key in chunk:
                                            chunk['text'] = chunk[key]
                                            break
                                            
                        # Add to all metadata store
                        print(f"Adding {len(chunks)} chunks from {proc_doc.document.filename}")
                        all_metadata_store.extend(chunks)
                        
                    except Exception as e:
                        print(f"Error loading metadata for {proc_doc.document.filename}: {str(e)}")
                        continue
                
                # Now search using the improved approach
                if all_metadata_store:
                    print(f"Searching in {len(all_metadata_store)} chunks across all documents")
                    # Get relevant content based on query
                    similar_contents, content_sources = self.search_similar_content(
                        message, 
                        processed_docs,
                        all_metadata_store
                    )
                    
                    if similar_contents:
                        print(f"Found {len(similar_contents)} relevant content chunks")
                        all_chunks = [{'text': content, 'source': source} for content, source in zip(similar_contents, content_sources)]
                    else:
                        print("No relevant content found in documents")
                        all_chunks = []
                else:
                    print("No metadata found for any document")
                    all_chunks = []
            
            # Check if we should auto-detect the response format
            if response_format == 'auto_detect':
                context_snippets = [chunk.get('text', '') for chunk in all_chunks[:5]] if all_chunks else []
                detected_format, secondary_format, confidence = self.detect_question_format(message, context_snippets)
                
                # Use the detected format if confidence is reasonable, otherwise default to 'natural'
                if confidence >= 5.0:
                    response_format = detected_format
                    print(f"Auto-detected format: {response_format} (confidence: {confidence})")
                else:
                    response_format = 'natural'
                    print(f"Low confidence in format detection ({confidence}), defaulting to 'natural'")
            
            # Get answer based on mode
            web_knowledge_response = None
            web_sources = []
            
            # Get answer based on mode
            if general_chat_mode:
                # Process request in general chat mode (no documents needed)
                answer = self.get_general_chat_answer(message, use_web_knowledge, response_length, response_format)
                print("Generated response using general chat mode")
            else:
                # Process with documents
                if all_chunks:
                    # First, generate document-based answer
                    if response_length == 'short':
                        document_answer = self.generate_short_response(message, similar_contents, content_sources, False, response_format, conversation_context)
                    else:  # Default to comprehensive
                        document_answer = self.generate_response(message, similar_contents, content_sources, False, response_format, conversation_context)
                    
                    print(f"Generated document-based answer using {response_length} response length")
                    
                    # If web knowledge is requested, get web response using document context to enhance the query
                    if use_web_knowledge:
                        web_knowledge_response, web_sources = self.get_web_knowledge_response(
                            message, 
                            document_context=similar_contents  # Pass document context to enhance web search
                        )
                        print(f"Web knowledge response received with document context, source count: {len(web_sources)}")
                        
                        # Combine document and web responses
                        answer = self.combine_document_and_web_responses(
                            message, 
                            document_answer, 
                            web_knowledge_response, 
                            content_sources, 
                            web_sources,
                            response_format,
                            conversation_context
                        )
                        print("Combined document and web responses")
                    else:
                        # Just use document answer
                        answer = document_answer
                else:
                    # No document content found
                    if use_web_knowledge:
                        # Only web knowledge available
                        web_knowledge_response, web_sources = self.get_web_knowledge_response(message)
                        answer = web_knowledge_response
                        print("Using web knowledge response as document search returned no results")
                    else:
                        print("No document content found and web knowledge not enabled")
                        answer = "I couldn't find any relevant information in the documents."
            
            # Extract main response and citation info (if any)
            if "\n\n*Sources:" in answer:
                parts = answer.split("\n\n*Sources:")
                clean_response = parts[0]
                source_info = parts[1].split('*\n')[0] if len(parts) > 1 else ""
            else:
                clean_response = answer
                source_info = "Web search results" if use_web_knowledge else ""
            
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
                
                # Add web citations if applicable
                if use_web_knowledge and web_sources:
                    for idx, source in enumerate(web_sources):
                        citations.append({
                            'source_file': source.get('title', 'Web Source'),
                            'page_number': 'Web',
                            'section_title': 'Web Search Result',
                            'snippet': source.get('snippet', '')[:200] + "..." if source.get('snippet', '') else "Web content",
                            'document_id': f"web_{idx}",
                            'url': source.get('url', '')
                        })

            # Prepare conversation details
            conversation_id = conversation_id or str(uuid.uuid4())
            title = f"Chat {datetime.now().strftime('%Y-%m-%d %H:%M')}"

            # Create or retrieve conversation
            if conversation_id:
                conversation, created = ChatHistory.objects.get_or_create(
                    user=user,
                    conversation_id=conversation_id,
                    main_project_id=main_project_id,
                    defaults={
                        'title': f"Chat {datetime.now().strftime('%Y-%m-%d %H:%M')}",
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
                citations=citations,
                use_web_knowledge=use_web_knowledge,
                response_length=response_length,
                response_format=response_format
            )


            # Update or create memory buffer
            memory_buffer, created = ConversationMemoryBuffer.objects.get_or_create(
                conversation=conversation
            )
            
            # Get all messages for this conversation
            all_messages = ChatMessage.objects.filter(
                chat_history=conversation
            ).order_by('created_at')
            
            # Update memory with all messages
            memory_buffer.update_memory(all_messages)

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
                'general_chat_mode': general_chat_mode,
                'response_length': response_length,  # Include in response for tracking
                'response_format': response_format   # Include detected/used format in response
            }

            # Print detailed chat response information
            print("\n--- Chat Interaction Logged ---")
            print(f"User Question: {message}")
            print(f"Mode: {'Web Knowledge' if use_web_knowledge else 'General Chat' if general_chat_mode else 'Document Chat'}")
            print(f"Format: {response_format}")
            print(f"Length: {response_length}")
            print(f"Assistant Response: {clean_response[:500]}...")  # First 500 chars
            print(f"Citation count: {len(citations)}")
            print(f"Follow-up Questions: {len(follow_up_questions)}")
            print("-----------------------------\n")

            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Unexpected error in ChatView: {str(e)}", exc_info=True)
            return Response(
                {'error': f'An unexpected error occurred: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def get_web_knowledge_response(self, query, document_context=None):
        """
        Search the web for information and generate a response, using document context to enhance the search.
        
        Args:
            query (str): The user's query
            document_context (list, optional): List of context chunks from document search
            
        Returns:
            tuple: (response, sources)
        """
        try:
            # Step 1: Extract keywords and context from document context if available
            enhanced_query = query
            doc_context_text = ""
            
            if document_context and len(document_context) > 0:
                # Combine all document context into a single text for analysis
                combined_context = " ".join(document_context[:3])  # Use top 3 context chunks
                
                # Extract keywords using a smarter prompt that identifies entity types
                keyword_prompt = f"""
                Analyze the following document context and the user query to extract key information for a web search.

                USER QUERY: "{query}"
                
                DOCUMENT CONTEXT:
                {combined_context[:2500]}
                
                Follow these steps:
                1. Identify the main entities (brands, products, organizations, etc.) in the document
                2. For each entity, determine its type (e.g., "cosmetic brand", "financial service", "software company")
                3. Extract distinctive attributes or features of these entities
                4. Identify industry-specific terminology that might help with search precision
                5. Include geographical context if relevant
                
                Return ONLY a comma-separated list of 5-8 search terms that would help find the most relevant information online.
                
                Note: Focus on terms that will disambiguate search results and prevent confusion with similarly-named but unrelated entities.
                """
                
                try:
                    # Extract context-aware keywords using OpenAI
                    keyword_response = client.chat.completions.create(
                        model="gpt-3.5-turbo",  # Using a smaller model for efficiency
                        messages=[
                            {"role": "system", "content": "You are a search optimization specialist who identifies the most effective search terms based on document context."},
                            {"role": "user", "content": keyword_prompt}
                        ],
                        temperature=0.3,
                        max_tokens=150
                    )
                    
                    search_terms = keyword_response.choices[0].message.content.strip()
                    logger.info(f"Extracted search terms: {search_terms}")
                    
                    # Create a more precise enhanced query that includes both the original query and the extracted search terms
                    enhanced_query = f"{query} {search_terms}"
                    
                    # Also extract key passages for the context section of our prompt
                    context_prompt = f"""
                    Analyze the following document context and select 2-3 short passages (2-3 sentences each) that contain the most important information related to this query: "{query}"
                    
                    DOCUMENT CONTEXT:
                    {combined_context[:3000]}
                    
                    Return ONLY the extracted passages with no additional commentary.
                    """
                    
                    context_response = client.chat.completions.create(
                        model="gpt-3.5-turbo",
                        messages=[
                            {"role": "system", "content": "You extract the most relevant passages from documents."},
                            {"role": "user", "content": context_prompt}
                        ],
                        temperature=0.3,
                        max_tokens=300
                    )
                    
                    # Get key passages for later use in the main prompt
                    doc_context_text = context_response.choices[0].message.content.strip()
                    logger.info(f"Extracted key passages for context")
                    
                except Exception as ke:
                    logger.warning(f"Error extracting keywords: {str(ke)}, proceeding with original query")
                    enhanced_query = query
            
            # Log the queries for comparison
            logger.info(f"Original query: {query}")
            logger.info(f"Enhanced query: {enhanced_query}")
            
            # Step 2: Search the web using the enhanced query
            web_results = self.search_web(enhanced_query, max_results=5)
            
            if not web_results:
                return "I couldn't find relevant information on the web for your query.", []
            
            # Step 3: Scrape content from the top search results
            scraped_contents = []
            web_sources = []
            
            for result in web_results:
                try:
                    # Extract content from the webpage
                    scraped_content = self.scrape_webpage(result['href'])
                    
                    if scraped_content and scraped_content.get('content'):
                        scraped_contents.append(scraped_content)
                        
                        # Store source information
                        web_sources.append({
                            'title': scraped_content.get('title', result.get('title', 'Unknown')),
                            'url': result.get('href', ''),
                            'snippet': result.get('body', '')[:300]  # First 300 chars of snippet
                        })
                except Exception as e:
                    logger.error(f"Error scraping {result.get('href')}: {str(e)}")
                    continue
            
            if not scraped_contents:
                return "I found search results but couldn't extract useful content from the webpages.", []
            
            # Step 4: Generate a response using the scraped content and document context
            # Prepare context from scraped contents
            web_context = ""
            for i, item in enumerate(scraped_contents, 1):
                web_context += f"Source {i} ({self.extract_domain(item['url'])}):\n"
                web_context += f"Title: {item['title']}\n"
                web_context += f"Content: {item['content'][:2500]}...\n\n"  # Limit each source content
            
            # Prepare document context section if available
            doc_context_section = ""
            if doc_context_text:
                doc_context_section = f"""
                KEY DOCUMENT PASSAGES:
                {doc_context_text}
                
                Use this document information to better understand the context of the question and ensure relevance in your response.
                If the web sources provide different or contradictory information to what's in the documents, highlight this in your response.
                If the web sources expand on concepts mentioned in the documents, explain how they add to the understanding.
                """
            
            # Create the prompt for OpenAI
            prompt = f"""
            You are a research assistant analyzing information from both web sources and existing document knowledge.

            QUESTION: {query}

            {doc_context_section}

            INFORMATION FROM WEB SOURCES:
            {web_context}

            INSTRUCTIONS:
            1. Primarily use the web sources to provide information relevant to the question.
            2. When applicable, connect web information with document context to provide a comprehensive answer.
            3. The web information should complement, expand, or update what's known from the documents.
            4. If the web sources don't directly address aspects of the question that were covered in the documents, acknowledge this.
            5. If the web sources contradict information from the documents, present both perspectives.
            6. Structure your response with clear sections differentiating document and web information.

            FORMAT:
            - Use <b> tags for headings
            - Use <p> tags for paragraphs
            - Use <ul> and <li> tags for lists
            - Organize information logically and clearly
            """
            
            system_message = "You are an expert research analyst who synthesizes information from multiple sources to provide comprehensive answers."
            
            # Generate response using OpenAI
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=2000
            )
            
            web_response = response.choices[0].message.content
            
            # Add source information
            source_domains = [self.extract_domain(source['url']) for source in web_sources]
            source_info = ", ".join(source_domains)
            
            return f"{web_response}\n\n*Sources: {source_info}*", web_sources
            
        except Exception as e:
            logger.error(f"Error in web knowledge search: {str(e)}", exc_info=True)
            return f"An error occurred while searching the web: {str(e)}", []
    
    def search_web(self, query, max_results=5):
        """Search the web using DuckDuckGo and return results"""
        try:
            results = DDGS().text(query, max_results=max_results)
            if not results:
                logger.warning("No search results found for query: " + query)
                return []
            return list(results)
        except Exception as e:
            logger.error(f"Error searching the web: {str(e)}")
            return []
    
    def scrape_webpage(self, url):
        """Scrape content from a webpage"""
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59'
            }

            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Remove script and style elements
            for script_or_style in soup(['script', 'style', 'header', 'footer', 'nav']):
                script_or_style.decompose()
                
            # Extract title
            title = soup.title.string if soup.title else "No title found"
            
            # Extract main content - focus on article, main, or div with content
            content_elements = soup.select('article, main, .content, #content, .post, .entry')
            
            if not content_elements:
                # If no specific content elements, get all paragraphs
                paragraphs = soup.find_all('p')
                content = ' '.join([p.get_text() for p in paragraphs])
            else:
                # Use the first content element found
                content = content_elements[0].get_text()
            
            # Clean the content
            content = re.sub(r'\s+', ' ', content).strip()
            
            return {
                'title': title,
                'content': content[:15000],  # Limit content length
                'url': url
            }
        except Exception as e:
            logger.error(f"Error scraping webpage {url}: {str(e)}")
            return {
                'title': 'Error scraping page',
                'content': f"Could not retrieve content: {str(e)}",
                'url': url
            }
    
    def extract_domain(self, url):
        """Extract a readable domain name from URL"""
        try:
            domain = urlparse(url).netloc
            if domain.startswith('www.'):
                domain = domain[4:]
            return domain
        except:
            return url
    
    def combine_document_and_web_responses(self, query, document_response, web_response, doc_sources, web_sources, response_format, conversation_context):
        """
        Combine document-based response and web-based response into a single coherent answer.
        
        Args:
            query (str): The original user query
            document_response (str): Response generated from document context
            web_response (str): Response generated from web search
            doc_sources (list): Document sources
            web_sources (list): Web sources
            response_format (str): Desired format for the response
            conversation_context (str): Previous conversation context
            
        Returns:
            str: Combined response
        """
        # Clean up responses by removing source sections
        if "\n\n*Sources:" in document_response:
            document_response = document_response.split("\n\n*Sources:")[0]
            
        if "\n\n*Sources:" in web_response:
            web_response = web_response.split("\n\n*Sources:")[0]
        
        # Create a combined prompt for OpenAI
        prompt = f"""
        You have two responses to the user's query: one based on their documents and one based on web search.
        Your task is to combine these into a single coherent response that prioritizes the document information
        (since that is more specific to the user) but supplements with web information when valuable.
        
        The response format should be: {response_format.replace('_', ' ').title()}
        
        Previous conversation context:
        {conversation_context}
        
        User query: {query}
        
        RESPONSE FROM DOCUMENTS:
        {document_response}
        
        RESPONSE FROM WEB SEARCH:
        {web_response}
        
        GUIDELINES FOR COMBINATION:
    1. When information appears in both sources, prioritize the document information.

        2. Clearly distinguish when you're providing information from the web vs. from documents.

        3. Add web information that complements, updates, or expands on document information.

        4. Maintain a natural tone and logical flow between document and web information.

        5. If there are contradictions, note them and explain the different perspectives.

        6. Use HTML tags for structure: <p>, <ul>, <li>, <b>, etc.

        7. Structure your response with proper headings and sections for readability.

        8. Use <h3> tags for different sources:

            - <h3>Information from Documents</h3> for document-based information.

            - <h3>Information from the Web</h3> for web-based information.
        
        Create a single, coherent, well-structured response that combines both sources of information.
        Make sure your response is contextually relevant to the ongoing conversation.
        """
        
        try:
            # Generate the combined response
            completion = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are an expert at synthesizing information from multiple sources."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=2500
            )
            
            combined_response = completion.choices[0].message.content
            
            # Add all sources
            all_doc_sources = list(set(doc_sources))
            all_web_domains = [self.extract_domain(source.get('url', '')) for source in web_sources]
            all_sources = all_doc_sources + all_web_domains
            all_sources_str = ", ".join(all_sources)
            
            return f"{combined_response}\n\n*Sources: {all_sources_str}*"
            
        except Exception as e:
            logger.error(f"Error combining responses: {str(e)}", exc_info=True)
            
            # Fallback: Simply concatenate the responses with a divider
            fallback_response = f"""
            <h3>Information from Your Documents:</h3>
            <div>
            {document_response}
            </div>
            
            <h3>Additional Information from Web Search:</h3>
            <div>
            {web_response}
            </div>
            """
            
            # Add sources
            all_doc_sources = list(set(doc_sources))
            all_web_domains = [self.extract_domain(source.get('url', '')) for source in web_sources]
            all_sources = all_doc_sources + all_web_domains
            all_sources_str = ", ".join(all_sources)
            
            return f"{fallback_response}\n\n*Sources: {all_sources_str}*"

    def detect_question_format(self, query, context_snippets=None):
        """
        Analyzes the question and detects the most appropriate response format
        based on the query content and any available document context.
        
        Args:
            query (str): The user's question
            context_snippets (list): Optional list of document context snippets
            
        Returns:
            tuple: (primary_format, secondary_format, confidence)
        """
        # Implementation remains the same as in your original code
        print("###########################################################")
        
        # Normalize query for keyword matching
        query_lower = query.lower()
        
        # Format detection keywords dictionary
        format_keywords = {
            "executive_summary": [
                "summarize", "summary", "overview", "high level", "highlights", "key points", 
                "brief overview", "executive summary", "main points", "takeaways", "tldr",
                "in a nutshell", "brief summary", "key highlights", "summarise", "recap",
                "give me the gist", "summarization", "outline the main", "key takeaways",
                "bullet points of", "boil down", "distill", "condense"
            ],
            "comparative_analysis": [
                "compare", "comparison", "versus", "vs", "difference", "differences", 
                "similarities", "similarity", "better", "worse", "advantage", "disadvantage",
                "pros and cons", "strengths and weaknesses", "contrast", "choose between",
                "which is better", "how does", "stack up", "relative to", "compared to",
                "weighing", "juxtapose", "differentiate between", "distinction", "compare and contrast",
                "side by side", "match up against", "measure against"
            ],
            "detailed_analysis": [
                "analyze", "analysis", "deep dive", "in-depth", "detailed", "breakdown",
                "examine", "investigate", "elaborate on", "explain in detail", "thorough",
                "comprehensive", "drill down", "what factors", "analyze in detail",
                "dissect", "unpack", "scrutinize", "evaluate", "assessment", "diagnosis",
                "root cause", "deconstructing", "implications of", "examine carefully", 
                "look closely at", "study"
            ],
            "strategic_recommendation": [
                "recommend", "recommendation", "suggest", "advice", "should", "best course",
                "action plan", "strategic", "next steps", "how should", "what would you advise",
                "strategy", "approach", "what should", "best way to", "how to best",
                "action items", "propose", "guidance", "direction", "advise on",
                "what's the right approach", "strategic guidance", "roadmap", "plan for",
                "steps to take", "best practice", "optimal strategy"
            ],
            "market_insights": [
                "market trends", "industry", "segment", "consumer behavior", "market data", 
                "competitive landscape", "market share", "industry trend", "consumer preference",
                "market analysis", "market research", "market performance", "market outlook",
                "sector analysis", "competitors", "customer demographics", "forecast",
                "target audience", "customer segment", "market growth", "consumer insights",
                "purchase behavior", "audience analysis", "industry position"
            ],
            "factual_brief": [
                "what is", "when was", "where is", "who is", "facts about", "define", 
                "information on", "tell me about", "data on", "evidence of", "statistics on",
                "key facts", "figures on", "numbers for", "metrics on", "how many",
                "percentage of", "rate of", "frequency of", "occurrence of", "incidents of",
                "quantity of", "value of", "amount of", "total number", "statistics for",
                "list the", "enumerate", "identify", "reference"
            ],
            "technical_deep_dive": [
                "how does it work", "technical", "technology", "mechanism", "process", "methodology",
                "framework", "system", "architecture", "technical details", "underlying", "step by step",
                "explain the process", "technical explanation", "in technical terms",
                "inner workings", "components", "operation", "workflow", "algorithm",
                "explain technically", "implementation", "procedure", "specification",
                "design", "function", "operation of", "engineering behind"
            ]
        }
        
        # Check for format-specific keywords
        matched_formats = []
        for format_key, keywords in format_keywords.items():
            # Count matches and weight longer phrases higher
            match_score = 0
            for keyword in keywords:
                if keyword in query_lower:
                    # Weight multi-word phrases higher
                    words_in_keyword = len(keyword.split())
                    match_score += words_in_keyword  
            
            if match_score > 0:
                matched_formats.append((format_key, match_score))
        
        # Sort by match score (higher score = stronger signal)
        matched_formats.sort(key=lambda x: x[1], reverse=True)
        
        # If we have keyword matches, use the best match
        if matched_formats and matched_formats[0][1] >= 1:
            primary_format = matched_formats[0][0]
            # Set confidence based on match score
            base_confidence = 5.0
            # Boost confidence based on match score
            match_bonus = min(matched_formats[0][1], 4.0)  # Cap the bonus
            confidence = base_confidence + match_bonus
            
            # Get secondary format if available
            secondary_format = matched_formats[1][0] if len(matched_formats) > 1 else None
            
            return primary_format, secondary_format, confidence
        
        # If no keyword matches, we can try using LLM for classification
        # This would integrate with your existing classify_question_intent function
        # but we'll keep it simple for now
        
        # Default to natural if no clear classification
        return "natural", None, 4.0


    # Add this helper method to get format-specific guidance
    def _get_format_guidance(self, response_format, length_preference):
        """
        Get format-specific guidance based on response format and length preference.
        
        Args:
            response_format (str): The requested response format
            length_preference (str): 'short' or 'comprehensive'
            
        Returns:
            str: Format-specific guidance text
        """
        # Format guidance dictionary
        format_guidance = {
            "executive_summary": {

                 """
    This is an EXECUTIVE SUMMARY request. Provide a concise, high-level overview of the key points and implications. Specifically:

    1. Begin with a brief 1-2 sentence overview of the main finding or takeaway
    2. Structure your summary with clear sections for different key points
    3. Prioritize only the most important findings and insights (quality over quantity)
    4. Include critical data points and evidence that support the key messages
    5. Ensure every statement adds value and nothing is redundant
    6. Conclude with the most important implications or next steps
    7. Keep the entire summary focused and concise - aim for brevity while maintaining completeness

    Your summary should give the reader a clear understanding of the essential points without needing to read a longer document.
    """
            },
            "detailed_analysis": {

                 """
    This is a DETAILED ANALYSIS request. Provide a comprehensive analysis with in-depth examination of the information and its implications. Specifically:

    1. Begin with an executive summary of your key findings
    2. Include a rigorous analysis of the data, breaking it down into logical sections
    3. Examine patterns, trends, anomalies, and relationships in the data
    4. Support your analysis with specific evidence and examples from the documents
    5. Consider multiple perspectives and interpretations of the information
    6. Discuss implications of your findings for decision-making
    7. Include relevant charts or tables to visualize key data points
    8. Conclude with synthesis of the most important insights

    Your analysis should be thorough and demonstrate critical thinking throughout.
    """
            },
            "strategic_recommendation": {

               """
    This is a STRATEGIC RECOMMENDATION request. Provide actionable, prioritized recommendations with clear strategic direction. Specifically:

    1. Begin with a brief overview of the current situation or challenge
    2. Present 3-5 specific, actionable recommendations in priority order
    3. For each recommendation:
    - Clearly state what should be done
    - Explain why this approach is recommended (with evidence)
    - Outline expected outcomes or benefits
    - Address potential implementation challenges
    4. Include a high-level implementation timeline or roadmap if appropriate
    5. Conclude with the critical success factors for implementation

    Your recommendations should be practical, evidence-based, and strategically sound.
    """
            },
            "comparative_analysis": {
                """
    This is a COMPARATIVE question. Organize your response around comparing different options, approaches, or entities mentioned in the query. Specifically:

    1. Begin with a brief introduction of the items being compared
    2. Use a structure that clearly contrasts the different options (side-by-side format where possible)
    3. Create comparison tables that directly align comparable attributes
    4. Identify key differentiating factors between the options
    5. Discuss relative advantages and disadvantages of each
    6. Include direct quantitative comparisons where data is available
    7. Conclude with insights about the relative positioning of the compared items

    When presenting comparative data, use tables with this format when appropriate:

    | Attribute | Option A | Option B | Key Difference |
    |-----------|----------|----------|---------------|
    | Feature 1 | Value    | Value    | Insight       |
    """
            },
            "market_insights": {

               """
    This is a MARKET INSIGHTS request. Focus on market trends, consumer behavior, and competitive dynamics. Specifically:

    1. Begin with an overview of the key market dynamics or trends
    2. Analyze market segments, sizes, and growth rates with supporting data
    3. Examine competitive landscape and relative positioning of key players
    4. Discuss consumer behavior patterns, preferences, and changing demands
    5. Identify market opportunities and potential threats
    6. Present relevant market statistics in tabular format where appropriate
    7. Conclude with strategic implications of these market insights

    Your response should combine data-driven market analysis with strategic interpretation.
    """
            },
            "factual_brief": {

             """
    This is a FACTUAL INQUIRY. Provide direct, fact-based answers with supporting evidence. Specifically:

    1. Begin with a clear, direct answer to the question asked
    2. Present the key facts in a structured, logical order
    3. Support each fact with specific evidence from the documents
    4. Include relevant numbers, statistics, or data points
    5. Use bullet points or numbered lists where appropriate to improve readability
    6. Avoid speculation or unsupported assertions
    7. Clearly indicate if certain requested information is not available in the documents

    Your response should be factual, concise, and directly address the query.
    """
            },
            "technical_deep_dive": {

             """
    This is a TECHNICAL question. Include detailed explanations of processes, methodologies, or procedures. Specifically:

    1. Begin with a high-level overview of the technical concept or process
    2. Break down the technical components or steps in a logical sequence
    3. Explain how each component works or contributes to the whole
    4. Include relevant technical specifications, parameters, or metrics
    5. Use clear examples to illustrate technical concepts
    6. Consider including diagrams or technical illustrations where helpful
    7. Address limitations, constraints, or technical considerations
    8. Conclude with practical applications or implications

    Your explanation should be technically accurate while remaining accessible to a business audience.
    """
            },
            "natural": {
                "short": "Structure your response in a natural way that best addresses the query, while keeping it concise and to-the-point.",
                "comprehensive": "Structure your response in the most natural way that best addresses the query, with appropriate depth and detail."
            }
        }
        
        # Return the appropriate guidance based on format and length preference
        if response_format in format_guidance and length_preference in format_guidance[response_format]:
            return format_guidance[response_format][length_preference]
        
        # Default fallback
        return "Provide a helpful response to the query based on the document context."



    def generate_response(self, query, context, sources, use_web_knowledge=False, response_format='natural', conversation_context=""):
        """
        Generate a response using the provided context and sources with web search capability.
        
        Args:
            query (str): User's original query
            context (list): List of context chunks
            sources (list): List of source documents for each context chunk
            use_web_knowledge (bool): Whether to use web search in addition to documents
            response_format (str): Format style for the response
            conversation_context (str): Previous conversation history context
            
        Returns:
            str: Generated response based on the context and/or web search
        """
        if not context and not use_web_knowledge:
            return "I cannot answer this question based on the provided documents."
        
        # Standard document-based response (no web search)
        selected_context, selected_sources = self._prepare_context(context, sources)
        
        # Create context with source information
        contextualized_content = []
        for content, source in zip(selected_context, selected_sources):
            contextualized_content.append(f"From document '{source}':\n{content}")
        full_context = "\n\n".join(contextualized_content)

        # Get format-specific guidance
        format_guidance = self._get_format_guidance(response_format, 'comprehensive')
        
        # Include conversation context if available
        conversation_prompt = ""
        if conversation_context:
            conversation_prompt = f"""
            RECENT CONVERSATION HISTORY:
            {conversation_context}
            
            Please consider this conversation history when providing your response to maintain continuity.
            """
        
        # Define the user prompt (consistent with existing implementation but with conversation context)
        user_prompt = f"""
        Based ONLY on the following context from multiple documents, answer the question. If relevant details are not fully available, provide the information that is present and kindly note any specific information that is missing. Be helpful by mentioning related information that may assist in answering the question, and offer to expand on available details if useful. Additionally, provide quantitative details where needed.

        RESPONSE FORMAT: {response_format.replace('_', ' ').title()}

        {format_guidance}

        {conversation_prompt}

        RESPONSE GENERATION GUIDELINES:
        - Provide a DETAILED, COMPREHENSIVE, and THOROUGH answer.
        - Include ALL relevant information from the context in your response.
        - Prioritize completeness over brevity - make sure to include details.
        - If multiple perspectives or data points exist, include all of them.
        - When appropriate, organize information with clear sections and structure.
        - Maintain a natural, conversational tone.
        - Ensure the response is directly derived from the provided document context.
        - If the document does NOT contain relevant information, explicitly state that and summarize related available content instead.
        - Consider the conversation history to maintain continuity in the discussion.
    
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
        system_message = "You are a document analysis expert with conversation memory. Provide a comprehensive and detailed answer using only available information while maintaining conversation continuity."
        
        try:
            # Call the OpenAI chat completion API
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
                enhanced_system_message = "You are a document analysis expert with conversation memory. Provide an EXTREMELY DETAILED and COMPREHENSIVE response including ALL information from the context while maintaining conversational continuity."
                
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
            # Create a shorter version of conversation context if needed
            short_conv_context = ""
            if conversation_context:
                short_conv_context = f"Previous conversation context: {conversation_context[:300]}..."
                
            fallback_prompt = f"""
            Based ONLY on the following context, provide a comprehensive answer to the question: {query}
            
            {short_conv_context}
            
            CONTEXT:
            {reduced_context}
            
            Ensure the response is detailed and covers all relevant information from the context while maintaining conversational continuity.
            """
            
            try:
                fallback_completion = client.chat.completions.create(
                    model="o3-mini",
                    messages=[
                        {"role": "system", "content": "You are a document analysis expert with conversation memory."},
                        {"role": "user", "content": fallback_prompt}
                    ]
                )
                
                answer = fallback_completion.choices[0].message.content
            except Exception as nested_e:
                # Last resort fallback
                answer = f"An error occurred while generating the response: {str(e)}. Please try a more specific question or with fewer documents."

        # Add source information
        source_list = list(set(selected_sources))
        source_info = ", ".join(source_list)
        return f"{answer}\n\n*Sources: {source_info}*"

    def generate_short_response(self, query, context, sources, use_web_knowledge=False, response_format='natural', conversation_context=""):
        """
        Generate a shorter, concise response using the provided context with web search capability.
        
        Args:
            query (str): User's original query
            context (list): List of context chunks
            sources (list): List of source documents for each context chunk
            use_web_knowledge (bool): Whether to use web search in addition to documents
            response_format (str): Format style for the response
            conversation_context (str): Previous conversation history context
            
        Returns:
            str: Generated response based on the context and/or web search
        """
        if not context and not use_web_knowledge:
            return "I cannot answer this question based on the provided documents."
        
        # Standard document-based response (no web search) - mostly the same as original
        selected_context, selected_sources = self._prepare_context(context, sources)
        
        # Create context with source information
        contextualized_content = []
        for content, source in zip(selected_context, selected_sources):
            contextualized_content.append(f"From document '{source}':\n{content}")
        full_context = "\n\n".join(contextualized_content)

        # Get format-specific guidance for short responses
        format_guidance = self._get_format_guidance(response_format, 'short')
        
        # Include conversation context if available (shorter format for concise response)
        conversation_prompt = ""
        if conversation_context:
            # Create a shortened version since this is for concise responses
            conversation_prompt = f"""
            RECENT CONVERSATION:
            {conversation_context[:500]}...
            
            Consider this conversation history for continuity.
            """
        
        # Define the user prompt for short response with conversation context
        user_prompt = f"""
        Based ONLY on the following context from multiple documents, answer the question. If relevant details are not fully available, provide the information that is present and kindly note any specific information that is missing. Be helpful by mentioning related information that may assist in answering the question, and offer to expand on available details if useful. Additionally, provide quantitative details where needed.

        RESPONSE FORMAT: {response_format.replace('_', ' ').title()}

        {format_guidance}

        {conversation_prompt}
    
        RESPONSE GENERATION GUIDELINES:
        - Provide a CONCISE yet THOROUGH answer.
        - Focus on the most relevant information from the context.
        - Prioritize clarity and directness over excessive detail.
        - When appropriate, organize information with clear sections and structure.
        - Maintain a natural, conversational tone.
        - Ensure the response is directly derived from the provided document context.
        - If the document does NOT contain relevant information, explicitly state that.
        - Consider the conversation history to maintain continuity.
    
        DOCUMENT CONTEXT:
        {full_context}
    
        USER QUERY: {query}
    
        RESPONSE FORMAT REQUIREMENTS:
        1. Begin with a direct answer to the query
        2. Include only the most relevant details and evidence from the documents
        3. When appropriate, use concise bullet points or short paragraphs
        4. Be selective about what information to include - focus on what matters most
        5. Use <b> tags for key points
        6. Use <p> tags for explanations
        7. Use <ul> and <li> for list-based information
        8. Use <table> and <tr>, <td> for tabular information if absolutely necessary
    
        CRITICAL CONSTRAINTS:
        - Use ONLY information from the provided document.
        - DO NOT generate speculative or external information.
        - Ensure clarity and accuracy while being concise.
        - Keep the response focused and to-the-point.
        """
        
        # Define system message for short response
        system_message = "You are a document analysis expert with conversation memory. Provide a concise yet informative response that maintains conversation continuity."
        
        try:
            # Call the OpenAI chat completion API for short response
            completion = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.4,
            )
            
            answer = completion.choices[0].message.content
                
        except Exception as e:
            # If there's an error, try with even fewer context chunks
            reduced_context = "\n\n".join(contextualized_content[:5])
            fallback_prompt = f"""
            Based ONLY on the following context, provide a brief answer to the question: {query}
            
            CONTEXT:
            {reduced_context}
            """
            
            try:
                fallback_completion = client.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {"role": "system", "content": "You are a document analysis expert. Be brief."},
                        {"role": "user", "content": fallback_prompt}
                    ],
                    temperature=0.4,
                    max_tokens=1024
                )
                
                answer = fallback_completion.choices[0].message.content
            except Exception as nested_e:
                # Last resort fallback
                answer = f"An error occurred while generating the response. Please try a more specific question."

        # Add source information
        source_list = list(set(selected_sources))
        source_info = ", ".join(source_list)
        return f"{answer}\n\n*Sources: {source_info}*"
        

    def get_general_chat_answer(self, query, use_web_knowledge=False, response_length='comprehensive', response_format='natural'):
            """
            Generate an answer for general chat mode, optionally using web knowledge.
           
            Args:
                query (str): The user's query
                use_web_knowledge (bool): Whether to use web search
                response_length (str): 'short' or 'comprehensive'
                response_format (str): The format to use for the response
               
            Returns:
                str: Generated response
            """
            # If web knowledge is enabled, implement the full web search flow
            if use_web_knowledge:
                try:
                    # Step 1: Search the web using DuckDuckGo
                    print(f"Searching web for: {query}")
                    web_results = self.search_web(query, max_results=5)
                   
                    if not web_results:
                        return "I couldn't find relevant information on the web for your query."
                   
                    # Step 2: Scrape content from the top search results
                    print(f"Found {len(web_results)} search results, scraping content...")
                    scraped_contents = []
                    web_sources = []
                   
                    for result in web_results:
                        try:
                            # Extract content from the webpage
                            scraped_content = self.scrape_webpage(result['href'])
                           
                            if scraped_content and scraped_content.get('content'):
                                scraped_contents.append(scraped_content)
                               
                                # Store source information
                                web_sources.append({
                                    'title': scraped_content.get('title', result.get('title', 'Unknown')),
                                    'url': result.get('href', ''),
                                    'snippet': result.get('body', '')[:300]  # First 300 chars of snippet
                                })
                        except Exception as e:
                            logger.error(f"Error scraping {result.get('href')}: {str(e)}")
                            continue
                   
                    if not scraped_contents:
                        return "I found search results but couldn't extract useful content from the webpages."
                   
                    # Step 3: Generate a response using the scraped content
                    print(f"Generating response from {len(scraped_contents)} scraped sources...")
                   
                    # Prepare context from scraped contents
                    context = ""
                    for i, item in enumerate(scraped_contents, 1):
                        domain = self.extract_domain(item['url'])
                        context += f"Source {i} ({domain}):\n"
                        context += f"Title: {item['title']}\n"
                        # Limit content based on response length
                        content_limit = 2000 if response_length == 'comprehensive' else 1000
                        context += f"Content: {item['content'][:content_limit]}...\n\n"
                   
                    # Get format-specific guidance
                    format_guidance = self._get_format_guidance(response_format, 'short' if response_length == 'short' else 'comprehensive')
                   
                    # Create the prompt for OpenAI
                    prompt = f"""
                    You are a web research assistant. Based ONLY on the following information from multiple web sources, answer the user question. 

                    If relevant details are missing or contradictory, clearly acknowledge this and summarize available related content. Be helpful by highlighting potentially useful information even if it doesn’t fully resolve the question. Provide quantitative details where available.

                    RESPONSE FORMAT: {response_format.replace('_', ' ').title()}

                    {format_guidance}

                    RESPONSE GENERATION GUIDELINES:
                    - Provide a DETAILED, COMPREHENSIVE, and THOROUGH answer.
                    - Include ALL relevant information from the web sources below.
                    - Prioritize completeness over brevity — include important details.
                    - If multiple perspectives or data points exist, include all of them.
                    - When appropriate, structure the information clearly with headings.
                    - Maintain a natural, conversational tone.
                    - If the web sources do NOT contain relevant information, clearly state that and summarize any related or tangential insights.

                    QUESTION: {query}

                    INFORMATION FROM WEB SOURCES:
                    {context}

                    RESPONSE FORMAT REQUIREMENTS:
                    1. Follow with detailed elaboration on each relevant point.
                    2. Include specific details, examples, and support from the source content.
                    3. Use clear, logical sections when needed.
                    4. Conclude with any other contextually relevant insights.
                    5. Use <b> for section headers.
                    6. Use <p> for body text.
                    7. Use <ul> / <li> for lists.
                    8. Use <table>, <tr>, <td> for tables, if applicable.
                    9. Avoid using Markdown formatting (**bold** and etc.). Use HTML only.

                    CRITICAL CONSTRAINTS:
                    - Ensure clarity, accuracy, and full coverage of the relevant content.

                    RESPONSE LENGTH: {'Provide a focused, concise response prioritizing the most important information.' if response_length == 'short' else 'Provide a comprehensive, detailed response that thoroughly covers the topic.'}
                    """
                    system_message = "You are a web search analysis expert. Provide an EXTREMELY DETAILED and COMPREHENSIVE response."

                    temperature = 0.3 if response_format in ['factual_brief', 'technical_deep_dive'] else 0.5
                    max_tokens = 2000 if response_length == 'short' else 2000

                    print(f"Calling OpenAI API with temperature={temperature}, max_tokens={max_tokens}")
                    response = client.chat.completions.create(
                        model="gpt-4o",
                        messages=[
                            {"role": "system", "content": system_message},
                            {"role": "user", "content": prompt}
                        ],
                        temperature=temperature,
                        max_tokens=max_tokens
                    )

                    web_response = response.choices[0].message.content

                    # Add source information
                    source_domains = [self.extract_domain(source['url']) for source in web_sources]
                    source_info = ", ".join(source_domains)

                    return f"{web_response}\n\n*Sources: {source_info}*"

                   
                except Exception as e:
                    logger.error(f"Error in web knowledge general chat: {str(e)}", exc_info=True)
                    return f"I encountered an error while searching the web: {str(e)}. Please try a different question or try again later."
           
            # If no web knowledge requested, use standard chat completion
            else:
                # Format-specific guidance
                format_guidance = self._get_format_guidance(response_format, 'short' if response_length == 'short' else 'comprehensive')
               
                # Configure conciseness based on response length
                conciseness = "Be concise and to-the-point." if response_length == 'short' else "Provide a comprehensive and detailed response."
               
                # Create a prompt for the general chat
                prompt = f"""
                Please answer the following question in a helpful, informative way.
               
                RESPONSE FORMAT: {response_format.replace('_', ' ').title()}
               
                {format_guidance}
               
                {conciseness}
               
                Use HTML tags for structure (<b>, <p>, <ul>, <li>) to enhance readability.
               
                USER QUERY: {query}
                """
               
                try:
                    # Use the OpenAI API
                    completion = client.chat.completions.create(
                        model="gpt-4o",
                        messages=[
                            {"role": "system", "content": "You are a helpful, friendly AI assistant providing informative and thoughtful responses."},
                            {"role": "user", "content": prompt}
                        ],
                        temperature=0.5,
                        max_tokens=2000 if response_length == 'comprehensive' else 800
                    )
                   
                    return completion.choices[0].message.content
                   
                except Exception as e:
                    logger.error(f"Error in general chat: {str(e)}", exc_info=True)
                    return f"I'm sorry, I encountered an error while processing your request. Please try again or rephrase your question."

    # Enhanced embeddings function from Streamlit version
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
    
    # Improved search_similar_content with TF-IDF ranking from Streamlit
    def search_similar_content(self, query, processed_docs, metadata_store, k=40):
        """
        Enhanced search function that handles both LlamaParse and local document parsing
        """
        # Get embeddings for the query
        query_embedding = self.get_embeddings([query])
        if not query_embedding:
            return [], []
        
        # Search each document's FAISS index separately
        all_results = []
        all_distances = []
        all_sources = []
        
        # Check if we have any valid documents to search
        valid_docs_found = False
        
        for proc_doc in processed_docs:
            # Skip documents without FAISS indices
            if not proc_doc.faiss_index or not proc_doc.metadata:
                continue
            
            # Skip if files don't exist
            if not os.path.exists(proc_doc.faiss_index) or not os.path.exists(proc_doc.metadata):
                continue
            
            # First check if this is a LlamaParse document with markdown
            markdown_content = None
            if proc_doc.markdown_path and os.path.exists(proc_doc.markdown_path):
                try:
                    with open(proc_doc.markdown_path, 'r', encoding='utf-8') as f:
                        markdown_content = f.read()
                    # If we have markdown content, we'll use it later in our results
                    valid_docs_found = True
                except Exception as e:
                    logger.error(f"Error reading markdown file for {proc_doc.document.filename}: {str(e)}")
            
            # Load metadata for both document types
            try:
                with open(proc_doc.metadata, 'rb') as f:
                    chunks = pickle.load(f)
                
                # Make sure chunks is a list - sometimes it might be empty or None
                if not chunks:
                    logger.warning(f"No chunks found in metadata for {proc_doc.document.filename}")
                    chunks = []
                elif not isinstance(chunks, list):
                    logger.warning(f"Unexpected chunks format for {proc_doc.document.filename}: {type(chunks)}")
                    chunks = []
                
                # Add document source information to each chunk if missing
                for chunk in chunks:
                    if isinstance(chunk, dict) and 'source_file' not in chunk:
                        chunk['source_file'] = proc_doc.document.filename
                    # Ensure 'text' field exists in chunk
                    if isinstance(chunk, dict) and not chunk.get('text'):
                        # Try alternate field names
                        for field in ['content', 'document_content', 'chunk_text']:
                            if field in chunk:
                                chunk['text'] = chunk[field]
                                break
                
                # Try vector search with FAISS index
                valid_docs_found = True
                try:
                    index = faiss.read_index(proc_doc.faiss_index)
                    # Search this index with increased k for better diversity
                    distances, indices = index.search(np.array([query_embedding[0]]).astype('float32'), min(k, index.ntotal))
                    
                    # Extract results for this document
                    for i, idx in enumerate(indices[0]):
                        if idx < len(chunks):
                            content = chunks[idx].get('text', '')
                            # Only add non-empty content
                            if content and content.strip():
                                all_results.append(content)
                                all_distances.append(distances[0][i])
                                all_sources.append(proc_doc.document.filename)
                except Exception as e:
                    logger.error(f"Error searching FAISS index for {proc_doc.document.filename}: {str(e)}")
                    
                    # Fallback to basic text search for simple documents if vector search fails
                    if chunks:
                        # Use TF-IDF for matching if FAISS fails
                        query_lower = query.lower()
                        matched_chunks = []
                        
                        for chunk in chunks:
                            if isinstance(chunk, dict):
                                chunk_text = chunk.get('text', '')
                                if chunk_text and query_lower in chunk_text.lower():
                                    matched_chunks.append(chunk)
                        
                        # Sort by simple text similarity
                        if matched_chunks:
                            logger.info(f"Found {len(matched_chunks)} text matches for {proc_doc.document.filename}")
                            for chunk in matched_chunks[:5]:  # Limit to top 5 matches
                                all_results.append(chunk.get('text', ''))
                                all_distances.append(0.5)  # Middle value since we don't have real distances
                                all_sources.append(proc_doc.document.filename)
                
                # If we have markdown content but no vector results, do fallback text search on whole content
                if markdown_content and not all_results:
                    query_lower = query.lower()
                    if query_lower in markdown_content.lower():
                        # Split into paragraphs and find matching ones
                        paragraphs = markdown_content.split('\n\n')
                        for para in paragraphs:
                            if query_lower in para.lower():
                                all_results.append(para)
                                all_distances.append(0.5)  # Middle value since we don't have real distances
                                all_sources.append(proc_doc.document.filename)
                    
            except Exception as e:
                logger.error(f"Error processing metadata for {proc_doc.document.filename}: {str(e)}")
                continue
        
        # Combine and sort results by similarity score
        if not all_results:
            if valid_docs_found:
                logger.warning(f"No matching content found in documents for query: {query}")
            else:
                logger.warning(f"No valid documents found to search")
            return [], []
            
        # Apply TF-IDF ranking using the Streamlit approach
        try:
            from sklearn.feature_extraction.text import TfidfVectorizer
            
            # Create a TF-IDF vectorizer with increased max_features
            vectorizer = TfidfVectorizer(stop_words='english', max_features=100)
            try:
                tfidf_matrix = vectorizer.fit_transform([query] + all_results)
                
                # Calculate similarity scores
                tfidf_scores = tfidf_matrix[0].dot(tfidf_matrix.T).toarray().flatten()[1:]
                
                # Convert embedding distances to similarity scores
                similarity_scores = [1 / (1 + dist) for dist in all_distances]
                
                # Combine scores with same weighting (70% TF-IDF, 30% embedding)
                combined_scores = [0.7 * tf + 0.3 * sim for tf, sim in zip(tfidf_scores, similarity_scores)]
                
                # Re-sort results by combined score
                combined_results = list(zip(all_results, all_sources, combined_scores))
                sorted_results = sorted(combined_results, key=lambda x: x[2], reverse=True)
                
                # Extract sorted content and sources
                results = [res[0] for res in sorted_results]
                sources = [res[1] for res in sorted_results]
            except Exception as e:
                logger.error(f"Error in TF-IDF processing: {str(e)}")
                # Fallback to original results if TF-IDF fails
                results = all_results
                sources = all_sources
        except Exception as e:
            logger.error(f"Error applying TF-IDF ranking: {str(e)}")
            # Fall back to basic distance-based ranking
            combined_results = list(zip(all_results, all_sources, all_distances))
            # Note: In the fallback, we sort by distance (smaller is better) so no reverse=True
            sorted_results = sorted(combined_results, key=lambda x: x[2])
            
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
        
        # Return top matches (limit to 15 most relevant)
        return filtered_results[:min(len(filtered_results), 15)], filtered_sources[:min(len(filtered_sources), 15)]
    
    # Helper method to prepare context for response generation
    def _prepare_context(self, context, sources):
        """
        Helper method to prepare context for response generation
        
        Args:
            context (list): List of context chunks
            sources (list): List of source documents for each context chunk
            
        Returns:
            tuple: (selected_context, selected_sources)
        """
        # Limit number of tokens by selecting most relevant chunks
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
        
        return selected_context, selected_sources
            
    # Keep general follow-up question generation as is
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
            
    # Keep document follow-up questions as is
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
                    
                    # Prepare message list - UPDATED to include all badge properties
                    message_list = []
                    for message in messages:
                        message_data = {
                            'role': message.role,
                            'content': message.content,
                            'created_at': message.created_at.strftime('%Y-%m-%d %H:%M'),
                            'citations': message.citations or []
                        }
                        
                        # Add badge properties for assistant messages
                        if message.role == 'assistant':
                            # Add these fields with defaults if they don't exist yet
                            message_data['use_web_knowledge'] = getattr(message, 'use_web_knowledge', False)
                            message_data['response_length'] = getattr(message, 'response_length', 'comprehensive')
                            message_data['response_format'] = getattr(message, 'response_format', 'natural')
                        
                        message_list.append(message_data)
                    
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
                    
                    # First check if the document has a markdown path (LlamaParse document)
                    if processed_index.markdown_path and os.path.exists(processed_index.markdown_path):
                        # This is a LlamaParse document, read the markdown content directly
                        try:
                            with open(processed_index.markdown_path, 'r', encoding='utf-8') as f:
                                full_text = f.read()
                                
                            # Extract parameters from markdown content
                            idea_params = self.extract_idea_parameters(full_text)
                            
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
                        except Exception as e:
                            print(f"Error reading markdown file: {str(e)}")
                            # Continue with FAISS approach as fallback
                   
                    # Load index and metadata
                    index, chunks = self.load_faiss_index_from_paths(index_file, metadata_file)
                    
                    if not chunks:
                        return Response({
                            'error': 'No content found in the document'
                        }, status=status.HTTP_400_BAD_REQUEST)
                   
                    # Extract parameters from document content
                    full_text = " ".join([chunk.get('text', '') for chunk in chunks])
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
                
                # First check if the document has a markdown path (LlamaParse document)
                if processed_index.markdown_path and os.path.exists(processed_index.markdown_path):
                    # This is a LlamaParse document, read the markdown content directly
                    try:
                        with open(processed_index.markdown_path, 'r', encoding='utf-8') as f:
                            full_text = f.read()
                            
                        # Extract parameters from markdown content
                        idea_params = self.extract_idea_parameters(query, None, full_text)
                        
                        return Response({
                            'document_id': active_doc_id,
                            'document_name': document.filename,
                            'document_name_no_ext': document_name_no_ext,
                            'query': query,
                            'idea_parameters': idea_params,
                            'suggested_project_name': suggested_project_name
                        })
                    except Exception as e:
                        print(f"Error reading markdown file: {str(e)}")
                        # Continue with FAISS approach as fallback
               
                # Load index and metadata for FAISS approach
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
       
        # Check if index is None
        if index is None:
            return []
            
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
   
    def extract_idea_parameters(self, context, relevant_chunks=None, full_text=None):
        """
        Extract structured parameters for the Idea Generator
       
        Args:
            context (str): Either full document content or query
            relevant_chunks (list, optional): List of relevant chunks from search
            full_text (str, optional): For LlamaParse documents, the full markdown text
           
        Returns:
            dict: Structured parameters for idea generation
        """
        from openai import OpenAI
        client = OpenAI()  # Initialize the client
        import json
       
        try:
            # Determine extraction context source
            if full_text:
                # If we have full text (e.g., from markdown), use that
                extraction_context = full_text
            elif relevant_chunks and len(relevant_chunks) > 0:
                # If relevant chunks are provided, use them for extraction context
                extraction_context = "\n\n".join([chunk.get('text', '') for chunk in relevant_chunks])
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

                # Get upload permissions
                try:
                    upload_permissions = UserUploadPermissions.objects.get(user=user)
                    can_upload = upload_permissions.can_upload
                except UserUploadPermissions.DoesNotExist:
                    # Default to allowed if permissions don't exist
                    can_upload = True
                    # Create default permissions
                    UserUploadPermissions.objects.create(user=user, can_upload=True)
               
                user_info = {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'disabled_modules': module_permissions,
                    'upload_permissions': {
                    'can_upload': can_upload
                },
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




class DocumentContentSearchView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            user = request.user
            query = request.data.get('query')
            main_project_id = request.data.get('main_project_id')
            
            if not query or not main_project_id:
                return Response({
                    'error': 'Query and project ID are required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get all documents for this user and project
            documents = Document.objects.filter(
                user=user, 
                main_project_id=main_project_id
            )
            
            search_results = []
            
            # For each document, search for query in the content
            for doc in documents:
                try:
                    # Get the processed index for this document
                    processed_index = ProcessedIndex.objects.get(document=doc)
                    
                    # First, check if this is a LlamaParse document
                    if processed_index.markdown_path and os.path.exists(processed_index.markdown_path):
                        # This is a LlamaParse document, read the markdown content directly
                        try:
                            with open(processed_index.markdown_path, 'r', encoding='utf-8') as f:
                                markdown_content = f.read()
                            
                            # Convert query to lowercase for case-insensitive search
                            query_lower = query.lower()
                            
                            # Check if query exists in the markdown content
                            if query_lower in markdown_content.lower():
                                # Found a match - get the surrounding context
                                index = markdown_content.lower().find(query_lower)
                                start = max(0, index - 100)
                                end = min(len(markdown_content), index + len(query) + 100)
                                match_context = markdown_content[start:end]
                                
                                # Count occurrences
                                match_count = markdown_content.lower().count(query_lower)
                                
                                search_results.append({
                                    'id': doc.id,
                                    'filename': doc.filename,
                                    'match_count': match_count,
                                    'match_context': match_context,
                                    'uploaded_at': doc.uploaded_at.strftime('%Y-%m-%d %H:%M')
                                })
                                
                                # Continue to the next document
                                continue
                        except Exception as e:
                            logger.error(f"Error searching in markdown file for document {doc.id}: {str(e)}")
                            # Continue with the FAISS approach as fallback
                    
                    # Standard FAISS approach for non-LlamaParse documents
                    if processed_index.faiss_index and processed_index.metadata:
                        # Check if the files exist
                        if not os.path.exists(processed_index.faiss_index) or not os.path.exists(processed_index.metadata):
                            continue
                            
                        # Load the metadata (chunks)
                        with open(processed_index.metadata, 'rb') as f:
                            chunks = pickle.load(f)
                        
                        # Convert query to lowercase for case-insensitive search
                        query_lower = query.lower()
                        matches = []
                        
                        # Search in each chunk
                        for chunk in chunks:
                            chunk_text = chunk.get('text', '')
                            if chunk_text and query_lower in chunk_text.lower():
                                # Found a match, add the context
                                matches.append(chunk_text)
                        
                        # If we found matches, add to results
                        if matches:
                            # Use the first match for preview, but count all matches
                            search_results.append({
                                'id': doc.id,
                                'filename': doc.filename,
                                'match_count': len(matches),
                                'match_context': matches[0] if matches else "",
                                'uploaded_at': doc.uploaded_at.strftime('%Y-%m-%d %H:%M')
                            })
                                
                except ProcessedIndex.DoesNotExist:
                    # Skip documents that haven't been processed
                    continue
                except Exception as e:
                    logger.error(f"Error searching document {doc.id}: {str(e)}")
                    continue
            
            # Sort results by number of matches (most relevant first)
            search_results.sort(key=lambda x: x['match_count'], reverse=True)
            
            return Response({
                'results': search_results,
                'total_count': len(search_results)
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error in document content search: {str(e)}")
            return Response({
                'error': f'An error occurred: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

class AdminUserProjectsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, user_id):
        """Get all projects for a specific user"""
        try:
            # Check if the requesting user is an admin
            if not request.user.username == 'admin':
                return Response({
                    'error': 'Unauthorized. Only admin users can access this endpoint'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Get the user
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response({
                    'error': 'User not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Get projects for the user
            projects = Project.objects.filter(user=user)
            
            # Format response
            project_list = []
            for project in projects:
                project_list.append({
                    'id': project.id,
                    'name': project.name,
                    'created_at': project.created_at.strftime('%Y-%m-%d %H:%M:%S')
                })
            
            return Response(project_list, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error in AdminUserProjectsView: {str(e)}")
            return Response(
                {'error': f'Failed to fetch user projects: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        

class AdminUserUploadPermissionsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def patch(self, request, user_id):
        """Update a user's upload permissions"""
        try:
            # Check if the requesting user is an admin
            if not request.user.username == 'admin':
                return Response({
                    'error': 'Unauthorized. Only admin users can update upload permissions',
                    'success': False
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Get the user
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response({
                    'error': 'Target user not found',
                    'success': False
                }, status=status.HTTP_404_NOT_FOUND)
                
            # Extract permissions data - with explicit conversion to boolean
            can_upload = request.data.get('can_upload', True)
            
            # Convert can_upload to boolean if it's a string
            if isinstance(can_upload, str):
                can_upload = can_upload.lower() in ('true', 't', 'yes', 'y', '1')
            
            # Get or create upload permissions
            permissions, created = UserUploadPermissions.objects.get_or_create(
                user=user,
                defaults={'can_upload': can_upload}
            )
            
            # Update permissions if not created
            if not created:
                permissions.can_upload = can_upload
                permissions.save()
            
            # Log the update for troubleshooting
            print(f"Admin user {request.user.username} set upload permissions for user {user.username} to {can_upload}")
            
            return Response({
                'id': user.id,
                'username': user.username,
                'upload_permissions': {
                    'can_upload': permissions.can_upload
                },
                'success': True
            }, status=status.HTTP_200_OK)
                
        except Exception as e:
            print(f"Error in AdminUserUploadPermissionsView: {str(e)}")
            return Response({
                'error': f'Failed to update upload permissions: {str(e)}',
                'success': False
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            

class UserUploadPermissionsMiddleware(MiddlewareMixin):
    def process_request(self, request):
        # Skip middleware for admin or non-upload endpoints
        if request.path_info.startswith('/admin/') or not request.path_info.endswith('/upload/'):
            return None
        
        # Skip for non-authenticated requests
        if not hasattr(request, 'user') or not request.user.is_authenticated:
            return None
        
        # Skip for admin users (they can always upload)
        if request.user.username == 'admin':
            return None
        
        # Check if user is allowed to upload
        try:
            permissions = UserUploadPermissions.objects.get(user=request.user)
            if not permissions.can_upload:
                return JsonResponse({
                    'error': 'You do not have permission to upload documents. Please contact your administrator.'
                }, status=403)
        except UserUploadPermissions.DoesNotExist:
            # Default to allowed if no permissions are explicitly set
            pass
        
        # Continue with the request
        return None
    
class CheckUploadPermissionsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            user = request.user
            
            # Skip permission check for admin users
            if user.username == 'admin':
                return Response({
                    'can_upload': True
                }, status=status.HTTP_200_OK)
            
            # Check if the user has upload permissions
            try:
                permissions = UserUploadPermissions.objects.get(user=user)
                can_upload = permissions.can_upload
            except UserUploadPermissions.DoesNotExist:
                # Default to allowed if no permissions are explicitly set
                can_upload = True
            
            return Response({
                'can_upload': can_upload
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error in CheckUploadPermissionsView: {str(e)}")
            return Response({
                'error': f'Failed to check upload permissions: {str(e)}',
                'can_upload': False  # Default to disallowing upload on error
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# class ProcessCitationsView(APIView):
#     """
#     API endpoint to process a response and map citations to relevant parts of the text.
#     This can be called by the frontend when displaying a message.
#     """
#     permission_classes = [IsAuthenticated]
    
#     def post(self, request):
#         try:
#             response_text = request.data.get('response_text')
#             citations = request.data.get('citations')
            
#             if not response_text or not citations:
#                 return Response({
#                     'error': 'Both response_text and citations are required'
#                 }, status=status.HTTP_400_BAD_REQUEST)
            
#             # Process the response text with citations
#             processed_text, enhanced_citations = self.process_response_with_citations(response_text, citations)
            
#             return Response({
#                 'processed_text': processed_text,
#                 'enhanced_citations': enhanced_citations
#             }, status=status.HTTP_200_OK)
            
#         except Exception as e:
#             import traceback
#             print(f"Citation processing error: {str(e)}")
#             print(traceback.format_exc())
#             return Response({
#                 'error': str(e)
#             }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
#     def extract_citation_metadata(self, citation_text, source_file):
#         """
#         Extract metadata like page numbers and section titles from citation text.
        
#         Args:
#             citation_text (str): The citation text from the document
#             source_file (str): The source file name
            
#         Returns:
#             dict: Enhanced citation metadata
#         """
#         # Default citation structure
#         citation = {
#             'source_file': source_file,
#             'page_number': 'Unknown',
#             'section_title': 'Unknown',
#             'snippet': citation_text,
#         }
        
#         # Try to extract page numbers - common formats
#         page_matches = re.findall(r'(page|p\.?)\s*(\d+)', citation_text, re.IGNORECASE)
#         if page_matches:
#             citation['page_number'] = page_matches[0][1]
        
#         # Try to extract section titles - look for section headings
#         section_matches = re.findall(r'(?:section|heading):\s*["\'"]([^\'"\']+)[\'"\']', citation_text, re.IGNORECASE)
#         if section_matches:
#             citation['section_title'] = section_matches[0]
        
#         # Alternative: Look for text in quotes that might be section titles
#         if citation['section_title'] == 'Unknown':
#             quote_matches = re.findall(r'[\'"\']([^\'"\']{5,50})[\'"\']', citation_text)
#             if quote_matches:
#                 citation['section_title'] = quote_matches[0]
        
#         # Look for date information
#         date_matches = re.findall(r'\b(\d{4}[-/]\d{1,2}[-/]\d{1,2})\b', citation_text)
#         if date_matches:
#             citation['date'] = date_matches[0]
        
#         return citation
    
#     def process_response_with_citations(self, response_text, citations):
#         """
#         Maps citations to specific parts of the response text based on content similarity.
        
#         Args:
#             response_text (str): The response text from the LLM
#             citations (list): List of citation objects with source information
            
#         Returns:
#             tuple: (processed_text, enhanced_citations)
#         """
#         if not citations or not response_text:
#             return response_text, citations
        
#         # First, try to improve citation metadata
#         enhanced_citations = []

#         for idx, citation in enumerate(citations):
#             # Get basic info
#             source_file = citation.get('source_file', 'Unknown Document')
#             snippet = citation.get('snippet', '')
            
#             # If metadata is missing, try to extract it
#             if citation.get('page_number') in [None, 'Unknown'] or citation.get('section_title') in [None, 'Unknown']:
#                 enhanced_citation = self.extract_citation_metadata(snippet, source_file)
#                 # Preserve original data where available
#                 for key, value in citation.items():
#                     if value and value != 'Unknown':
#                         enhanced_citation[key] = value
#                 enhanced_citations.append(enhanced_citation)
#             else:
#                 enhanced_citations.append(citation)
        
#         # Remove HTML tags for better text processing
#         clean_text = strip_tags(response_text)
        
#         # Step 1: Split the response into sentences
#         sentences = sent_tokenize(clean_text)
        
#         # Step 2: For each citation, find the most relevant sentence
#         citation_mapping = {}  # Maps citation index to sentence index
        
#         for citation_idx, citation in enumerate(enhanced_citations):
#             snippet = citation.get('snippet', '').lower()
#             if not snippet:
#                 continue
                
#             # Generate keywords from the snippet
#             keywords = set(re.findall(r'\b\w+\b', snippet.lower()))
#             keywords = {k for k in keywords if len(k) > 3}  # Filter out short words
            
#             # Score each sentence based on keyword overlap
#             best_score = 0
#             best_sentence_idx = -1
            
#             for sent_idx, sentence in enumerate(sentences):
#                 sentence_lower = sentence.lower()
#                 sentence_words = set(re.findall(r'\b\w+\b', sentence_lower))
                
#                 # Calculate overlap score
#                 overlap = keywords.intersection(sentence_words)
#                 if overlap:
#                     score = len(overlap) / max(len(keywords), 1)  # Avoid division by zero
                    
#                     # Give higher score for exact phrase matches
#                     for i in range(0, len(snippet), 10):
#                         if i + 20 <= len(snippet):
#                             phrase = snippet[i:i+20]
#                             if phrase in sentence_lower:
#                                 score += 0.5
                    
#                     if score > best_score:
#                         best_score = score
#                         best_sentence_idx = sent_idx
            
#             # Map citation to sentence if we found a good match
#             if best_score > 0.2 and best_sentence_idx >= 0:  # Threshold to ensure relevance
#                 if best_sentence_idx not in citation_mapping:
#                     citation_mapping[best_sentence_idx] = []
#                 citation_mapping[best_sentence_idx].append(citation_idx)
        
#         # Step 3: Reinsert the HTML and add citation markers
#         # Start by marking positions in the original response_text where sentences end
#         sentence_positions = []
#         current_pos = 0
        
#         for sentence in sentences:
#             # Find this sentence in the original text
#             sentence_pos = response_text.find(sentence, current_pos)
#             if sentence_pos >= 0:
#                 sentence_end = sentence_pos + len(sentence)
#                 sentence_positions.append(sentence_end)
#                 current_pos = sentence_end
        
#         # Now insert citation markers at the end of relevant sentences
#         result = response_text
#         offset = 0  # Track position offset as we insert markers
        
#         for sent_idx, end_pos in enumerate(sentence_positions):
#             if sent_idx in citation_mapping:
#                 # Create citation markers
#                 citation_markers = ""
#                 for citation_idx in citation_mapping[sent_idx]:
#                     citation_markers += f'<citation id="{citation_idx}"></citation>'
                
#                 # Insert at the adjusted position
#                 insert_pos = end_pos + offset
#                 if insert_pos <= len(result):
#                     result = result[:insert_pos] + citation_markers + result[insert_pos:]
#                     offset += len(citation_markers)
        
#         return result, enhanced_citations


# codes for chat download
from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle, ListStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, ListFlowable, ListItem, Preformatted, PageBreak
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from bs4 import BeautifulSoup, Comment, NavigableString, Tag
from datetime import timedelta
import re
from django.utils import timezone
import json
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus.flowables import HRFlowable

class ChatPDFExportView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            # Parse request data
            conversation_id = request.data.get('conversation_id')
            date_range = request.data.get('date_range')
            options = request.data.get('options', {})
            
            # Set default options if not provided
            include_timestamps = options.get('includeTimestamps', True)
            include_metadata = options.get('includeChatMetadata', True)
            include_followups = options.get('includeFollowUpQuestions', True)
            format_code = options.get('formatCode', True)
            
            # Log the request for debugging
            print(f"PDF Export Request - ID: {conversation_id}, Date Range: {date_range}, Options: {options}")
            
            # Register available fonts
            self._register_fonts()
            
            # Buffer to store PDF
            buffer = BytesIO()
            
            if conversation_id:
                # Single conversation export
                conversation = get_object_or_404(
                    ChatHistory, 
                    conversation_id=conversation_id,
                    user=request.user
                )
                
                # Generate PDF for a single conversation
                self.generate_single_chat_pdf(
                    buffer, 
                    conversation, 
                    include_timestamps,
                    include_metadata,
                    include_followups,
                    format_code
                )
                
                # Set filename with conversation title
                safe_title = re.sub(r'[^\w\-_\. ]', '_', conversation.title or 'Chat')
                filename = f"{safe_title}_{timezone.now().strftime('%Y%m%d')}.pdf"
                
            elif date_range:
                # Date range export
                start_date = date_range.get('startDate')
                end_date = date_range.get('endDate')
                
                if not start_date or not end_date:
                    return Response(
                        {'error': 'Start and end dates are required for date range export'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Parse dates
                try:
                    # Handle both ISO format and datetime objects
                    if isinstance(start_date, str):
                        start_date = timezone.datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                    if isinstance(end_date, str):
                        end_date = timezone.datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                    
                    # Add a day to end_date to include the entire end date
                    end_date = end_date.replace(hour=23, minute=59, second=59)
                except (ValueError, TypeError) as e:
                    return Response(
                        {'error': f'Invalid date format: {str(e)}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Get conversations in date range
                conversations = ChatHistory.objects.filter(
                    user=request.user,
                    created_at__gte=start_date,
                    created_at__lte=end_date
                ).order_by('-created_at')
                
                if not conversations.exists():
                    return Response(
                        {'error': 'No conversations found in the specified date range'},
                        status=status.HTTP_404_NOT_FOUND
                    )
                
                # Generate multi-chat PDF
                self.generate_multiple_chat_pdf(
                    buffer,
                    conversations,
                    include_timestamps,
                    include_metadata,
                    include_followups,
                    format_code
                )
                
                # Set filename with date range
                filename = f"Chats_{start_date.strftime('%Y%m%d')}_to_{end_date.strftime('%Y%m%d')}.pdf"
            else:
                return Response(
                    {'error': 'Either conversation_id or date_range must be provided'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Set buffer position to the beginning
            buffer.seek(0)
            
            # Create the HTTP response with PDF content
            response = HttpResponse(buffer, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            
            return response
            
        except Exception as e:
            print(f"Error generating PDF: {str(e)}")
            return Response(
                {'error': f'Failed to generate PDF: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _register_fonts(self):
        """Register fonts for the PDF generation"""
        try:
            # Skip if fonts are already registered
            if hasattr(self, '_fonts_registered'):
                return
                
            # Use default courier font from ReportLab if custom font not available
            from reportlab.pdfbase._fontdata import standardFonts
            if 'Courier' not in pdfmetrics._fonts and 'Courier' in standardFonts:
                from reportlab.pdfbase.ttfonts import TTFont
                pdfmetrics.registerFont(TTFont('Courier', 'Courier'))
                
            setattr(self, '_fonts_registered', True)
            
        except Exception as e:
            print(f"Warning: Using default fonts - {str(e)}")
            # Continue anyway - ReportLab will use default fonts
    
    def generate_single_chat_pdf(self, buffer, conversation, include_timestamps, include_metadata, include_followups, format_code):
        # Create the PDF document
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=72
        )
        
        # Create story (list of flowables)
        story = []
        
        # Get styles
        styles = getSampleStyleSheet()
        title_style = styles['Title']
        heading_style = styles['Heading2']
        normal_style = styles['Normal']
        
        # Custom styles for better formatting
        timestamp_style = ParagraphStyle(
            'TimestampStyle',
            parent=styles['Italic'],
            fontSize=8,
            textColor=colors.gray
        )
        
        user_style = ParagraphStyle(
            'UserStyle',
            parent=normal_style,
            fontSize=10,
            leading=14,
            spaceAfter=6,
            spaceBefore=6,
            bulletIndent=12,
            leftIndent=0
        )
        
        assistant_style = ParagraphStyle(
            'AssistantStyle',
            parent=normal_style,
            fontSize=10,
            leading=14,
            spaceAfter=6,
            spaceBefore=6,
            bulletIndent=12,
            leftIndent=0,
            backColor=colors.lightgrey.clone(alpha=0.2)
        )
        
        # Enhanced bullet styles
        bullet_style = ParagraphStyle(
            'BulletStyle',
            parent=normal_style,
            fontSize=10,
            leading=14,
            leftIndent=20,
            bulletIndent=0,
            spaceAfter=2,
            bulletFontName='Helvetica-Bold'
        )
        
        assistant_bullet_style = ParagraphStyle(
            'AssistantBulletStyle',
            parent=bullet_style,
            backColor=colors.lightgrey.clone(alpha=0.2)
        )
        
        code_style = ParagraphStyle(
            'CodeStyle',
            parent=normal_style,
            fontName='Courier',
            fontSize=9,
            leading=12,
            spaceAfter=10,
            spaceBefore=10,
            leftIndent=20,
            rightIndent=20,
            backColor=colors.whitesmoke
        )
        
        # Add title
        story.append(Paragraph(conversation.title or "Chat Conversation", title_style))
        story.append(Spacer(1, 0.25*inch))
        
        # Add metadata if requested
        if include_metadata:
            metadata = [
                ["Created", conversation.created_at.strftime("%Y-%m-%d %H:%M")],
                ["Conversation ID", str(conversation.conversation_id)]
            ]
            
            # Get document names if available
            if conversation.documents.exists():
                doc_names = ", ".join([doc.filename for doc in conversation.documents.all()])
                metadata.append(["Documents", doc_names])
            
            # Create metadata table
            metadata_table = Table(metadata, colWidths=[100, 350])
            metadata_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
                ('TEXTCOLOR', (0, 0), (0, -1), colors.black),
                ('ALIGN', (0, 0), (0, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ]))
            
            story.append(metadata_table)
            story.append(Spacer(1, 0.25*inch))
        
        # Get messages
        messages = conversation.messages.all().order_by('created_at')
        
        # Process messages
        for message in messages:
            role = message.role.capitalize()
            content = message.content
            
            # Add message role header
            role_text = f"{role}"
            story.append(Paragraph(role_text, heading_style))
            
            # Add timestamp if requested
            if include_timestamps:
                timestamp = message.created_at.strftime("%Y-%m-%d %H:%M")
                story.append(Paragraph(timestamp, timestamp_style))
            
            # Select style based on role
            style = assistant_style if role.lower() == 'assistant' else user_style
            bullet_style_to_use = assistant_bullet_style if role.lower() == 'assistant' else bullet_style
            
            # Special case for messages with HTML tags
            if '<' in content and '>' in content:
                # Process HTML content using a different approach to avoid duplication
                html_content = self.process_html_for_pdf(content, style, bullet_style_to_use, code_style, format_code)
                for item in html_content:
                    story.append(item)
            else:
                # Process plain text content (without HTML)
                lines = content.split('\n')
                buffer = []
                in_code_block = False
                
                for line in lines:
                    # Check if line is a bullet point or numbered item
                    bullet_match = re.match(r'^\s*[•\-*]\s+(.*)', line)
                    number_match = re.match(r'^\s*(\d+)[\.\)]\s+(.*)', line)
                    
                    # First add any buffered content
                    if buffer and (bullet_match or number_match or (line.strip() == '' and buffer[-1].strip() != '')):
                        buffer_text = '\n'.join(buffer)
                        if buffer_text.strip():
                            story.append(Paragraph(buffer_text, style))
                        buffer = []
                    
                    # Process bullets and numbers
                    if bullet_match:
                        bullet_content = bullet_match.group(1)
                        story.append(Paragraph(f"• {bullet_content}", bullet_style_to_use))
                    elif number_match:
                        number = number_match.group(1)
                        item_content = number_match.group(2)
                        story.append(Paragraph(f"{number}. {item_content}", bullet_style_to_use))
                    else:
                        # Regular line, add to buffer
                        if in_code_block or (len(line) > 0 and line[0] in [' ', '\t'] and line.strip()):
                            # This looks like code (indented line)
                            if not in_code_block:
                                # Start of code block
                                in_code_block = True
                                if buffer:
                                    buffer_text = '\n'.join(buffer)
                                    if buffer_text.strip():
                                        story.append(Paragraph(buffer_text, style))
                                    buffer = []
                            buffer.append(line)
                        else:
                            # End of code block?
                            if in_code_block and line.strip() == '':
                                in_code_block = False
                                code_text = '\n'.join(buffer)
                                if code_text.strip():
                                    story.append(Preformatted(code_text, code_style))
                                buffer = []
                            else:
                                # Normal text
                                buffer.append(line)
                
                # Add remaining buffer content
                if buffer:
                    buffer_text = '\n'.join(buffer)
                    if buffer_text.strip():
                        if in_code_block:
                            story.append(Preformatted(buffer_text, code_style))
                        else:
                            story.append(Paragraph(buffer_text, style))
            
            # Add spacing between messages
            story.append(Spacer(1, 0.2*inch))
        
        # Add follow-up questions if available and requested
        if include_followups and conversation.follow_up_questions:
            story.append(Spacer(1, 0.25*inch))
            story.append(Paragraph("Follow-up Questions", heading_style))
            
            # Use ListFlowable for follow-up questions
            follow_up_items = []
            for i, question in enumerate(conversation.follow_up_questions, 1):
                follow_up_items.append(ListItem(Paragraph(question, normal_style), leftIndent=20))
            
            if follow_up_items:
                follow_up_list = ListFlowable(
                    follow_up_items,
                    bulletType='1',
                    start=1,
                    bulletFontSize=10,
                    bulletOffsetY=2,
                    leftIndent=10,
                    bulletDedent=10
                )
                story.append(follow_up_list)
        
        # Build the PDF
        doc.build(story)

    def process_html_for_pdf(self, html_content, base_style, bullet_style, code_style, format_code):
        """
        Process HTML content and return a list of ReportLab flowables
        with improved heading and section formatting preservation
        """
        from bs4 import BeautifulSoup, NavigableString, Tag, Comment
        from reportlab.platypus import Paragraph, Spacer, ListFlowable, ListItem, Preformatted, Table, TableStyle
        from reportlab.lib.styles import ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.lib import colors
        import re
        
        # Pre-process HTML content to ensure section headings are properly tagged
        # Look for patterns like "**Section Name:**" and wrap them in proper tags
        html_content = re.sub(r'\*\*(.*?):\*\*', r'<strong>\1:</strong>', html_content)
        
        soup = BeautifulSoup(html_content, 'html.parser')
        flowables = []
        
        # Helper function to process text with formatting
        def format_text(text_node):
            if not text_node or not text_node.strip():
                return text_node
                
            text = text_node
            
            # Handle bold tags - ensure they're preserved
            text = re.sub(r'<b>(.*?)</b>', r'<b>\1</b>', text, flags=re.DOTALL | re.IGNORECASE)
            text = re.sub(r'<strong>(.*?)</strong>', r'<b>\1</b>', text, flags=re.DOTALL | re.IGNORECASE)
            
            # Handle italic tags
            text = re.sub(r'<i>(.*?)</i>', r'<i>\1</i>', text, flags=re.DOTALL | re.IGNORECASE)
            text = re.sub(r'<em>(.*?)</em>', r'<i>\1</i>', text, flags=re.DOTALL | re.IGNORECASE)
            
            # Handle underline tags
            text = re.sub(r'<u>(.*?)</u>', r'<u>\1</u>', text, flags=re.DOTALL | re.IGNORECASE)
            
            # Additional pattern for **bold text**
            text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text, flags=re.DOTALL)
            
            return text
        
        # Helper function to process list items with better formatting handling
        def process_list_items(list_element, level=0):
            items = []
            
            for li in list_element.find_all('li', recursive=False):
                # Create a new soup just for this list item to properly extract formatting
                li_soup = BeautifulSoup(str(li), 'html.parser')
                item_content = ''
                nested_lists = []
                
                # Process each child in the list item
                for child in li.children:
                    if isinstance(child, NavigableString):
                        item_content += str(child)
                    elif child.name in ['ul', 'ol']:
                        # Save nested list for processing after the main content
                        nested_lists.append(child)
                    elif child.name in ['b', 'strong']:
                        # Ensure bold text is properly captured
                        item_content += f'<b>{child.get_text()}</b>'
                    elif child.name in ['i', 'em']:
                        item_content += f'<i>{child.get_text()}</i>'
                    else:
                        # Preserve any formatting within other elements
                        inner_html = str(child)
                        # Extract only the inner part, not the outer tag
                        inner_content = child.get_text()
                        # Check if the inner content has bold formatting that needs preserving
                        if '**' in inner_content:
                            inner_content = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', inner_content)
                            item_content += inner_content
                        else:
                            item_content += inner_content
                
                # Create a list item with formatted content
                if item_content.strip():
                    # Create indent style based on nesting level
                    indent_style = ParagraphStyle(
                        f'Level{level}Style',
                        parent=bullet_style,
                        leftIndent=20 * level
                    )
                    
                    # Process and preserve bold text in item content
                    formatted_content = format_text(item_content)
                    items.append(
                        ListItem(
                            Paragraph(formatted_content, indent_style),
                            leftIndent=20 * level
                        )
                    )
                
                # Process any nested lists
                for nested_list in nested_lists:
                    # Add sub-list items with increased indentation
                    nested_items = process_list_items(nested_list, level + 1)
                    items.extend(nested_items)
            
            return items
        
        # Helper function to process HTML tables
        def process_table(table_element):
            rows_data = []
            
            # Process each row
            for tr in table_element.find_all('tr', recursive=False):
                row = []
                
                # Find all cells (th or td)
                for cell in tr.find_all(['th', 'td']):
                    # Process the cell content with formatting
                    cell_content = ''
                    
                    for child in cell.children:
                        if isinstance(child, NavigableString):
                            cell_content += str(child)
                        elif child.name in ['b', 'strong']:
                            cell_content += f'<b>{child.get_text()}</b>'
                        elif child.name in ['i', 'em']:
                            cell_content += f'<i>{child.get_text()}</i>'
                        else:
                            # Preserve any markdown-style bold formatting
                            text = child.get_text()
                            if '**' in text:
                                text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
                            cell_content += text
                    
                    # Create a paragraph with the formatted cell content
                    if cell_content.strip():
                        # Use Paragraph for cells to enable formatting
                        cell_para = Paragraph(format_text(cell_content), base_style)
                        row.append(cell_para)
                    else:
                        # Empty cell
                        row.append('')
                
                # Add the row if it has any content
                if row:
                    rows_data.append(row)
            
            # Only proceed if we have rows
            if not rows_data:
                return None
            
            # Determine if the first row is a header
            has_header = any(cell.name == 'th' for cell in table_element.find_all('tr', recursive=False)[0].find_all(['th', 'td']))
            
            # Calculate column widths (equal distribution)
            if rows_data and rows_data[0]:
                num_cols = len(rows_data[0])
                # Set a max width for the table (80% of page width)
                max_table_width = 450  # In points (letter page width is 612 points)
                col_width = max_table_width / num_cols if num_cols > 0 else max_table_width
                col_widths = [col_width] * num_cols
            else:
                # Fallback if no rows or columns
                col_widths = [100]
            
            # Create the table with the data and column widths
            pdf_table = Table(rows_data, colWidths=col_widths)
            
            # Create table style
            table_style = [
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
                ('TOPPADDING', (0, 0), (-1, -1), 4),
                ('LEFTPADDING', (0, 0), (-1, -1), 6),
                ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ]
            
            # Add header style if first row contains th elements
            if has_header:
                table_style.extend([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                ])
            
            # Apply styles to the table
            pdf_table.setStyle(TableStyle(table_style))
            
            return pdf_table
        
        # First detect if this is likely to contain a major heading
        # Many responses start with "**Heading**" pattern
        heading_match = re.search(r'^\s*\*\*(.*?)\*\*\s*$', html_content, re.MULTILINE)
        if heading_match:
            heading_text = heading_match.group(1)
            heading_style = ParagraphStyle(
                'MajorHeading',
                parent=base_style,
                fontSize=14,
                fontName='Helvetica-Bold',
                spaceBefore=6,
                spaceAfter=6
            )
            flowables.append(Paragraph(heading_text, heading_style))
            flowables.append(Spacer(1, 0.1*inch))
        
        # Get all top-level elements
        top_elements = list(soup.children)
        
        # Skip pure whitespace text nodes
        top_elements = [el for el in top_elements if not (isinstance(el, NavigableString) and not el.strip())]
        
        # If there are no proper elements, just use the text
        if not any(isinstance(el, Tag) for el in top_elements):
            text = soup.get_text()
            if text.strip():
                # Check for section headers in the text - these would be standalone paragraphs
                paragraphs = [p for p in text.split('\n') if p.strip()]
                for para in paragraphs:
                    # Check if this paragraph is a section heading (bold text at the beginning)
                    if para.strip().startswith('**') and '**' in para[2:]:
                        # This is likely a section heading
                        heading_end = para.find('**', 2)
                        if heading_end > 0:
                            heading = para[2:heading_end]
                            rest_of_para = para[heading_end+2:].strip()
                            
                            heading_style = ParagraphStyle(
                                'SectionHeading',
                                parent=base_style,
                                fontSize=12,
                                fontName='Helvetica-Bold',
                                spaceBefore=6,
                                spaceAfter=2
                            )
                            flowables.append(Paragraph(heading, heading_style))
                            
                            if rest_of_para:
                                flowables.append(Paragraph(format_text(rest_of_para), base_style))
                    else:
                        # Regular paragraph
                        flowables.append(Paragraph(format_text(para), base_style))
            
            return flowables
        
        # Otherwise process each top-level element
        for element in top_elements:
            # Skip comments
            if isinstance(element, Comment):
                continue
                
            # Handle text nodes - check for section headers
            if isinstance(element, NavigableString):
                text = str(element).strip()
                if text:
                    # Check if this might be a section heading (starts with **)
                    if text.startswith('**') and '**' in text[2:]:
                        # This is likely a section heading
                        heading_end = text.find('**', 2)
                        if heading_end > 0:
                            heading = text[2:heading_end]
                            rest_of_text = text[heading_end+2:].strip()
                            
                            heading_style = ParagraphStyle(
                                'SectionHeading',
                                parent=base_style,
                                fontSize=12,
                                fontName='Helvetica-Bold',
                                spaceBefore=6,
                                spaceAfter=2
                            )
                            flowables.append(Paragraph(heading, heading_style))
                            
                            if rest_of_text:
                                flowables.append(Paragraph(format_text(rest_of_text), base_style))
                    else:
                        # Regular text node
                        flowables.append(Paragraph(format_text(text), base_style))
                continue
            
            # Handle paragraph elements - check for section headers
            if element.name in ['p', 'div']:
                element_html = str(element)
                element_text = element.get_text().strip()
                
                # Check if this paragraph contains a section heading
                if element_text.startswith('**') and '**' in element_text[2:]:
                    # This is likely a section heading
                    heading_end = element_text.find('**', 2)
                    if heading_end > 0:
                        heading = element_text[2:heading_end]
                        rest_of_text = element_text[heading_end+2:].strip()
                        
                        heading_style = ParagraphStyle(
                            'SectionHeading',
                            parent=base_style,
                            fontSize=12,
                            fontName='Helvetica-Bold',
                            spaceBefore=6,
                            spaceAfter=2
                        )
                        flowables.append(Paragraph(heading, heading_style))
                        
                        if rest_of_text:
                            flowables.append(Paragraph(format_text(rest_of_text), base_style))
                        
                        flowables.append(Spacer(1, 0.05*inch))
                        continue
                
                # Otherwise treat as regular paragraph
                # Get text with proper formatting of sub-elements
                para_content = ''
                
                # Handle internal formatting (bold, italic, etc.)
                for child in element.children:
                    if isinstance(child, NavigableString):
                        para_content += str(child)
                    elif child.name in ['b', 'strong']:
                        para_content += f'<b>{child.get_text()}</b>'
                    elif child.name in ['i', 'em']:
                        para_content += f'<i>{child.get_text()}</i>'
                    elif child.name in ['u']:
                        para_content += f'<u>{child.get_text()}</u>'
                    else:
                        # Get text and preserve any markdown formatting
                        text = child.get_text()
                        if '**' in text:
                            text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
                        para_content += text
                
                if para_content.strip():
                    flowables.append(Paragraph(format_text(para_content), base_style))
                    flowables.append(Spacer(1, 0.05*inch))
            
            # Handle unordered lists
            elif element.name == 'ul':
                # Get all list items including nested ones
                list_items = process_list_items(element)
                
                if list_items:
                    # Create list flowable with custom bullet symbol and styling
                    bullet_list = ListFlowable(
                        list_items,
                        bulletType='bullet',
                        start=None,
                        bulletFontSize=10,
                        bulletOffsetY=2,
                        leftIndent=10,
                        bulletDedent=10
                    )
                    flowables.append(bullet_list)
                    flowables.append(Spacer(1, 0.05*inch))
            
            # Handle ordered lists
            elif element.name == 'ol':
                # Get all list items including nested ones
                list_items = process_list_items(element)
                
                if list_items:
                    # Create list flowable with numbers
                    numbered_list = ListFlowable(
                        list_items,
                        bulletType='1',
                        start=1,
                        bulletFontSize=10,
                        bulletOffsetY=2,
                        leftIndent=10,
                        bulletDedent=10
                    )
                    flowables.append(numbered_list)
                    flowables.append(Spacer(1, 0.05*inch))
            
            # Handle tables
            elif element.name == 'table':
                # Process the table using our helper function
                table = process_table(element)
                if table:
                    flowables.append(table)
                    flowables.append(Spacer(1, 0.1*inch))
            
            # Handle code blocks
            elif element.name in ['pre', 'code']:
                code_text = element.get_text()
                if code_text.strip():
                    if format_code:
                        flowables.append(Preformatted(code_text, code_style))
                    else:
                        flowables.append(Paragraph(code_text, base_style))
                    flowables.append(Spacer(1, 0.05*inch))
            
            # Handle headings
            elif element.name in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
                heading_text = element.get_text()
                if heading_text.strip():
                    # Create heading style based on level
                    level = int(element.name[1])
                    if level <= 2:
                        heading_style = ParagraphStyle(
                            f'Heading{level}',
                            parent=base_style,
                            fontSize=14 - (level-1)*2,
                            fontName='Helvetica-Bold',
                            spaceBefore=10,
                            spaceAfter=6
                        )
                    else:
                        heading_style = ParagraphStyle(
                            f'Heading{level}',
                            parent=base_style,
                            fontSize=12 - (level-3),
                            fontName='Helvetica-Bold',
                            spaceBefore=8,
                            spaceAfter=4
                        )
                    
                    flowables.append(Paragraph(heading_text, heading_style))
                    flowables.append(Spacer(1, 0.05*inch))
        
        return flowables


    def generate_multiple_chat_pdf(self, buffer, conversations, include_timestamps, include_metadata, include_followups, format_code):
        """
        Generate PDF for multiple chat conversations with consistent formatting
        """
        # Create the PDF document
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=72
        )
        
        # Create story (list of flowables)
        story = []
        
        # Get styles
        styles = getSampleStyleSheet()
        title_style = styles['Title']
        heading1_style = styles['Heading1']
        heading2_style = styles['Heading2']
        normal_style = styles['Normal']
        
        # Add title
        story.append(Paragraph("Chat Conversations Export", title_style))
        story.append(Spacer(1, 0.25*inch))
        
        # Add date range info

        end_date = conversations.first().created_at + timedelta(days=1)
        date_range_text = f"Conversations from {conversations.last().created_at.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}"
        story.append(Paragraph(date_range_text, heading2_style))
        story.append(Spacer(1, 0.25*inch))
        
        # Process each conversation - CRITICAL CHANGE HERE: use a temporary buffer and the same processing as single chats
        for i, conversation in enumerate(conversations):
            # Add conversation header with page break for all except first
            if i > 0:
                story.append(PageBreak())
            
            # Add conversation title
            convo_title = conversation.title or f"Chat {conversation.created_at.strftime('%Y-%m-%d %H:%M')}"
            story.append(Paragraph(convo_title, heading1_style))
            story.append(Spacer(1, 0.1*inch))
            
            # Create a temporary buffer for this conversation
            temp_buffer = BytesIO()
            
            # Use the SAME function as single chat PDF to ensure consistent formatting
            self.generate_single_chat_pdf(
                temp_buffer, 
                conversation,
                include_timestamps,
                include_metadata,
                include_followups,
                format_code
            )
            
            # Extract the content from the temporary PDF
            temp_buffer.seek(0)
            
            # Instead of using the PDF directly, extract the flowables
            # We'll generate a fresh set of flowables for this conversation
            # matching exactly what would be produced for a single chat
            
            # Get messages for this conversation
            messages = conversation.messages.all().order_by('created_at')
            
            # Add metadata if requested
            if include_metadata:
                metadata = [
                    ["Created", conversation.created_at.strftime("%Y-%m-%d %H:%M")],
                    ["Conversation ID", str(conversation.conversation_id)]
                ]
                
                # Get document names if available
                if conversation.documents.exists():
                    doc_names = ", ".join([doc.filename for doc in conversation.documents.all()])
                    metadata.append(["Documents", doc_names])
                
                # Create metadata table
                metadata_table = Table(metadata, colWidths=[100, 350])
                metadata_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
                    ('TEXTCOLOR', (0, 0), (0, -1), colors.black),
                    ('ALIGN', (0, 0), (0, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, -1), 9),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                    ('TOPPADDING', (0, 0), (-1, -1), 6),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ]))
                
                story.append(metadata_table)
                story.append(Spacer(1, 0.2*inch))
            
            # Process messages
            for message in messages:
                role = message.role.capitalize()
                content = message.content
                
                # Add message role header
                role_text = f"{role}"
                story.append(Paragraph(role_text, heading2_style))
                
                # Add timestamp if requested
                if include_timestamps:
                    timestamp_style = ParagraphStyle(
                        'TimestampStyle',
                        parent=styles['Italic'],
                        fontSize=8,
                        textColor=colors.gray
                    )
                    timestamp = message.created_at.strftime("%Y-%m-%d %H:%M")
                    story.append(Paragraph(timestamp, timestamp_style))
                
                # Process the HTML content using the same method as in single chat
                content_flowables = self.process_html_for_pdf(
                    content,
                    normal_style,
                    ParagraphStyle('BulletStyle', parent=normal_style, leftIndent=20),
                    ParagraphStyle('CodeStyle', parent=normal_style, fontName='Courier', fontSize=9, backColor=colors.whitesmoke),
                    format_code
                )
                
                # Add each flowable to the story
                for flowable in content_flowables:
                    story.append(flowable)
                
                # Add spacing between messages
                story.append(Spacer(1, 0.2*inch))
            
            # Add follow-up questions if available and requested
            if include_followups and conversation.follow_up_questions:
                story.append(Spacer(1, 0.25*inch))
                story.append(Paragraph("Follow-up Questions", heading2_style))
                
                # Use ListFlowable for follow-up questions
                follow_up_items = []
                for i, question in enumerate(conversation.follow_up_questions, 1):
                    follow_up_items.append(ListItem(Paragraph(question, normal_style), leftIndent=20))
                
                if follow_up_items:
                    follow_up_list = ListFlowable(
                        follow_up_items,
                        bulletType='1',
                        start=1,
                        bulletFontSize=10,
                        bulletOffsetY=2,
                        leftIndent=10,
                        bulletDedent=10
                    )
                    story.append(follow_up_list)
            
            # Add separator between conversations
            if i < len(conversations) - 1:
                story.append(Spacer(1, 0.25*inch))
                story.append(HRFlowable(width="100%", thickness=1, lineCap='round', color=colors.lightgrey, spaceBefore=0.2*inch, spaceAfter=0.2*inch))
        
        # Build the PDF
        doc.build(story)
    
    def process_html_content(self, content, format_code):
        """Process HTML content to make it compatible with ReportLab while preserving format"""
        if not content:
            return ""
            
        # First, preserve code blocks by replacing them with placeholders
        code_blocks = []
        code_block_pattern = re.compile(r'<pre.*?>(.*?)</pre>', re.DOTALL)
        code_inline_pattern = re.compile(r'<code.*?>(.*?)</code>', re.DOTALL)
        
        # Extract and save code blocks
        for i, match in enumerate(code_block_pattern.finditer(content)):
            placeholder = f"__CODE_BLOCK_{i}__"
            code_blocks.append((placeholder, match.group(1)))
            content = content.replace(match.group(0), placeholder)
            
        # Extract and save inline code
        for i, match in enumerate(code_inline_pattern.finditer(content)):
            placeholder = f"__CODE_INLINE_{i}__"
            code_blocks.append((placeholder, match.group(1)))
            content = content.replace(match.group(0), placeholder)
        
        # Create soup for better HTML handling
        soup = BeautifulSoup(content, 'html.parser')
        
        # Process each HTML element type
        result_parts = []
        
        # Helper function to process HTML elements recursively
        def process_element(element, level=0, parent_type=None):
            if element.name is None:  # Text node
                text = element.string
                if text and text.strip():
                    return [(parent_type or 'p', text.strip())]
                return []
                
            output = []
            
            # Process specific HTML elements
            if element.name == 'b' or element.name == 'strong':
                # Handle bold text
                inner_text = "".join(str(child) for child in element.contents)
                return [('b', inner_text)]
                
            elif element.name == 'i' or element.name == 'em':
                # Handle italic text
                inner_text = "".join(str(child) for child in element.contents)
                return [('i', inner_text)]
                
            elif element.name == 'p':
                # Process paragraph content
                for child in element.children:
                    output.extend(process_element(child, level, 'p'))
                    
            elif element.name == 'ul':
                # Handle unordered lists
                for i, li in enumerate(element.find_all('li', recursive=False)):
                    li_content = "".join(str(child) for child in li.contents)
                    # Add bullet with proper indentation
                    output.append(('bullet', li_content, level))
                    
                    # Process any nested lists
                    nested_lists = li.find_all(['ul', 'ol'], recursive=False)
                    for nested_list in nested_lists:
                        output.extend(process_element(nested_list, level + 1))
                        
            elif element.name == 'ol':
                # Handle ordered lists
                for i, li in enumerate(element.find_all('li', recursive=False)):
                    li_content = "".join(str(child) for child in li.contents)
                    # Add numbered item with proper indentation
                    output.append(('number', li_content, level, i + 1))
                    
                    # Process any nested lists
                    nested_lists = li.find_all(['ul', 'ol'], recursive=False)
                    for nested_list in nested_lists:
                        output.extend(process_element(nested_list, level + 1))
                        
            elif element.name == 'h1' or element.name == 'h2' or element.name == 'h3':
                # Handle headings
                heading_text = "".join(str(child) for child in element.contents)
                output.append((f'h{element.name[1]}', heading_text))
                
            elif element.name == 'table':
                # Handle tables - simplified for now
                output.append(('table', str(element)))
                
            elif element.name == 'div' or element.name == 'span':
                # Process div/span content
                for child in element.children:
                    output.extend(process_element(child, level, parent_type or 'p'))
            
            # Handle more element types if needed
            else:
                # Fallback for other elements
                for child in element.children:
                    output.extend(process_element(child, level, parent_type or 'p'))
                    
            return output
            
        # Process the main content
        for child in soup.children:
            result_parts.extend(process_element(child))
        
        # Convert processed parts into a reportlab-compatible format
        reportlab_content = []
        
        for part in result_parts:
            if part[0] == 'p':
                # Paragraph text
                reportlab_content.append(part[1])
            elif part[0] == 'b':
                # Bold text
                reportlab_content.append(f"<b>{part[1]}</b>")
            elif part[0] == 'i':
                # Italic text
                reportlab_content.append(f"<i>{part[1]}</i>")
            elif part[0] == 'bullet':
                # Bullet point with indentation
                level = part[2]
                indent = "    " * level
                reportlab_content.append(f"{indent}• {part[1]}")
            elif part[0] == 'number':
                # Numbered item with indentation
                level = part[2]
                number = part[3]
                indent = "    " * level
                reportlab_content.append(f"{indent}{number}. {part[1]}")
            elif part[0].startswith('h'):
                # Heading
                reportlab_content.append(f"<b>{part[1]}</b>")
            elif part[0] == 'table':
                # Table - handled separately
                reportlab_content.append("[TABLE PLACEHOLDER]")
        
        # Join the content with proper spacing
        content = "\n".join(reportlab_content)
        
        # Restore code blocks
        for placeholder, code in code_blocks:
            if placeholder.startswith("__CODE_BLOCK_"):
                # Format as a code block with proper indentation
                formatted_code = "\n".join(["    " + line for line in code.split("\n")])
                content = content.replace(placeholder, f"\n{formatted_code}\n")
            else:
                # Inline code
                content = content.replace(placeholder, code)
        
        # Clean up multiple newlines and normalize spacing
        content = re.sub(r'\n{3,}', '\n\n', content)
        
        return content