

# #Simplified Code

# #views.py original
# from django.contrib.auth.models import User
# from django.contrib.auth import authenticate, login
# from django.contrib.auth.hashers import check_password
# from rest_framework import status
# from rest_framework.response import Response
# from rest_framework.views import APIView
# from rest_framework.parsers import MultiPartParser, FormParser
# from rest_framework.permissions import IsAuthenticated, AllowAny 
# import faiss
# import numpy as np
# import os
# import pickle
# import tempfile
# import re
# from datetime import datetime
# from django.core.files.storage import default_storage
# from django.conf import settings
# # from nltk.tokenize import word_tokenize
# # from nltk.corpus import stopwords
# # from nltk.util import ngrams
# from collections import Counter
# import google.generativeai as genai  # Merged single instance
# # from sklearn.feature_extraction.text import TfidfVectorizer
# # from sklearn.decomposition import LatentDirichletAllocation
# # from llama_parse import LlamaParse
# from .models import (
#     ChatHistory,
#     ChatMessage,
#     Document,
#     ProcessedIndex,
#     ConversationMemoryBuffer
# )
# import uuid
# from rest_framework.authtoken.models import Token
# from django.utils.safestring import mark_safe
# import logging
# from .models import UserProfile
# logger = logging.getLogger(__name__)
# from core.models import Project
# import openai
# from openai import OpenAI
# from dotenv import load_dotenv
# import os
# import tiktoken


# load_dotenv()

# OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

# if not OPENAI_API_KEY:
#     raise ValueError("Missing required API keys in environment variables")



# client = OpenAI(api_key=OPENAI_API_KEY)

# # Configure Google Generative AI
# GOOGLE_API_KEY = "AIzaSyDOKm5KYY6LjLa20IbZg027fQauwyMOKWQ"
# genai.configure(api_key=GOOGLE_API_KEY)
# # model = genai.GenerativeModel('gemini-1.5-flash')
# GENERATIVE_MODEL = genai.GenerativeModel('gemini-1.5-flash', 
#     generation_config={
#         'temperature': 0.7,
#         'max_output_tokens': 1024
#     },
#     safety_settings={
#         genai.types.HarmCategory.HARM_CATEGORY_HATE_SPEECH: genai.types.HarmBlockThreshold.BLOCK_NONE,
#         genai.types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: genai.types.HarmBlockThreshold.BLOCK_NONE,
#         genai.types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: genai.types.HarmBlockThreshold.BLOCK_NONE,
#         genai.types.HarmCategory.HARM_CATEGORY_HARASSMENT: genai.types.HarmBlockThreshold.BLOCK_NONE
#     }
# )

# class SignupView(APIView):
#     # Explicitly set permission to allow any user (including unauthenticated)
#     permission_classes = [AllowAny]
#     authentication_classes = []  # Disable authentication checks

#     def post(self, request):
#         # Extract data from request
#         username = request.data.get('username')
#         email = request.data.get('email')
#         password = request.data.get('password')

#         # Validate input
#         if not username or not email or not password:
#             return Response({
#                 'error': 'Please provide username, email, and password'
#             }, status=status.HTTP_400_BAD_REQUEST)

#         # Check if user already exists
#         if User.objects.filter(username=username).exists():
#             return Response({
#                 'error': 'Username already exists'
#             }, status=status.HTTP_400_BAD_REQUEST)

#         # Create new user
#         try:
#             user = User.objects.create_user(
#                 username=username, 
#                 email=email, 
#                 password=password
#             )
            
#             # Generate token for the new user
#             token, _ = Token.objects.get_or_create(user=user)
            
#             return Response({
#                 'message': 'User created successfully',
#                 'token': token.key,
#                 'username': user.username
#             }, status=status.HTTP_201_CREATED)

#         except Exception as e:
#             return Response({
#                 'error': str(e)
#             }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# class LoginView(APIView):
#     # Explicitly set permission to allow any user (including unauthenticated)
#     permission_classes = [AllowAny]
#     authentication_classes = []  # Disable authentication checks

#     def post(self, request):
#         username = request.data.get('username')
#         password = request.data.get('password')

#         # Validate input
#         if not username or not password:
#             return Response({
#                 'error': 'Please provide username and password'
#             }, status=status.HTTP_400_BAD_REQUEST)

#         # Authenticate user
#         user = authenticate(username=username, password=password)

#         if user:
#             # Generate or get existing token
#             token, _ = Token.objects.get_or_create(user=user)
            
#             return Response({
#                 'token': token.key,
#                 'username': user.username
#             }, status=status.HTTP_200_OK)
        
#         return Response({
#             'error': 'Invalid credentials'
#         }, status=status.HTTP_401_UNAUTHORIZED)


# class ChangePasswordView(APIView):
#     permission_classes = [IsAuthenticated]

#     def post(self, request):
#         user = request.user
#         current_password = request.data.get('current_password')
#         new_password = request.data.get('new_password')

#         # Validate input
#         if not current_password or not new_password:
#             return Response({
#                 'message': 'Both current and new password are required'
#             }, status=status.HTTP_400_BAD_REQUEST)

#         # Check if current password is correct
#         if not check_password(current_password, user.password):
#             return Response({
#                 'message': 'Current password is incorrect'
#             }, status=status.HTTP_400_BAD_REQUEST)

#         # Set new password
#         user.set_password(new_password)
#         user.save()

#         return Response({
#             'message': 'Password updated successfully'
#         }, status=status.HTTP_200_OK)

# #new
# class UserProfileView(APIView):
#     permission_classes = [IsAuthenticated]
#     parser_classes = (MultiPartParser, FormParser)

#     def get(self, request):
#         user = request.user
#         try:
#             profile = UserProfile.objects.get(user=user)
#             if profile.profile_picture:
#                 profile_picture = request.build_absolute_uri(profile.profile_picture.url)
#             else:
#                 profile_picture = f'https://ui-avatars.com/api/?name={user.username}&background=random'
#         except UserProfile.DoesNotExist:
#             profile_picture = f'https://ui-avatars.com/api/?name={user.username}&background=random'
        
#         return Response({
#             'username': user.username,
#             'email': user.email,
#             'first_name': user.first_name,
#             'last_name': user.last_name,
#             'profile_picture': profile_picture,
#             'date_joined': user.date_joined,
#         }, status=status.HTTP_200_OK)

#     def post(self, request):
#         try:
#             user = request.user
#             profile_picture = request.FILES.get('profile_picture')
            
#             if not profile_picture:
#                 return Response({
#                     'error': 'No profile picture provided'
#                 }, status=status.HTTP_400_BAD_REQUEST)
            
#             # Validate file type
#             allowed_types = ['image/jpeg', 'image/png', 'image/gif']
#             if profile_picture.content_type not in allowed_types:
#                 return Response({
#                     'error': 'Invalid file type. Only JPG, PNG, and GIF are allowed.'
#                 }, status=status.HTTP_400_BAD_REQUEST)
            
#             # Validate file size (2MB limit)
#             if profile_picture.size > 2 * 1024 * 1024:
#                 return Response({
#                     'error': 'File size too large. Maximum size is 2MB.'
#                 }, status=status.HTTP_400_BAD_REQUEST)
            
#             # Get or create profile
#             profile, created = UserProfile.objects.get_or_create(user=user)
            
