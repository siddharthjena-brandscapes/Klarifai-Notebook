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
import requests
from bs4 import BeautifulSoup
import time
import re
import openai
from duckduckgo_search import DDGS
from urllib.parse import urlparse


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

            # Process document search early to get context for format detection
            all_chunks = []
            content_sources = []
            
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
            
            if use_web_knowledge:
                # Implement web search here instead of pass
                web_knowledge_response, web_sources = self.get_web_knowledge_response(message)
                print(f"Web knowledge response received, source count: {len(web_sources)}")
            
            # Get answer based on mode
            if general_chat_mode:
                # Process request in general chat mode (no documents needed)
                answer = self.get_general_chat_answer(message, use_web_knowledge, response_length, response_format)
                print("Generated response using general chat mode")
            else:
                # Process with documents
                if all_chunks:
                    # Generate document-based answer based on requested response length
                    if response_length == 'short':
                        document_answer = self.generate_short_response(message, similar_contents, content_sources, False, response_format)
                    else:  # Default to comprehensive
                        document_answer = self.generate_response(message, similar_contents, content_sources, False, response_format)
                    
                    print(f"Generated document-based answer using {response_length} response length")
                    
                    # If web knowledge is also requested, combine the responses
                    if use_web_knowledge and web_knowledge_response:
                        # Combined answer
                        answer = self.combine_document_and_web_responses(
                            message, 
                            document_answer, 
                            web_knowledge_response, 
                            content_sources, 
                            web_sources,
                            response_format
                        )
                        print("Combined document and web responses")
                    else:
                        # Just use document answer
                        answer = document_answer
                else:
                    if use_web_knowledge and web_knowledge_response:
                        # Only web knowledge available
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
                citations=citations,
                use_web_knowledge=use_web_knowledge,
                response_length=response_length,
                response_format=response_format
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
    
    def get_web_knowledge_response(self, query):
        """
        Search the web for information and generate a response.
        
        Args:
            query (str): The user's query
            
        Returns:
            tuple: (response, sources)
        """
        try:
            # Step 1: Search the web using DuckDuckGo
            web_results = self.search_web(query, max_results=5)
            
            if not web_results:
                return "I couldn't find relevant information on the web for your query.", []
            
            # Step 2: Scrape content from the top search results
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
            
            # Step 3: Generate a response using the scraped content
            # Prepare context from scraped contents
            context = ""
            for i, item in enumerate(scraped_contents, 1):
                context += f"Source {i} ({self.extract_domain(item['url'])}):\n"
                context += f"Title: {item['title']}\n"
                context += f"Content: {item['content'][:2500]}...\n\n"  # Limit each source content
            
            # Create the prompt for OpenAI
            prompt = f"""
            You are a web research assistant. Based on the following information from multiple web sources, 
            provide a comprehensive, accurate, and well-structured answer to the question.

            Question: {query}

            Information from web sources:
            {context}

            Please format your answer with proper HTML tags (<p>, <ul>, <li>, <b>, etc.) where appropriate, 
            and make sure to synthesize information from different sources. If the information is insufficient or 
            contradictory, acknowledge this in your response. If the question asks about time-sensitive information, 
            indicate when the data was retrieved.
            """
            
            # Generate response using OpenAI
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that provides comprehensive answers based on web search results."},
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
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
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
    
    def combine_document_and_web_responses(self, query, document_response, web_response, doc_sources, web_sources, response_format):
        """
        Combine document-based response and web-based response into a single coherent answer.
        
        Args:
            query (str): The original user query
            document_response (str): Response generated from document context
            web_response (str): Response generated from web search
            doc_sources (list): Document sources
            web_sources (list): Web sources
            
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



    def generate_response(self, query, context, sources, use_web_knowledge=False, response_format='natural'):
        """
        Generate a response using the provided context and sources with web search capability.
        
        Args:
            query (str): User's original query
            context (list): List of context chunks
            sources (list): List of source documents for each context chunk
            use_web_knowledge (bool): Whether to use web search in addition to documents
            
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
        
        # Define the user prompt (consistent with existing implementation)
        user_prompt = f"""
        Based ONLY on the following context from multiple documents, answer the question. If relevant details are not fully available, provide the information that is present and kindly note any specific information that is missing. Be helpful by mentioning related information that may assist in answering the question, and offer to expand on available details if useful. Additionally, provide quantitative details where needed.

        RESPONSE FORMAT: {response_format.replace('_', ' ').title()}
    
        {format_guidance}

        RESPONSE GENERATION GUIDELINES:
        - Provide a DETAILED, COMPREHENSIVE, and THOROUGH answer.
        - Include ALL relevant information from the context in your response.
        - Prioritize completeness over brevity - make sure to include details.
        - If multiple perspectives or data points exist, include all of them.
        - When appropriate, organize information with clear sections and structure.
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

    def generate_short_response(self, query, context, sources, use_web_knowledge=False, response_format='natural'):
        """
        Generate a shorter, concise response using the provided context with web search capability.
        
        Args:
            query (str): User's original query
            context (list): List of context chunks
            sources (list): List of source documents for each context chunk
            use_web_knowledge (bool): Whether to use web search in addition to documents
            
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
        
        # Define the user prompt for short response
        user_prompt = f"""
        Based ONLY on the following context from multiple documents, answer the question. If relevant details are not fully available, provide the information that is present and kindly note any specific information that is missing. Be helpful by mentioning related information that may assist in answering the question, and offer to expand on available details if useful. Additionally, provide quantitative details where needed.

        RESPONSE FORMAT: {response_format.replace('_', ' ').title()}
    
        {format_guidance}
     
        RESPONSE GENERATION GUIDELINES:
        - Provide a CONCISE yet THOROUGH answer.
        - Focus on the most relevant information from the context.
        - Prioritize clarity and directness over excessive detail.
        - When appropriate, organize information with clear sections and structure.
        - Maintain a natural, conversational tone.
        - Ensure the response is directly derived from the provided document context.
        - If the document does NOT contain relevant information, explicitly state that.
     
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
        system_message = "You are a document analysis expert. Provide a concise, to-the-point answer using only available information and use the appropriate html tags for formatting."
        
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
                    You are a web research assistant. Based on the following information from multiple web sources,
                    provide a {response_length} answer to the question.
 
                    RESPONSE FORMAT: {response_format.replace('_', ' ').title()}
                   
                    {format_guidance}
 
                    Question: {query}
 
                    Information from web sources:
                    {context}
 
                    Please format your answer with proper HTML tags (<p>, <ul>, <li>, <b>, etc.) where appropriate,
                    and make sure to synthesize information from different sources. If the information is insufficient or
                    contradictory, acknowledge this in your response. If the question asks about time-sensitive information,
                    indicate when the data was retrieved.
                   
                    RESPONSE LENGTH: {'Provide a focused, concise response prioritizing the most important information.' if response_length == 'short' else 'Provide a comprehensive, detailed response that thoroughly covers the topic.'}
                    """
                   
                    # Generate response using OpenAI
                    temperature = 0.3 if response_format in ['factual_brief', 'technical_deep_dive'] else 0.5
                    max_tokens = 800 if response_length == 'short' else 2000
                   
                    print(f"Calling OpenAI API with temperature={temperature}, max_tokens={max_tokens}")
                    response = client.chat.completions.create(
                        model="gpt-4o",
                        messages=[
                            {"role": "system", "content": "You are a helpful assistant that provides well-structured answers based on web search results."},
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

# class GenerateIdeaContextView(APIView):
#     """
#     API endpoint to extract structured idea generation parameters
#     from documents or query results.
#     """
   
#     def post(self, request):
#         user = request.user
#         document_id = request.data.get('document_id')
#         query = request.data.get('query')
#         main_project_id = request.data.get('main_project_id')
       
#         # Validate input - need either document_id or query
#         if not document_id and not query:
#             return Response({
#                 'error': 'Either document_id or query parameter is required'
#             }, status=status.HTTP_400_BAD_REQUEST)
           
#         try:
#             # Case 1: Using Document ID - fetch existing parameters or extract new ones
#             if document_id:
#                 document = get_object_or_404(Document, id=document_id, user=user)
                
#                 # Get document name without extension
#                 document_name_no_ext = self.remove_file_extension(document.filename)
                
#                 # Generate a unique project name - handle the case when main_project_id is None
#                 suggested_project_name = f"Ideas from {document_name_no_ext}"
#                 if main_project_id:
#                     try:
#                         suggested_project_name = self.generate_unique_project_name(document_name_no_ext, main_project_id)
#                     except Exception as e:
#                         # Log the error but continue with the default name
#                         print(f"Error generating unique project name: {str(e)}")
               
#                 try:
#                     # Check if we already have parameters stored
#                     processed_index = ProcessedIndex.objects.get(document=document)
                   
#                     # If parameters exist, return them
#                     if processed_index.idea_parameters:
#                         return Response({
#                             'document_id': document_id,
#                             'document_name': document.filename,
#                             'document_name_no_ext': document_name_no_ext,
#                             'idea_parameters': processed_index.idea_parameters,
#                             'suggested_project_name': suggested_project_name
#                         })
                   
#                     # If no parameters yet, extract them from the document
#                     index_file = processed_index.faiss_index
#                     metadata_file = processed_index.metadata
                   
#                     # Load index and metadata
#                     index, chunks = self.load_faiss_index_from_paths(index_file, metadata_file)
                   
#                     # Extract parameters from document content
#                     full_text = " ".join([chunk['text'] for chunk in chunks])
#                     idea_params = self.extract_idea_parameters(full_text, chunks)
                   
#                     # Save the parameters for future use
#                     processed_index.idea_parameters = idea_params
#                     processed_index.save()
                   
#                     return Response({
#                         'document_id': document_id,
#                         'document_name': document.filename,
#                         'document_name_no_ext': document_name_no_ext,
#                         'idea_parameters': idea_params,
#                         'suggested_project_name': suggested_project_name
#                     })
                   
#                 except ProcessedIndex.DoesNotExist:
#                     return Response({
#                         'error': 'Document has not been processed yet'
#                     }, status=status.HTTP_404_NOT_FOUND)
           
#             # Case 2: Using Query - search across documents and extract from relevant chunks
#             else:
#                 # Get active/selected document
#                 active_doc_id = request.session.get('active_document_id')
#                 if not active_doc_id:
#                     return Response({
#                         'error': 'No active document selected'
#                     }, status=status.HTTP_400_BAD_REQUEST)
               
#                 document = get_object_or_404(Document, id=active_doc_id, user=user)
#                 processed_index = get_object_or_404(ProcessedIndex, document=document)
                
#                 # Get document name without extension
#                 document_name_no_ext = self.remove_file_extension(document.filename)
                
#                 # Generate a unique project name - handle the case when main_project_id is None
#                 suggested_project_name = f"Ideas from {document_name_no_ext}"
#                 if main_project_id:
#                     try:
#                         suggested_project_name = self.generate_unique_project_name(document_name_no_ext, main_project_id)
#                     except Exception as e:
#                         # Log the error but continue with the default name
#                         print(f"Error generating unique project name: {str(e)}")
               
#                 # Load index and metadata
#                 index_file = processed_index.faiss_index
#                 metadata_file = processed_index.metadata
#                 index, chunks = self.load_faiss_index_from_paths(index_file, metadata_file)
               
#                 # Get embedding for query
#                 query_embedding = self.get_query_embedding(query)
               
#                 # Search for relevant chunks
#                 relevant_chunks = self.search_faiss_index(index, chunks, query_embedding, k=5)
               
#                 # Extract parameters from relevant chunks
#                 idea_params = self.extract_idea_parameters(query, relevant_chunks)
               
#                 return Response({
#                     'document_id': active_doc_id,
#                     'document_name': document.filename,
#                     'document_name_no_ext': document_name_no_ext,
#                     'query': query,
#                     'idea_parameters': idea_params,
#                     'suggested_project_name': suggested_project_name
#                 })
               
#         except Exception as e:
#             print(f"Error generating idea context: {str(e)}")
#             return Response({
#                 'error': str(e),
#                 'detail': 'An error occurred while generating idea context'
#             }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
#     def remove_file_extension(self, filename):
#         """
#         Remove file extension from filename
#         """
#         import os
#         return os.path.splitext(filename)[0]
    
#     def generate_unique_project_name(self, document_name, main_project_id):
#         """
#         Generate a unique project name based on document name,
#         adding (1), (2), etc. if needed to avoid duplicates
#         """
#         from ideaGen.models import Project
        
#         base_name = f"Ideas from {document_name}"
#         project_name = base_name
#         counter = 1
        
#         # Check for existing projects with this name in the main project
#         while Project.objects.filter(
#             name=project_name,
#             main_project_id=main_project_id
#         ).exists():
#             # Increment counter and update name
#             project_name = f"{base_name} ({counter})"
#             counter += 1
            
#         return project_name
   
#     def load_faiss_index_from_paths(self, index_file, metadata_file):
#         """Load FAISS index and metadata from file paths"""
#         import faiss
#         import pickle
       
#         try:
#             index = faiss.read_index(index_file)
#             with open(metadata_file, "rb") as f:
#                 chunks = pickle.load(f)
#             return index, chunks
#         except Exception as e:
#             print(f"Error loading FAISS index: {str(e)}")
#             return None, []
   
#     def get_query_embedding(self, query):
#         """Get embedding for the query"""
#         from openai import OpenAI
#         client = OpenAI()  # Initialize the client
       
#         try:
#             response = client.embeddings.create(
#                 input=[query],
#                 model="text-embedding-3-small"
#             )
#             return response.data[0].embedding
#         except Exception as e:
#             print(f"Error getting embedding for query: {str(e)}")
#             raise
   
#     def search_faiss_index(self, index, chunks, query_embedding, k=5):
#         """Search FAISS index for relevant chunks"""
#         import numpy as np
       
#         # Convert embedding to numpy array
#         query_vector = np.array([query_embedding]).astype('float32')
       
#         # Search index
#         distances, indices = index.search(query_vector, k=k)
       
#         # Get relevant chunks
#         results = []
#         for i in indices[0]:
#             if i < len(chunks):
#                 results.append(chunks[i])
       
#         return results
   
#     def extract_idea_parameters(self, context, relevant_chunks=None):
#         """
#         Extract structured parameters for the Idea Generator
       
#         Args:
#             context (str): Either full document content or query
#             relevant_chunks (list, optional): List of relevant chunks from search
           
#         Returns:
#             dict: Structured parameters for idea generation
#         """
#         from openai import OpenAI
#         client = OpenAI()  # Initialize the client
#         import json
       
#         try:
#             # If relevant chunks are provided, use them for extraction context
#             if relevant_chunks and len(relevant_chunks) > 0:
#                 extraction_context = "\n\n".join([chunk['text'] for chunk in relevant_chunks])
#             else:
#                 # If no chunks available, use the context directly
#                 extraction_context = context
               
#             # Create extraction prompt
#             extraction_prompt = f"""
#             Extract the following key parameters from the provided context.
#             If a parameter isn't explicitly mentioned, infer it from context or leave it blank.
           
#             Context:
#             {extraction_context}
           
#             Extract these parameters:
#             - Brand_Name: The company or product brand mentioned
#             - Category: The product category or market area
#             - Concept: The main idea, campaign, or product concept
#             - Benefits: Key benefits or value propositions (list up to 3)
#             - RTB: Reason to Believe - evidence supporting the benefits (list up to 3)
#             - Ingredients: Key ingredients or components (if applicable)
#             - Features: Notable product/service features (list up to 3)
#             - Theme: Overall theme or tone
#             - Demographics: Target audience demographics
           
#             Format the response as a valid JSON object with these fields.
#             """
           
#             # Call LLM to extract parameters
#             response = client.chat.completions.create(
#                 model="gpt-4o",  
#                 messages=[
#                     {"role": "system", "content": "You are a specialist in extracting structured information from documents."},
#                     {"role": "user", "content": extraction_prompt}
#                 ],
#                 response_format={"type": "json_object"}
#             )
           
#             # Parse JSON response
#             extracted_params = json.loads(response.choices[0].message.content)
           
#             return extracted_params
       
#         except Exception as e:
#             print(f"Error extracting idea parameters: {str(e)}")
#             # Return empty structure if extraction fails
#             return {
#                 "Brand_Name": "",
#                 "Category": "",
#                 "Concept": "",
#                 "Benefits": "",
#                 "RTB": "",
#                 "Ingredients": "",
#                 "Features": "",
#                 "Theme": "",
#                 "Demographics": ""
#             }


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


# Add this to views.py

# class DocumentContentSearchView(APIView):
#     permission_classes = [IsAuthenticated]
    
#     def post(self, request):
#         try:
#             user = request.user
#             query = request.data.get('query')
#             main_project_id = request.data.get('main_project_id')
            
#             if not query or not main_project_id:
#                 return Response({
#                     'error': 'Query and project ID are required'
#                 }, status=status.HTTP_400_BAD_REQUEST)
            
#             # Get all documents for this user and project
#             documents = Document.objects.filter(
#                 user=user, 
#                 main_project_id=main_project_id
#             )
            
#             search_results = []
            
#             # For each document, search for query in the content
#             for doc in documents:
#                 try:
#                     # Get the processed index for this document
#                     processed_index = ProcessedIndex.objects.get(document=doc)
                    
#                     # Check if we have the FAISS index and metadata path
#                     if processed_index.faiss_index and processed_index.metadata:
#                         # Load the metadata (chunks)
#                         if os.path.exists(processed_index.metadata):
#                             with open(processed_index.metadata, 'rb') as f:
#                                 chunks = pickle.load(f)
                            
#                             # Convert query to lowercase for case-insensitive search
#                             query_lower = query.lower()
#                             matches = []
                            
#                             # Search in each chunk
#                             for chunk in chunks:
#                                 chunk_text = chunk.get('text', '')
#                                 if chunk_text and query_lower in chunk_text.lower():
#                                     # Found a match, add the context
#                                     matches.append(chunk_text)
                            
#                             # If we found matches, add to results
#                             if matches:
#                                 # Use the first match for preview, but count all matches
#                                 search_results.append({
#                                     'id': doc.id,
#                                     'filename': doc.filename,
#                                     'match_count': len(matches),
#                                     'match_context': matches[0] if matches else "",
#                                     'uploaded_at': doc.uploaded_at.strftime('%Y-%m-%d %H:%M')
#                                 })
                                
#                 except ProcessedIndex.DoesNotExist:
#                     # Skip documents that haven't been processed
#                     continue
#                 except Exception as e:
#                     logger.error(f"Error searching document {doc.id}: {str(e)}")
#                     continue
            
#             # Sort results by number of matches (most relevant first)
#             search_results.sort(key=lambda x: x['match_count'], reverse=True)
            
#             return Response({
#                 'results': search_results,
#                 'total_count': len(search_results)
#             }, status=status.HTTP_200_OK)
            
#         except Exception as e:
#             logger.error(f"Error in document content search: {str(e)}")
#             return Response({
#                 'error': f'An error occurred: {str(e)}'
#             }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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