#             # Delete old profile picture if it exists
#             if profile.profile_picture:
#                 try:
#                     old_file_path = profile.profile_picture.path
#                     if os.path.exists(old_file_path):
#                         os.remove(old_file_path)
#                 except Exception as e:
#                     print(f"Error deleting old profile picture: {e}")
            
#             # Generate unique filename
#             file_extension = os.path.splitext(profile_picture.name)[1]
#             unique_filename = f"{user.username}_{uuid.uuid4().hex[:8]}{file_extension}"
            
#             # Save the new profile picture
#             profile.profile_picture.save(
#                 unique_filename,
#                 profile_picture,
#                 save=True
#             )
            
#             # Build the full URL
#             profile_picture_url = request.build_absolute_uri(profile.profile_picture.url)
            
#             return Response({
#                 'message': 'Profile picture updated successfully',
#                 'profile_picture': profile_picture_url
#             }, status=status.HTTP_200_OK)
            
#         except Exception as e:
#             return Response({
#                 'error': str(e)
#             }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# class GetUserDocumentsView(APIView):
#     def get(self, request):
#         try:
#             user = request.user
#             main_project_id = request.query_params.get('main_project_id')
#             print(f"Getting documents for user {user.username} and project {main_project_id}")
#             if not main_project_id:
#                 return Response({
#                     'error': 'Main project ID is required'
#                 }, status=status.HTTP_400_BAD_REQUEST)
            
#             documents = Document.objects.filter(user=user, main_project_id=main_project_id).select_related('processedindex')
        
#             document_list = []
#             for doc in documents:
#                 try:
#                     processed = doc.processedindex
#                     document_data = {
#                         'id': doc.id,
#                         'filename': doc.filename,
#                         'uploaded_at': doc.uploaded_at.strftime('%Y-%m-%d %H:%M'),
#                         'summary': processed.summary,
#                         'follow_up_questions': [
#                             processed.follow_up_question_1,
#                             processed.follow_up_question_2,
#                             processed.follow_up_question_3
#                         ] if all([processed.follow_up_question_1,
#                                 processed.follow_up_question_2,
#                                 processed.follow_up_question_3]) else []
#                     }
#                     document_list.append(document_data)
                    
#                     # Print the document data
#                     print(f"Document Response - ID: {doc.id}")
#                     print(f"Filename: {document_data['filename']}")
#                     print(f"Summary: {document_data['summary'][:200]}...")  # First 200 chars
#                     print(f"Follow-up Questions: {document_data['follow_up_questions']}")
#                     print("---")
                
#                 except ProcessedIndex.DoesNotExist:
#                     document_data = {
#                         'id': doc.id,
#                         'filename': doc.filename,
#                         'uploaded_at': doc.uploaded_at.strftime('%Y-%m-%d %H:%M'),
#                         'summary': 'Document processing pending',
#                         'follow_up_questions': []
#                     }
#                     document_list.append(document_data)
            
#             # Print full document list
#             print("Full Document List Response:")
#             print(document_list)
            
#             return Response(document_list, status=status.HTTP_200_OK)
        
#         except Exception as e:
#             print(f"Error in GetUserDocumentsView: {str(e)}")
#             return Response(
#                 {'error': f'Failed to fetch documents: {str(e)}'},
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR
#             )

# class ManageConversationView(APIView):
#     permission_classes = [IsAuthenticated]
    
#     def update_conversation(self, request, conversation_id):
#         try:
#             # Log incoming request data for debugging
#             print(f"Incoming update request for conversation {conversation_id}")
#             print(f"Request data: {request.data}")

#             # Validate input
#             new_title = request.data.get('title')
#             is_active = request.data.get('is_active', True)

#             if not new_title or not new_title.strip():
#                 return Response(
#                     {'error': 'Title cannot be empty'},
#                     status=status.HTTP_400_BAD_REQUEST
#                 )

#             # Find the conversation
#             try:
#                 conversation = ChatHistory.objects.get(
#                     conversation_id=conversation_id, 
#                     user=request.user
#                 )
#             except ChatHistory.DoesNotExist:
#                 return Response(
#                     {'error': 'Conversation not found'},
#                     status=status.HTTP_404_NOT_FOUND
#                 )

#             # Update the title and active status
#             conversation.title = new_title.strip()
#             conversation.is_active = is_active
#             conversation.save()

#             # Log successful update
#             print(f"Conversation {conversation_id} updated successfully")
#             print(f"New title: {conversation.title}")

#             return Response({
#                 'message': 'Conversation title updated successfully',
#                 'conversation_id': str(conversation.conversation_id),
#                 'new_title': conversation.title,
#                 'is_active': conversation.is_active
#             }, status=status.HTTP_200_OK)

#         except Exception as e:
#             # Comprehensive error logging
#             print(f"Error updating conversation title: {str(e)}")
#             logger.error(f"Conversation title update error: {str(e)}")

#             return Response(
#                 {'error': 'Failed to update conversation title', 'details': str(e)},
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR
#             )

#     def put(self, request, conversation_id):
#         return self.update_conversation(request, conversation_id)

#     def patch(self, request, conversation_id):
#         return self.update_conversation(request, conversation_id)

# class DocumentUploadView(APIView):
#     parser_classes = (MultiPartParser, FormParser)

#     def post(self, request):
#         files = request.FILES.getlist('files')
#         user = request.user
#         main_project_id = request.data.get('main_project_id')

#         try:
#             main_project = Project.objects.get(id=main_project_id, user=user)
#             uploaded_docs = []
#             last_processed_doc_id = None
#             processed_data = None  # Initialize processed_data outside the loop

#             for file in files:
#                 # Check for existing document
#                 existing_doc = Document.objects.filter(
#                     user=user, 
#                     filename=file.name,
#                     main_project=main_project
#                 ).first()

#                 if existing_doc:
#                     try:
#                         processed_index = ProcessedIndex.objects.get(document=existing_doc)
#                         uploaded_docs.append({
#                             'id': existing_doc.id,
#                             'filename': existing_doc.filename,
#                             'summary': processed_index.summary,
#                         })
#                         last_processed_doc_id = existing_doc.id
#                         processed_data = {
#                             'summary': processed_index.summary,
#                             'follow_up_questions': []  # Add default value if needed
#                         }
#                     except ProcessedIndex.DoesNotExist:
#                         # Process the document if no existing index
#                         processed_data = self.process_document(file)
                        
#                         # Create ProcessedIndex
#                         ProcessedIndex.objects.create(
#                             document=existing_doc,
#                             faiss_index=processed_data['index_path'],
#                             metadata=processed_data['metadata_path'],
#                             summary=processed_data['summary']
#                         )

#                         uploaded_docs.append({
#                             'id': existing_doc.id,
#                             'filename': existing_doc.filename,
#                             'summary': processed_data['summary']
#                         })
#                         last_processed_doc_id = existing_doc.id
#                 else:
#                     # Create new document first
#                     document = Document.objects.create(
#                         user=user, 
#                         file=file, 
#                         filename=file.name,
#                         main_project=main_project
#                     )
                    
#                     # Then process it
#                     processed_data = self.process_document(file)
                    
#                     # Create ProcessedIndex
#                     ProcessedIndex.objects.create(
#                         document=document,
#                         faiss_index=processed_data['index_path'],
#                         metadata=processed_data['metadata_path'],
#                         summary=processed_data['summary']
#                     )

#                     uploaded_docs.append({
#                         'id': document.id,
#                         'filename': document.filename,
#                         'summary': processed_data['summary']
#                     })
#                     last_processed_doc_id = document.id

#                     print(f"Uploaded Document - ID: {document.id}")
#                     print(f"Filename: {document.filename}")
#                     print(f"Summary: {processed_data['summary'][:200]}...")
#                     print(f"Follow-up Questions: {processed_data.get('follow_up_questions', [])}")
#                     print("---")

#             # Store the last processed document ID in the session
#             request.session['active_document_id'] = last_processed_doc_id

#             # Ensure we have processed_data before using it
#             if processed_data is None:
#                 return Response({
#                     'error': 'No documents were successfully processed'
#                 }, status=status.HTTP_400_BAD_REQUEST)

#             return Response({
#                 'message': 'Documents processed successfully',
#                 'documents': [{
#                     'id': last_processed_doc_id,
#                     'filename': file.name,
#                     'summary': processed_data['summary'],
#                     'follow_up_questions': processed_data.get('follow_up_questions', []),
#                 }],
#                 'active_document_id': last_processed_doc_id
#             }, status=status.HTTP_201_CREATED)

#         except Exception as e:
#             print(f"Error processing document: {str(e)}")  # Add this for debugging
#             return Response({
#                 'error': str(e),
#                 'detail': 'An error occurred while processing the document'
#             }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

#     def detect_document_complexity(self, file_path):
#         """Detect if PDF contains images."""
#         import fitz
#         try:
#             doc = fitz.open(file_path)
#             for page in doc:
#                 images = page.get_images()
#                 if images:
#                     return True
#             return False
#         except Exception as e:
#             print(f"Error detecting images in PDF: {e}")
#             return False
#     def process_with_local_parser(self, file_path):
#         """Process PDF using local PyMuPDF for text extraction."""
#         print("#####################################################")
#         import fitz
#         try:
#             doc = fitz.open(file_path)
#             full_text = ""
#             parsed_documents = []
            
#             for page_num, page in enumerate(doc):
#                 text = page.get_text()
#                 full_text += text + "\n"
#                 # Store as a dictionary instead of Document object
#                 parsed_documents.append({
#                     "content": text,
#                     "metadata": {
#                         "page": page_num + 1,
#                         "source": file_path
#                     }
#                 })
            
#             return parsed_documents, full_text
#         except Exception as e:
#             print(f"Error in local PDF processing: {e}")
#             return [], ""

#     def process_document(self, file):
#         try:
#             with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
#                 for chunk in file.chunks():
#                     tmp_file.write(chunk)
#                 pdf_path = tmp_file.name
                
#             try:
#                 # Initialize FAISS index for 1536-dimensional embeddings
#                 faiss_index = faiss.IndexFlatL2(1536)
                
#                 # Check document complexity
#                 is_complex = self.detect_document_complexity(pdf_path)
                
#                 # Process document based on complexity
#                 if is_complex:
#                     parsed_documents, full_text = self.process_with_local_parser(pdf_path)
#                 else:
#                     parsed_documents, full_text = self.process_with_local_parser(pdf_path)
                
#                 if not parsed_documents:
#                     raise ValueError("No content could be extracted from the document")
                
#                 summary, follow_up_questions = self.generate_summary(full_text, file.name)
                
#                 # True late chunking implementation
#                 chunks_with_embeddings = self.true_late_chunking(full_text)
                
#                 # Create metadata store
#                 metadata_store = []
#                 embeddings_list = []
                
#                 for chunk_data in chunks_with_embeddings:
#                     metadata = {
#                         "content": chunk_data['text'],
#                         "source_file": file.name,
#                         "page_number": 'Unknown',  # Will be updated if available
#                         "section_title": 'Unknown',
#                         "chunk_start": chunk_data['span'][0],
#                         "chunk_end": chunk_data['span'][1]
#                     }
#                     metadata_store.append(metadata)
#                     embeddings_list.append(chunk_data['embedding'])
                
#                 # Convert embeddings to numpy array and add to FAISS index
#                 if embeddings_list:
#                     embeddings_array = np.array(embeddings_list).astype('float32')
#                     faiss_index.add(embeddings_array)
                
#                 # Save FAISS index and metadata
#                 index_path, metadata_path = self.save_index_and_metadata(faiss_index, metadata_store, file.name)
                
#                 return {
#                     'index_path': index_path,
#                     'metadata_path': metadata_path,
#                     'summary': summary,
#                     'follow_up_questions': follow_up_questions,
#                     'full_text': full_text
#                 }
                
#             finally:
#                 if os.path.exists(pdf_path):
#                     os.unlink(pdf_path)
                    
#         except Exception as e:
#             print(f"Error in process_document: {str(e)}")
#             raise

#     def true_late_chunking(self, text, max_tokens=8192, chunk_size=512):
#         """
#         Implement true late chunking strategy:
#         1. Get token embeddings for entire document
#         2. Chunk the token embeddings
#         3. Pool embeddings within chunks
#         """
#         print("*************************************")
#         try:
#             encoding = tiktoken.get_encoding("cl100k_base")
#             tokens = encoding.encode(text)
            
#             # Process in batches if text is too long
#             if len(tokens) > max_tokens:
#                 return self.process_long_document_late_chunking(text, tokens, encoding, max_tokens, chunk_size)
            
#             # Get token-level embeddings for the entire text
#             response = client.embeddings.create(
#                 input=text,
#                 model="text-embedding-3-small",
#                 encoding_format="float"  # Get raw token embeddings
#             )
            
#             # Get token-level embeddings
#             token_embeddings = np.array(response.data[0].embedding).reshape(-1, 1536)  # Reshape to token-level
            
#             # Create chunks of token embeddings
#             chunks_with_embeddings = []
#             for i in range(0, len(tokens), chunk_size):
#                 chunk_tokens = tokens[i:i + chunk_size]
#                 chunk_text = encoding.decode(chunk_tokens)
                
#                 # Get corresponding token embeddings for this chunk
#                 chunk_token_embeddings = token_embeddings[i:i + len(chunk_tokens)]
                
#                 # Pool the token embeddings for this chunk (using mean pooling)
#                 chunk_embedding = np.mean(chunk_token_embeddings, axis=0)
                
#                 # Normalize the embedding
#                 chunk_embedding = chunk_embedding / np.linalg.norm(chunk_embedding)
                
#                 chunks_with_embeddings.append({
#                     'text': chunk_text,
#                     'span': (i, i + len(chunk_tokens)),
#                     'embedding': chunk_embedding
#                 })
            
#             return chunks_with_embeddings
            
#         except Exception as e:
#             print(f"Error in true_late_chunking: {str(e)}")
#             return []

#     def process_long_document_late_chunking(self, text, tokens, encoding, max_tokens, chunk_size):
#         """Process long documents using late chunking strategy."""
#         print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
#         chunks_with_embeddings = []
#         window_size = max_tokens
#         stride = max_tokens // 2
        
#         for i in range(0, len(tokens), stride):
#             window_tokens = tokens[i:i + window_size]
#             window_text = encoding.decode(window_tokens)
            
#             # Get token-level embeddings for this window
#             response = client.embeddings.create(
#                 input=window_text,
#                 model="text-embedding-3-small",
#                 encoding_format="float"
#             )
            
#             # Get token-level embeddings for this window
#             window_token_embeddings = np.array(response.data[0].embedding).reshape(-1, 1536)
            
#             # Create chunks from this window's token embeddings
#             for j in range(0, len(window_tokens), chunk_size):
#                 chunk_tokens = window_tokens[j:j + chunk_size]
#                 chunk_text = encoding.decode(chunk_tokens)
                
#                 # Get corresponding token embeddings for this chunk
#                 chunk_token_embeddings = window_token_embeddings[j:j + len(chunk_tokens)]
                
#                 # Pool the token embeddings for this chunk
#                 chunk_embedding = np.mean(chunk_token_embeddings, axis=0)
#                 chunk_embedding = chunk_embedding / np.linalg.norm(chunk_embedding)
                
#                 # Only add non-duplicate chunks
#                 global_span = (i + j, i + j + len(chunk_tokens))
#                 if not any(chunk['span'][0] == global_span[0] for chunk in chunks_with_embeddings):
#                     chunks_with_embeddings.append({
#                         'text': chunk_text,
#                         'span': global_span,
#                         'embedding': chunk_embedding
#                     })
        
#         return chunks_with_embeddings

#     def save_index_and_metadata(self, index, metadata, pdf_name):
#         """Save FAISS index and metadata"""
#         base_name = os.path.splitext(pdf_name)[0]
#         safe_name = re.sub(r'[^\w\-_.]', '_', base_name)
        
#         # Create directories if they don't exist
#         index_dir = os.path.join(settings.MEDIA_ROOT, 'indices')
#         metadata_dir = os.path.join(settings.MEDIA_ROOT, 'metadata')
#         os.makedirs(index_dir, exist_ok=True)
#         os.makedirs(metadata_dir, exist_ok=True)

#         index_path = os.path.join(index_dir, f"{safe_name}_index.faiss")
#         metadata_path = os.path.join(metadata_dir, f"{safe_name}_metadata.pkl")

#         faiss.write_index(index, index_path)
#         with open(metadata_path, 'wb') as f:
#             pickle.dump(metadata, f)

#         return index_path, metadata_path

    
    # def generate_summary(self, content, file_name):
    #     max_chars = 30000
    #     truncated_content = content[:max_chars] if len(content) > max_chars else content
    
    #     prompt = f"""
    #     Please analyze this document '{file_name}' and provide:
    #     1. A concise summary of the main points and key findings
        
    
    #     Content: {truncated_content}
    
    #     ### Instructions:
    #     - Use semantic HTML-like tags for structure
    #     - Provide a clear, organized summary
    #     - Highlight key insights with <b> tags
    #     - Use <p> tags for paragraphs
    #     - Use <ul> and <li> for list-based information

    #     ### Expected Response Format:
    #     <b>Summary Overview</b>
    #     <p>High-level introduction to the document's main theme</p>

    #     <b>Key Highlights</b>
    #     <ul>
    #         <li>First major insight</li>
    #         <li>Second major insight</li>
    #         <li>Third major insight</li>
    #     </ul>

    #     <b>Detailed Insights</b>
    #     <p>Expanded explanation of the document's core content and significance</p>

        
    #     """
    
    #     try:
    #         response = GENERATIVE_MODEL.generate_content(prompt)
    #         response_text = response.text
            
    #         # Ensure proper HTML-like formatting
    #         # Wrap paragraphs in <p> tags if not already wrapped
    #         response_text = re.sub(r'^(?!<[p|b|u|ul|li])(.*?)$', r'<p>\1</p>', response_text, flags=re.MULTILINE)
            
    #         # Ensure bold tags for section headers
    #         section_headers = ['Summary Overview', 'Key Highlights', 'Detailed Insights']
    #         for header in section_headers:
    #             response_text = response_text.replace(header, f'<b>{header}</b>')
            
    #         # Extract follow-up questions
    #         parts = response_text.split('Follow-up Questions:')
    #         summary = parts[0].strip()
            
    #         # Extract or generate follow-up questions
    #         try:
    #             questions = [q.strip().lstrip('123. ') for q in parts[1].strip().split('\n') if q.strip()] if len(parts) > 1 else []
    #         except:
    #             questions = []
            
    #         # # Ensure 3 follow-up questions
    #         # while len(questions) < 3:
    #         #     questions.append("What other aspects of this document would you like to explore?")
            
    #         return summary, questions[:3]
        
    #     except Exception as e:
    #         print(f"Error generating summary: {str(e)}")
    #         return (
    #             f"""
    #             <b>Summary Generation Error</b>
    #             <p>Unable to generate a comprehensive summary for {file_name}</p>
                
    #             <b>Possible Reasons</b>
    #             <ul>
    #                 <li>Document may be too complex</li>
    #                 <li>Parsing issues encountered</li>
    #                 <li>Insufficient context extracted</li>
    #             </ul>
    #             """,
    #             [
    #                 "What would you like to know about this document?",
    #                 "Would you like me to explain any specific part?",
    #                 "Shall we discuss the document in more detail?"
    #             ]
    #         )
        
# class DeleteDocumentView(APIView):
#     permission_classes = [IsAuthenticated]
    
#     def delete(self, request, document_id):
#         try:
#             # Find the document and ensure it belongs to the current user
#             document = Document.objects.get(
#                 id=document_id, 
#                 user=request.user
#             )
            
#             # Optional: Delete associated ProcessedIndex
#             try:
#                 processed_index = ProcessedIndex.objects.get(document=document)
#                 processed_index.delete()
#             except ProcessedIndex.DoesNotExist:
#                 pass
            
#             # Delete the document
#             document.delete()
            
#             return Response(
#                 {'message': 'Document deleted successfully'}, 
#                 status=status.HTTP_200_OK
#             )
        
#         except Document.DoesNotExist:
#             return Response(
#                 {'error': 'Document not found'}, 
#                 status=status.HTTP_404_NOT_FOUND
#             )
#         except Exception as e:
#             return Response(
#                 {'error': f'Failed to delete document: {str(e)}'}, 
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR
#             )


# class GetChatHistoryView(APIView):
#     def get(self, request):
#         try:
#             user = request.user
#             main_project_id = request.query_params.get('main_project_id')
            
#             print(f"Getting chat history for user {user.username} and project {main_project_id}")
            
#             if not main_project_id:
#                 return Response({
#                     'error': 'Main project ID is required'
#                 }, status=status.HTTP_400_BAD_REQUEST)

#             # Filter conversations by both user and main_project_id
#             conversations = ChatHistory.objects.filter(
#                 user=user,
#                 main_project_id=main_project_id,
#                 is_active=True
#             ).order_by('-created_at')
            
#             history = []
#             for conversation in conversations:
#                 messages = conversation.messages.all().order_by('created_at')
#                 message_list = [
#                     {
#                         'role': message.role,
#                         'content': message.content,
#                         'created_at': message.created_at.strftime('%Y-%m-%d %H:%M'),
#                         'citations': message.citations or []
#                     } for message in messages
#                 ]
                
#                 history.append({
#                     'conversation_id': str(conversation.conversation_id),
#                     'title': conversation.title or f"Chat from {conversation.created_at.strftime('%Y-%m-%d %H:%M')}",
#                     'created_at': conversation.created_at.strftime('%Y-%m-%d %H:%M'),
#                     'messages': message_list,
#                     'preview': message_list[0]['content'] if message_list else "",
#                     'follow_up_questions': conversation.follow_up_questions or [],
#                     'selected_documents': [str(doc.id) for doc in conversation.documents.all()]
#                 })

#             return Response(history, status=status.HTTP_200_OK)
            
#         except Exception as e:
#             print(f"Error in GetChatHistoryView: {str(e)}")
#             return Response(
#                 {'error': f'Failed to fetch chat history: {str(e)}'}, 
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR
#             )
        
        
# class SetActiveDocumentView(APIView):
#     def post(self, request):
#         try:
#             document_id = request.data.get('document_id')
            
#             if not document_id:
#                 return Response(
#                     {'error': 'Document ID is required'},
#                     status=status.HTTP_400_BAD_REQUEST
#                 )

#             # Verify the document exists and belongs to the user
#             try:
#                 document = Document.objects.get(
#                     id=document_id, 
#                     user=request.user
#                 )
                
#                 # Check if document is processed
#                 ProcessedIndex.objects.get(document=document)
#             except Document.DoesNotExist:
#                 return Response(
#                     {'error': 'Document not found'},
#                     status=status.HTTP_404_NOT_FOUND
#                 )
#             except ProcessedIndex.DoesNotExist:
#                 return Response(
#                     {'error': 'Document not processed'},
#                     status=status.HTTP_400_BAD_REQUEST
#                 )

#             # Set the active document in the session
#             request.session['active_document_id'] = document_id

#             return Response({
#                 'message': 'Active document set successfully',
#                 'active_document_id': document_id,
#                 'filename': document.filename
#             }, status=status.HTTP_200_OK)
        
#         except Document.DoesNotExist:
#             return Response(
#                 {'error': 'Document not found'},
#                 status=status.HTTP_404_NOT_FOUND
#             )
        
#         except Exception as e:
#             import traceback
#             print(f"Detailed Error: {str(e)}")
#             print(traceback.format_exc())  # This will print the full stack trace
#             return Response(
#                 {'error': f'An unexpected error occurred: {str(e)}'}, 
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR
#             )
# def post_process_response(response_text):
#     """
#     Post-process the generated response to improve formatting and readability
    
#     Args:
#         response_text (str): Raw generated response text
    
#     Returns:
#         str: Cleaned and formatted response
#     """
#     try:
#         # Remove explicit section headers
#         # Remove Roman numeral section headers
#         response_text = re.sub(r'^[IVX]+\.\s*[\w\s]+:', '', response_text, flags=re.MULTILINE)
        
#         # Remove numbered section headers
#         response_text = re.sub(r'^\d+\.\s*[\w\s]+:', '', response_text, flags=re.MULTILINE)
        
#         # Remove any remaining explicit section titles
#         section_headers = [
#             'Contextual Insight', 
#             'Structured Response', 
#             'Analytical Depth', 
#             'Interactive Engagement'
#         ]
#         for header in section_headers:
#             response_text = response_text.replace(header + ':', '')
        
#         # Clean up extra whitespace
#         response_text = re.sub(r'\n{3,}', '\n\n', response_text)
        
#         # Ensure proper HTML tag formatting
#         # Wrap paragraphs in <p> tags if not already wrapped
#         response_text = re.sub(r'^(?!<[p|b|u])(.*?)$', r'<p>\1</p>', response_text, flags=re.MULTILINE)
        
#         # Add bold tags for key points if not already present
#         response_text = re.sub(r'^([A-Z][a-z\s]+):', r'<b>\1:</b>', response_text, flags=re.MULTILINE)
        
#         # Ensure citations are in [N] format
#         response_text = re.sub(r'\[(\d+)\]', r'[\1]', response_text)
        
#         # Clean up any malformed tags
#         response_text = re.sub(r'<([^/>]+)>(\s*)</\1>', '', response_text)
        
#         return response_text.strip()
    
#     except Exception as e:
#         logger.error(f"Error in post-processing response: {str(e)}", exc_info=True)
#         return response_text


# class ChatView(APIView):
#     permission_classes = [IsAuthenticated]

#     def __init__(self, post_process_func=post_process_response):
#         self.post_process_func = post_process_func

# class ChatView(APIView):
#     permission_classes = [IsAuthenticated]

#     def __init__(self, post_process_func=post_process_response):
#         self.post_process_func = post_process_func

#     def post(self, request):
#         try:
#             # Extract data with more robust handling
#             message = request.data.get('message')
#             conversation_id = request.data.get('conversation_id')
#             main_project_id = request.data.get('main_project_id')
#             selected_documents = request.data.get('selected_documents', [])

#             if not main_project_id:
#                 return Response({
#                     'error': 'Main project ID is required'
#                 }, status=status.HTTP_400_BAD_REQUEST)
            
#             # Validate message
#             if not message:
#                 return Response(
#                     {'error': 'Message is required'}, 
#                     status=status.HTTP_400_BAD_REQUEST
#                 )

#             user = request.user
            
#             # First, check for active document in session
#             active_document_id = request.session.get('active_document_id')
            
#             if not selected_documents:
#                 active_document_id = request.session.get('active_document_id')
#                 if active_document_id:
#                     selected_documents = [active_document_id]
            
#             # Validate document selection
#             if not selected_documents:
#                 return Response(
#                     {'error': 'Please select at least one document or set an active document'},
#                     status=status.HTTP_400_BAD_REQUEST
#                 )

#             # Retrieve processed documents
#             try:
#                 processed_docs = ProcessedIndex.objects.filter(
#                     document_id__in=selected_documents, 
#                     document__user=user
#                 )
                
#                 if not processed_docs.exists():
#                     return Response(
#                         {'error': 'No valid documents found'},
#                         status=status.HTTP_404_NOT_FOUND
#                     )
#             except Exception as e:
#                 return Response(
#                     {'error': f'Document retrieval error: {str(e)}'},
#                     status=status.HTTP_400_BAD_REQUEST
#                 )

#             # Search across selected documents
#             results = self.search_documents(message, processed_docs)

#             # Generate response based on search results only (no context)
#             response, follow_up_questions = self.generate_response(
#                 message, 
#                 results
#             )

#             # Prepare conversation details
#             conversation_id = conversation_id or str(uuid.uuid4())
#             title = results.get('title') or f"Chat {datetime.now().strftime('%Y-%m-%d %H:%M')}"

#             # Create or retrieve conversation
#             conversation, created = ChatHistory.objects.get_or_create(
#                 user=user,
#                 conversation_id=conversation_id,
#                 main_project_id=main_project_id,
#                 defaults={
#                     'title': title,
#                     'is_active': True,
#                     'follow_up_questions': follow_up_questions
#                 }
#             )

#             # Create user message
#             user_message = ChatMessage.objects.create(
#                 chat_history=conversation,
#                 role='user',
#                 content=message
#             )

#             # Create AI response message
#             ai_message = ChatMessage.objects.create(
#                 chat_history=conversation,
#                 role='assistant',
#                 content=response,
#                 citations=results.get('citations', [])
#             )

#             # Add selected documents to the conversation
#             if selected_documents:
#                 documents = Document.objects.filter(
#                     id__in=selected_documents, 
#                     user=user
#                 )
#                 conversation.documents.set(documents)

#             # Update conversation details
#             conversation.title = title
#             conversation.follow_up_questions = follow_up_questions
#             conversation.save()

#             response_data = {
#                 'response': response,
#                 'follow_up_questions': follow_up_questions,
#                 'conversation_id': str(conversation.conversation_id),
#                 'citations': results.get('citations', []),
#                 'active_document_id': active_document_id
#             }

#             # Print detailed chat response information
#             print("\n--- Chat Interaction Logged ---")
#             print(f"User Question: {message}")
#             print(f"Assistant Response: {response[:500]}...")  # First 500 chars
#             print("Follow-up Questions:")
#             for i, q in enumerate(follow_up_questions, 1):
#                 print(f"{i}. {q}")
#             print("-----------------------------\n")

#             return Response(response_data, status=status.HTTP_200_OK)

#         except Exception as e:
#             logger.error(f"Unexpected error in ChatView: {str(e)}", exc_info=True)
#             return Response(
#                 {'error': f'An unexpected error occurred: {str(e)}'}, 
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR
#             )

#     def generate_prompt(self, query, context):
#         """
#         Simplified prompt generation without conversation history
#         """
#         context_str = "\n".join(context) if context else "No document context available"

#         prompt = f"""
#         RESPONSE GENERATION GUIDELINES:
#         - Provide a clear, concise, and informative answer
#         - Use semantic HTML tags for structure: <b>, <p>, <ul>, <li>
#         - Maintain a natural, conversational tone
#         - Ensure the response is directly derived from the provided context

#         DOCUMENT CONTEXT:
#         {context_str}

#         USER QUERY: {query}

#         RESPONSE FORMAT REQUIREMENTS:
#         1. Begin with a brief introductory paragraph
#         2. Use <b> tags for key section headings
#         3. Use <p> tags for detailed explanations
#         4. Use <ul> and <li> for list-based information
#         5. Ensure the response flows naturally and is easy to read

#         CRITICAL CONSTRAINTS:
#         - Use ONLY information from the provided documents
#         - NO external or speculative information
#         - Maintain clarity and readability
#         """
#         return prompt

#     def generate_response(self, query, search_results):
#         """
#         Generate response using simplified prompt without conversation history
#         """
#         try:
#             # Validate search results
#             context_contents = search_results.get('contents', [])
#             if not context_contents:
#                 logger.warning("No context contents found in search results")
#                 return (
#                     "I apologize, but I couldn't find any relevant information in the documents to answer your question. "
#                     "Could you please rephrase your question or provide more details?",
#                     ["Would you like to try a different search term?",
#                      "Can you provide more specific details about what you're looking for?",
#                      "Would you like to search in different documents?"]
#                 )
            
#             # Limit the total context size
#             MAX_TOTAL_TOKENS = 6000  # Leave room for system message and completion
#             total_context = []
#             current_tokens = 0
            
#             for content in context_contents:
#                 estimated_tokens = len(content) // 4  # Rough estimation
#                 if current_tokens + estimated_tokens > MAX_TOTAL_TOKENS:
#                     break
#                 total_context.append(content)
#                 current_tokens += estimated_tokens
            
#             # Generate prompt with limited context
#             prompt = self.generate_prompt(query, total_context)
            
#             # Generate response using OpenAI
#             response = client.chat.completions.create(
#                 model="gpt-4",
#                 messages=[
#                     {"role": "system", "content": "You are a helpful assistant with expertise in providing detailed, accurate responses. Base your response only on the provided context and be specific about what you find or don't find in the documents."},
#                     {"role": "user", "content": prompt}
#                 ],
#                 max_tokens=1024,
#                 temperature=0.7
#             )

#             usage = response.usage
#             print("Input tokens:", usage.prompt_tokens)
#             print("Output tokens:", usage.completion_tokens)
#             print("Total tokens:", usage.total_tokens)
            
#             # Extract and process response
#             processed_response = self.post_process_func(response.choices[0].message.content)
#             clean_response = re.sub(r'\[(\d+)\]', '', processed_response)
            
#             # Generate follow-up questions
#             follow_up_questions = self.generate_follow_up_questions(context_contents)
            
#             return mark_safe(clean_response.strip()), follow_up_questions
            
#         except Exception as e:
#             logger.error(f"Error in response generation: {str(e)}", exc_info=True)
#             return (
#                 "I apologize, but I'm unable to generate a response at the moment. Please try again.",
#                 ["Would you like to rephrase your question?",
#                  "Can you provide more context?",
#                  "Shall we try again?"]
#             )

#     def search_documents(self, query, processed_docs):
#         """
#         Search documents using OpenAI embeddings and return relevant content with citations
#         """
#         try:
#             # Get query embedding using OpenAI
#             response = client.embeddings.create(
#                 input=query,
#                 model="text-embedding-3-small"
#             )
#             query_embedding = np.array(response.data[0].embedding).astype('float32')
            
#             all_results = []
#             all_citations = []
            
#             for proc_doc in processed_docs:
#                 try:
#                     # Check if required files exist and are not None
#                     if not proc_doc or not proc_doc.faiss_index or not proc_doc.metadata:
#                         logger.warning(f"Missing required files for document processing")
#                         continue
                    
#                     if not os.path.exists(proc_doc.faiss_index) or not os.path.exists(proc_doc.metadata):
#                         logger.warning(f"Index or metadata file not found for document")
#                         continue
                    
#                     # Load FAISS index and metadata
#                     index = faiss.read_index(proc_doc.faiss_index)
#                     with open(proc_doc.metadata, 'rb') as f:
#                         metadata = pickle.load(f)
                    
#                     if len(metadata) == 0:
#                         logger.warning(f"Empty metadata for document")
#                         continue
                    
#                     # Search for similar content using FAISS
#                     D, I = index.search(query_embedding.reshape(1, -1), k=5)
                    
#                     # Process search results with token limit tracking
#                     MAX_TOKENS_PER_DOC = 1000  # Adjust this value based on your needs
#                     current_doc_tokens = 0
                    
#                     for idx in I[0]:
#                         if idx < len(metadata):
#                             content = metadata[idx]['content']
#                             if not content.strip():
#                                 continue
                                
#                             # Estimate tokens (roughly 4 chars per token)
#                             estimated_tokens = len(content) // 4
                            
#                             if current_doc_tokens + estimated_tokens > MAX_TOKENS_PER_DOC:
#                                 logger.info(f"Reached token limit for document {proc_doc.document.filename}")
#                                 break
                                
#                             current_doc_tokens += estimated_tokens
#                             all_results.append(content)
#                             all_citations.append({
#                                 'source_file': proc_doc.document.filename,
#                                 'page_number': metadata[idx].get('page_number', 'Unknown'),
#                                 'section_title': metadata[idx].get('section_title', 'Unknown'),
#                                 'snippet': content[:200] + "..." if len(content) > 200 else content,
#                                 'document_id': str(proc_doc.document.id)
#                             })
                                
#                 except Exception as e:
#                     logger.error(f"Error processing document {proc_doc.document.filename}: {str(e)}")
#                     continue
            
#             if not all_results:
#                 logger.warning("No results found in document search")
                
#             return {
#                 'contents': all_results,
#                 'citations': all_citations,
#                 'conversation_id': str(uuid.uuid4()),
#                 'title': f"Chat {datetime.now().strftime('%Y-%m-%d %H:%M')}"
#             }
            
#         except Exception as e:
#             logger.error(f"Error in document search: {str(e)}")
#             raise

#     def generate_follow_up_questions(self, context):
#         prompt = f"""
#         Based on this context, suggest 3 relevant follow-up questions, the length of the questions should be short:
#         {''.join(context[:3])}
#         """
        
#         try:
#             response = GENERATIVE_MODEL.generate_content(prompt)
#             questions = response.text.split('\n')
#             return questions[:3]
#         except Exception as e:
#             return [
#                 "What additional information would you like to know?",
#                 "Would you like me to elaborate on any specific point?",
#                 "How can I help clarify this information further?"
#             ]
        
# class GetConversationView(APIView):
#     permission_classes = [IsAuthenticated]
    
#     def get(self, request, conversation_id=None):
#         try:
#             user = request.user
            
#             if conversation_id:
#                 # Fetch specific conversation
#                 try:
#                     conversation = ChatHistory.objects.get(
#                         conversation_id=conversation_id, 
#                         user=user
#                     )
                    
#                     # Retrieve all messages for this conversation
#                     messages = conversation.messages.all().order_by('created_at')
                    
#                     # Prepare message list
#                     message_list = [
#                         {
#                             'role': message.role,
#                             'content': message.content,
#                             'created_at': message.created_at.strftime('%Y-%m-%d %H:%M'),
#                             'citations': message.citations or []
#                         } for message in messages
#                     ]
                    
#                     return Response({
#                         'conversation_id': str(conversation.conversation_id),
#                         'title': conversation.title or f"Chat from {conversation.created_at.strftime('%Y-%m-%d %H:%M')}",
#                         'created_at': conversation.created_at.strftime('%Y-%m-%d %H:%M'),
#                         'messages': message_list,
#                         'follow_up_questions': conversation.follow_up_questions or [],
#                         'selected_documents': [
#                             str(doc.id) for doc in conversation.documents.all()
#                         ]
#                     }, status=status.HTTP_200_OK)
                
#                 except ChatHistory.DoesNotExist:
#                     return Response(
#                         {'error': 'Conversation not found'}, 
#                         status=status.HTTP_404_NOT_FOUND
#                     )
            
#             else:
#                 # Fetch all conversations for the user
#                 conversations = ChatHistory.objects.filter(user=user) \
#                     .filter(is_active=True) \
#                     .order_by('-created_at')
                
#                 conversation_list = []
#                 for conversation in conversations:
#                     # Get the first and last messages
#                     messages = conversation.messages.all().order_by('created_at')
                    
#                     if messages:
#                         first_message = messages.first()
#                         last_message = messages.last()
                        
#                         conversation_list.append({
#                             'conversation_id': str(conversation.conversation_id),
#                             'title': conversation.title or f"Chat from {conversation.created_at.strftime('%Y-%m-%d %H:%M')}",
#                             'created_at': conversation.created_at.strftime('%Y-%m-%d %H:%M'),
#                             'first_message': first_message.content,
#                             'last_message': last_message.content,
#                             'message_count': messages.count(),
#                             'follow_up_questions': conversation.follow_up_questions or []
#                         })
                
#                 return Response(conversation_list, status=status.HTTP_200_OK)
        
#         except Exception as e:
#             return Response(
#                 {'error': f'Failed to fetch conversations: {str(e)}'}, 
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR
#             )


# # Optional: Add a view to delete a conversation
# class DeleteConversationView(APIView):
#     permission_classes = [IsAuthenticated]
    
#     def delete(self, request, conversation_id):
#         try:
#             conversation = ChatHistory.objects.get(
#                 conversation_id=conversation_id, 
#                 user=request.user
#             )
            
#             conversation.delete()
#             return Response(
#                 {'message': 'Conversation deleted successfully'}, 
#                 status=status.HTTP_200_OK
#             )
        
#         except ChatHistory.DoesNotExist:
#             return Response(
#                 {'error': 'Conversation not found'}, 
#                 status=status.HTTP_404_NOT_FOUND
#             )
#         except Exception as e:
#             return Response(
#                 {'error': f'Failed to delete conversation: {str(e)}'}, 
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR
#             )


# ???????????????????????????????????????????????????????????

#Simplified Code

#views.py original
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login
from django.contrib.auth.hashers import check_password
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated, AllowAny  # Combined imports
# from rest_framework_simplejwt.tokens import RefreshToken  # Added only once
import faiss
import numpy as np
import os
import pickle
import tempfile
import re
from datetime import datetime
from django.core.files.storage import default_storage
from django.conf import settings
# from nltk.tokenize import word_tokenize
# from nltk.corpus import stopwords
# from nltk.util import ngrams
from collections import Counter
import google.generativeai as genai  # Merged single instance
# from sklearn.feature_extraction.text import TfidfVectorizer
# from sklearn.decomposition import LatentDirichletAllocation
# from llama_parse import LlamaParse
from .models import (
    ChatHistory,
    ChatMessage,
    Document,
    ProcessedIndex,
    ConversationMemoryBuffer
)
import uuid
from rest_framework.authtoken.models import Token
from django.utils.safestring import mark_safe
import logging
from .models import UserProfile
logger = logging.getLogger(__name__)
from core.models import Project
import openai
from openai import OpenAI
from dotenv import load_dotenv
import os
import tiktoken


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

        # Validate input
        if not current_password or not new_password:
            return Response({
                'message': 'Both current and new password are required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check if current password is correct
        if not check_password(current_password, user.password):
            return Response({
                'message': 'Current password is incorrect'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Set new password
        user.set_password(new_password)
        user.save()

        return Response({
            'message': 'Password updated successfully'
        }, status=status.HTTP_200_OK)

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
        
        return Response({
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'profile_picture': profile_picture,
            'date_joined': user.date_joined,
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
        #     processed_data = None  # Initialize processed_data outside the loop

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
                        processed_data = self.process_document(file)
                        
                        # Create ProcessedIndex
                        ProcessedIndex.objects.create(
                            document=existing_doc,
                            faiss_index=processed_data['index_path'],
                            metadata=processed_data['metadata_path'],
                            summary=""
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
                    processed_data = self.process_document(file)
                    
                    # Create ProcessedIndex
                    ProcessedIndex.objects.create(
                        document=document,
                        faiss_index=processed_data['index_path'],
                        metadata=processed_data['metadata_path'],
                        summary=""
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
    # Hierarchical summarization from Streamlit
    # -------------------------------
    def hierarchical_summary(self, chunks, group_size=10):
        """
        Generates a consolidated summary by grouping the chunk texts, summarizing each group,
        and then summarizing the aggregated group summaries.
        """
        import tiktoken
        encoding = tiktoken.get_encoding("cl100k_base")
        
        group_summaries = []
        # Group chunks to avoid exceeding token limits for very long aggregated text.
        for i in range(0, len(chunks), group_size):
            group_text = "\n\n".join(chunk['text'] for chunk in chunks[i:i+group_size])
            
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
                        {"role": "user", "content": f"Summarize the following text comprehensively and cover all key details:\n\n{group_text}"}
                    ],
                    temperature=0.3,
                    max_tokens=500
                )
                group_summary = completion.choices[0].message.content
                group_summaries.append(group_summary)
            except Exception as e:
                print(f"Error generating group summary: {str(e)}")
                # Add a placeholder if summarization fails
                group_summaries.append(f"Summary generation error for chunk group {i//group_size}.")
        
        # Combine all group summaries
        aggregated_summary = "\n\n".join(group_summaries)
        
        # Generate final summary from the aggregated summaries
        try:
            final_completion = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "developer", "content": "You are a document summarization expert."},
                    {"role": "user", "content": f"Combine these partial summaries into a cohesive, comprehensive summary:\n\n{aggregated_summary}"}
                ],
                temperature=0.3,
                max_tokens=1000
            )
            final_summary = final_completion.choices[0].message.content
        except Exception as e:
            print(f"Error generating final summary: {str(e)}")
            final_summary = aggregated_summary  # Use aggregated summaries if final summarization fails
        
        return final_summary

    # -------------------------------
    # Process documents function that integrates with Django database
    # -------------------------------
    def process_document(self, file):
        """
        Process documents: extraction, chunking, embeddings, FAISS creation
        While maintaining compatibility with the Django database structure.
        Keeps original complexity checking functionality but uses streamlit functions for processing.
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
                # # Check document complexity (keep this from original code)
                # is_complex = self.detect_document_complexity(file_path)

                # # Process document based on complexity
                # if is_complex:
                #     extracted_text = self.extract_text_from_file(file_path)
                # else:
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
                
                
                # # Generate summary for all document types using the hierarchical approach
                # summary = self.hierarchical_summary(all_chunks)
                # follow_up_questions = []
                
                return {
                    'index_path': index_file,
                    'metadata_path': pickle_file,
                    # 'summary': summary,
                    # 'follow_up_questions': follow_up_questions,
                    'full_text': doc['text']
                }
                
            finally:
                # Clean up temporary file
                if os.path.exists(file_path):
                    os.unlink(file_path)
                    
        except Exception as e:
            print(f"Error in process_document: {str(e)}")
            raise
            
    # This is a backwards compatibility function to maintain the save_index_and_metadata
    # signature from the original code, but use the new Streamlit-based implementation
    def save_index_and_metadata(self, index, metadata, filename):
        """
        Adapts between the original function signature and the new save_faiss_index function
        """
        import uuid
        session_id = uuid.uuid4().hex
        index_file, pickle_file = self.save_faiss_index(index, metadata, session_id)
        return index_file, pickle_file

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
            
            # First, check for active document in session
            active_document_id = request.session.get('active_document_id')
            
            if not selected_documents:
                active_document_id = request.session.get('active_document_id')
                if active_document_id:
                    selected_documents = [active_document_id]
            
            # Validate document selection
            if not selected_documents:
                return Response(
                    {'error': 'Please select at least one document or set an active document'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Retrieve processed documents
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

            # Process all documents and get answer based on Streamlit approach
            combined_text = ""
            all_chunks = []
            
            # Load FAISS indices and chunks for all selected documents
            for proc_doc in processed_docs:
                if not proc_doc.faiss_index or not proc_doc.metadata:
                    continue
                
                if not os.path.exists(proc_doc.faiss_index) or not os.path.exists(proc_doc.metadata):
                    continue
                
                # Load FAISS index
                try:
                    index = faiss.read_index(proc_doc.faiss_index)
                    with open(proc_doc.metadata, 'rb') as f:
                        chunks = pickle.load(f)
                    
                    # Get relevant chunks using search_faiss_index
                    relevant_chunks = self.search_faiss_index(index, chunks, message)
                    
                    # Add document name to each chunk
                    for chunk in relevant_chunks:
                        chunk['source'] = proc_doc.document.filename
                    
                    # Add to all chunks
                    all_chunks.extend(relevant_chunks)
                    
                    # Update combined text
                    doc_text = f"\n\n--- Document: {proc_doc.document.filename} ---\n\n"
                    if hasattr(proc_doc.document, 'full_text') and proc_doc.document.full_text:
                        doc_text += proc_doc.document.full_text
                    combined_text += doc_text
                    
                except Exception as e:
                    logger.error(f"Error processing document {proc_doc.document.filename}: {str(e)}")
                    continue
            
            # Get answer using the Streamlit approach
            answer = self.get_answer(message, index, all_chunks, combined_text)
            
            # Extract main response and citation info
            parts = answer.split("\n\n*Sources:")
            clean_response = parts[0]
            source_info = parts[1].split('*\n')[0] if len(parts) > 1 else ""
            
            # Generate follow-up questions
            context_texts = [chunk.get('text', '') for chunk in all_chunks[:3]]
            follow_up_questions = self.generate_follow_up_questions(context_texts)
            
            # Create citations from chunks
            citations = []
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
                    'follow_up_questions': follow_up_questions
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

            # Add selected documents to the conversation
            if selected_documents:
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
                'active_document_id': active_document_id,
                'sources_info': source_info
            }

            # Print detailed chat response information
            print("\n--- Chat Interaction Logged ---")
            print(f"User Question: {message}")
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

    # -------------------------------
    # Get embeddings function from Streamlit code
    # -------------------------------
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

    # -------------------------------
    # FAISS search function from Streamlit code
    # -------------------------------Django ChatView Fix

    # In search_faiss_index method of ChatView, increase k from 5 to 8
    def search_faiss_index(self, index, chunks, query, k=8):  # Changed from k=5 to k=8
        """
        Search the FAISS index for relevant chunks based on query
        """
        query_embedding = self.get_embeddings([query])
        if not query_embedding:
            logger.error("Failed to generate query embedding")
            return []
        
        query_embedding_np = np.array([query_embedding[0]]).astype('float32')
        distances, indices = index.search(query_embedding_np, k)
        
        results = [chunks[idx] for idx in indices[0] if idx < len(chunks)]
        return results

    # -------------------------------
    # Get answer function directly from Streamlit code
    # -------------------------------
    def get_answer(self, question, index, chunks, all_text):
        try:
            relevant_chunks = chunks  # We already filtered chunks in the post method
            context = "\n\n".join([chunk.get('text', '') for chunk in relevant_chunks])
            sources = set(chunk.get('source', '') for chunk in relevant_chunks)
            source_info = "Sources: " + ", ".join(sources)
            
            # Updated prompt construction to match Streamlit's approach
            user_prompt = f"""
            RESPONSE GENERATION GUIDELINES:
            - Provide a clear and informative answer
            - Use semantic HTML tags for structure: <b>, <p>, <ul>, <li>
            - Maintain a natural, conversational tone
            - Ensure the response is directly derived from the provided context

            DOCUMENT CONTEXT:
            {context}

            USER QUERY: {question}

            RESPONSE FORMAT REQUIREMENTS:
            1. Begin with a brief introductory paragraph
            2. Use <b> tags for key section headings
            3. Use <p> tags for detailed explanations
            4. Use <ul> and <li> for list-based information
            5. Ensure the response flows naturally and is easy to read

            CRITICAL CONSTRAINTS:
            - Use ONLY information from the provided documents
            - NO external or speculative information
            - Maintain clarity and readability
            """
            
            completion = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "developer", "content": "You are a document analysis expert. Provide a comprehensive answer using all available document context."},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.2,
                max_tokens=2000
            )
            
            answer_text = completion.choices[0].message.content
            usage = completion.usage
            token_info = f"(Tokens used: prompt {usage.prompt_tokens}, completion {usage.completion_tokens}, total {usage.prompt_tokens + usage.completion_tokens})"
            
            # Skip post-processing to maintain raw answer quality
            # processed_answer = self.post_process_func(answer_text)
            
            return f"{answer_text}\n\n*Sources: {source_info}*\n{token_info}"
                
        except Exception as e:
            logger.error(f"Error getting answer: {str(e)}")
            return "Sorry, an error occurred while processing your question."

    # -------------------------------
    # Generate follow-up questions (keeping your original implementation)
    # -------------------------------
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