# #views.py original
# from django.contrib.auth.models import User
# from django.contrib.auth import authenticate, login
# from django.contrib.auth.hashers import check_password
# from rest_framework import status
# from rest_framework.response import Response
# from rest_framework.views import APIView
# from rest_framework.parsers import MultiPartParser, FormParser
# from rest_framework.permissions import IsAuthenticated, AllowAny  # Combined imports
# from rest_framework_simplejwt.tokens import RefreshToken  # Added only once
# import faiss
# import numpy as np
# import os
# import pickle
# import tempfile
# import re
# from datetime import datetime
# from django.core.files.storage import default_storage
# from django.conf import settings
# from nltk.tokenize import word_tokenize
# from nltk.corpus import stopwords
# from nltk.util import ngrams
# from collections import Counter
# import google.generativeai as genai  # Merged single instance
# from sklearn.feature_extraction.text import TfidfVectorizer
# from sklearn.decomposition import LatentDirichletAllocation
# from llama_parse import LlamaParse
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
# from openai import OpenAI
# from dotenv import load_dotenv
# import os


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
#                         'summary': 'Summary processing pending',
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
#             main_project_id = request.data.get('main_project_id')

#             if not new_title or not new_title.strip():
#                 return Response(
#                     {'error': 'Title cannot be empty'},
#                     status=status.HTTP_400_BAD_REQUEST
#                 )

#             # Find the conversation
#             try:
#                 conversation = ChatHistory.objects.get(
#                     conversation_id=conversation_id, 
#                     user=request.user,
#                     main_project_id=main_project_id
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

#     def process_with_llama(self, file_path):
#         """Process PDF using LlamaParse for complex documents."""
#         print("&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&")
#         try:
#             parser = LlamaParse(
#                 api_key="llx-ELriu1Ss7pRseKhI1GgCtaSbdyfyVz7UAFpGovz1ntPKVHcC",
#                 result_type="markdown",
#                 verbose=True,
#                 images=True,
#                 premium_mode=True
#             )
#             parsed_documents = parser.load_data(file_path)
#             full_text = '\n'.join([doc.text for doc in parsed_documents])
#             return parsed_documents, full_text
#         except Exception as e:
#             print(f"Error in LlamaParse processing: {e}")
#             return [], ""

#     def process_document(self, file):
#         try:
#             with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
#                 for chunk in file.chunks():
#                     tmp_file.write(chunk)
#                 pdf_path = tmp_file.name
                
#             try:
#                 # Initialize OpenAI client and FAISS index
                
#                 # OpenAI text-embedding-3-small produces 1536-dimensional embeddings
#                 faiss_index = faiss.IndexFlatL2(1536)
                
#                 # Check document complexity
#                 is_complex = self.detect_document_complexity(pdf_path)
                
#                 # Process document based on complexity
#                 if is_complex:
#                     parsed_documents, full_text = self.process_with_llama(pdf_path)
#                 else:
#                     parsed_documents, full_text = self.process_with_local_parser(pdf_path)
                
#                 if not parsed_documents:
#                     raise ValueError("No content could be extracted from the document")
                
#                 # Extract key terms and generate summary
#                 key_terms = self.extract_key_terms(full_text)
#                 summary, follow_up_questions = self.generate_summary(full_text, file.name)
                
#                 # Create metadata store
#                 metadata_store = []
#                 texts_to_embed = []
                
#                 for doc in parsed_documents:
#                     content = doc['content'] if isinstance(doc, dict) else doc.text
#                     metadata = {
#                         "content": content,
#                         "source_file": file.name,
#                         "page_number": doc.get('metadata', {}).get('page', 'Unknown') if isinstance(doc, dict) else 'Unknown',
#                         "section_title": 'Unknown'
#                     }
#                     metadata_store.append(metadata)
#                     texts_to_embed.append(content)
                
#                 # Create embeddings using OpenAI
#                 embeddings_list = []
#                 for text in texts_to_embed:
#                     response = client.embeddings.create(
#                         input=text,
#                         model="text-embedding-3-small"
#                     )
#                     embeddings_list.append(response.data[0].embedding)
                
#                 # Convert embeddings to numpy array and add to FAISS index
#                 embeddings_array = np.array(embeddings_list).astype('float32')
#                 faiss_index.add(embeddings_array)
                
#                 # Save FAISS index and metadata
#                 index_path, metadata_path = self.save_index_and_metadata(faiss_index, metadata_store, file.name)
                
#                 return {
#                     'index_path': index_path,
#                     'metadata_path': metadata_path,
#                     'summary': summary,
#                     'follow_up_questions': follow_up_questions,
#                     'key_terms': key_terms,
#                     'full_text': full_text
#                 }
                
#             finally:
#                 # Clean up the temporary file
#                 if os.path.exists(pdf_path):
#                     os.unlink(pdf_path)
                    
#         except Exception as e:
#             print(f"Error in process_document: {str(e)}")
#             raise

#     def extract_key_terms(self, content, num_topics=5):
#         """Extract key terms using N-grams, TF-IDF, and topic modeling"""
#         # Tokenize and clean the content
#         stop_words = set(stopwords.words('english'))
#         words = re.findall(r'\b\w+\b', content.lower())
#         words = [word for word in words if word not in stop_words and len(word) > 2]

#         # Generate N-grams
#         n_grams = list(ngrams(words, 2)) + list(ngrams(words, 3))
#         n_gram_counts = Counter([" ".join(gram) for gram in n_grams]).most_common(10)

#         # TF-IDF Vectorization
#         vectorizer = TfidfVectorizer(stop_words='english', max_features=50)
#         tfidf_matrix = vectorizer.fit_transform([content])
#         tfidf_scores = dict(zip(vectorizer.get_feature_names_out(), tfidf_matrix.toarray().flatten()))

#         # Topic Modeling
#         lda = LatentDirichletAllocation(n_components=num_topics, random_state=0)
#         lda.fit(tfidf_matrix)
        
#         topic_terms = {}
#         for idx, topic in enumerate(lda.components_):
#             terms = [vectorizer.get_feature_names_out()[i] for i in topic.argsort()[:-6:-1]]
#             topic_terms[f"Topic {idx+1}"] = terms

#         # Aggregate key terms
#         key_terms = dict(n_gram_counts)
#         key_terms.update(tfidf_scores)
#         for topic, terms in topic_terms.items():
#             for term in terms:
#                 key_terms[term] = key_terms.get(term, 0) + 1

#         return key_terms

#     def save_markdown(self, md_text, pdf_name, key_terms, markdown_dir):
#         """Save markdown content with key terms"""
#         base_name = os.path.splitext(pdf_name)[0]
#         safe_name = re.sub(r'[^\w\-_.]', '_', base_name)
#         md_path = os.path.join(markdown_dir, f"{safe_name}.md")

#         with open(md_path, "w", encoding='utf-8') as f:
#             f.write(md_text)
#             f.write("\n\n# Key Terms and Frequencies\n")
#             for term, freq in key_terms.items():
#                 f.write(f"- {term}: {freq}\n")

#         return md_path

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

    
#     def generate_summary(self, content, file_name):
#         max_chars = 30000
#         truncated_content = content[:max_chars] if len(content) > max_chars else content
    
#         prompt = f"""
#         Please analyze this document '{file_name}' and provide:
#         1. A concise summary of the main points and key findings
        
    
#         Content: {truncated_content}
    
#         ### Instructions:
#         - Use semantic HTML-like tags for structure
#         - Provide a clear, organized summary
#         - Highlight key insights with <b> tags
#         - Use <p> tags for paragraphs
#         - Use <ul> and <li> for list-based information

#         ### Expected Response Format:
#         <b>Summary Overview</b>
#         <p>High-level introduction to the document's main theme</p>

#         <b>Key Highlights</b>
#         <ul>
#             <li>First major insight</li>
#             <li>Second major insight</li>
#             <li>Third major insight</li>
#         </ul>

#         <b>Detailed Insights</b>
#         <p>Expanded explanation of the document's core content and significance</p>

        
#         """
    
#         try:
#             response = GENERATIVE_MODEL.generate_content(prompt)
#             response_text = response.text
            
#             # Ensure proper HTML-like formatting
#             # Wrap paragraphs in <p> tags if not already wrapped
#             response_text = re.sub(r'^(?!<[p|b|u|ul|li])(.*?)$', r'<p>\1</p>', response_text, flags=re.MULTILINE)
            
#             # Ensure bold tags for section headers
#             section_headers = ['Summary Overview', 'Key Highlights', 'Detailed Insights']
#             for header in section_headers:
#                 response_text = response_text.replace(header, f'<b>{header}</b>')
            
#             # Extract follow-up questions
#             parts = response_text.split('Follow-up Questions:')
#             summary = parts[0].strip()
            
#             # Extract or generate follow-up questions
#             try:
#                 questions = [q.strip().lstrip('123. ') for q in parts[1].strip().split('\n') if q.strip()] if len(parts) > 1 else []
#             except:
#                 questions = []
            
#             # # Ensure 3 follow-up questions
#             # while len(questions) < 3:
#             #     questions.append("What other aspects of this document would you like to explore?")
            
#             return summary, questions[:3]
        
#         except Exception as e:
#             print(f"Error generating summary: {str(e)}")
#             return (
#                 f"""
#                 <b>Summary Generation Error</b>
#                 <p>Unable to generate a comprehensive summary for {file_name}</p>
                
#                 <b>Possible Reasons</b>
#                 <ul>
#                     <li>Document may be too complex</li>
#                     <li>Parsing issues encountered</li>
#                     <li>Insufficient context extracted</li>
#                 </ul>
#                 """,
#                 [
#                     "What would you like to know about this document?",
#                     "Would you like me to explain any specific part?",
#                     "Shall we discuss the document in more detail?"
#                 ]
#             )
        
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

#             # Retrieve previous conversation context
#             previous_messages = self.get_conversation_context(conversation_id)

#             # Prepare conversation context
#             previous_context = self.prepare_conversation_context(previous_messages)

#             # Search across selected documents
#             results = self.search_documents(message, processed_docs)

#             # Generate response based on search results and context
#             response, follow_up_questions = self.generate_response_with_enhanced_context(
#                 message, 
#                 results, 
#                 previous_context
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

#             # Update memory buffer with conversation context
#             memory_buffer, created = ConversationMemoryBuffer.objects.get_or_create(
#                 conversation=conversation
#             )
#             memory_buffer.update_memory(conversation.messages.all())

#             response_data = {
#             'response': response,
#             'follow_up_questions': follow_up_questions,
#             'conversation_id': str(conversation.conversation_id),
#             'citations': results.get('citations', []),
#             'active_document_id': active_document_id
#         }

#         # Print detailed chat response information
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

#     def get_conversation_context(self, conversation_id, max_context_length=5):
#         """
#         Retrieve previous messages for context
#         Limit to last 5 messages to prevent context overflow
#         """
#         try:
#             conversation = ChatHistory.objects.get(conversation_id=conversation_id)
#             messages = conversation.messages.order_by('-created_at')[:max_context_length]
            
#             # Reverse to maintain chronological order
#             return list(reversed(messages))
#         except ChatHistory.DoesNotExist:
#             return []
#     def prepare_conversation_context(self, previous_messages):
#         """
#         Prepare a structured conversation context
#         """
#         context = []
#         for msg in previous_messages:
#             role = "Human" if msg.role == 'user' else "AI"
#             context.append(f"{role}: {msg.content}")
#         return "\n".join(context) if context else "No previous context"

#     def generate_enhanced_prompt(self, context, query, previous_context=None):
#         """
#         Advanced Prompt Engineering for Context-Aware Response Generation
#         with Consistent Formatting
#         """
#         context_str = "\n".join(context) if context else "No document context available"
 
#         prompt = f"""
#         RESPONSE GENERATION GUIDELINES:
#         1. STRUCTURE AND SPACING:
#         - Use single line breaks between sections
#         - No double spacing or excess line breaks
#         - Keep formatting consistent and clean
 
#         2. HTML FORMATTING RULES:
#         - Paragraphs: <p>Your text here</p>
#         - Headers/Important text: <b>Your header here</b>
#         - Bullet lists:
#             <ul>
#             <li>First item</li>
#             <li>Second item</li>
#             </ul>
#         - Numbered lists:
#             <ol>
#             <li>First item</li>
#             <li>Second item</li>
#             </ol>
 
#         3. LIST FORMATTING:
#         - Always use proper <ul> or <ol> tags for lists
#         - Each list item must be wrapped in <li> tags
#         - Lists should be properly indented in the HTML
#         - Use unordered lists (<ul>) for bullet points
#         - Use ordered lists (<ol>) for sequential steps
 
#         4. SPACING RULES:
#         - One line break after headers
#         - One line break between paragraphs
#         - No multiple line breaks
#         - No excess spacing between sections
#         5. SECTIONING:
#             - Use <b> tags for section headings
#             - Add empty lines before and after sections
#             - Ensure clear visual hierarchy
#         6. OVERALL STRUCTURE:
#             - Start with a clear introduction
#             - Group related information together
#             - End with a conclusion or summary if appropriate
#             - Use consistent spacing throughout
#         7. LIST TYPE SELECTION:
#             Use <ol> (ordered lists) for:
#             - Step-by-step instructions or procedures
#             - Sequential processes or timelines
#             - Priority-ranked items
#             - Methodological explanations
#             - Chronological events
#             - Hierarchical information
           
#             Use <ul> (unordered lists) for:
#             - Related but non-sequential items
#             - Feature lists
#             - Examples or options
#             - General points
#             - Parallel ideas
#         8. CONTENT ORGANIZATION:
#             - Analyze if the information has a natural sequence or order
#             - Use <ol> when explaining 'how to' or 'step by step' processes
#             - Use <ul> for listing features, characteristics, or parallel ideas
#             - Mix both types when appropriate (e.g., steps followed by examples)
 
#         PREVIOUS CONVERSATION CONTEXT:
#         {previous_context or "No previous conversation context"}

#         DOCUMENT CONTEXT:
#         {context_str}
 
#         USER QUERY:
#         {query}
 
#         CRITICAL REQUIREMENTS:
#         - Use proper HTML list tags (<ul>, <ol>, <li>)
#         - Maintain single line spacing
#         - Remove any excess blank lines
#         - Keep formatting consistent throughout
#         - Use only information from provided documents
#         - Maintain clear visual separation between different sections
#         - Use HTML tags consistently for structure
#             - Focus on readability and clear information hierarchy
#             - Use ONLY information from the provided documents
#             - NO external or speculative information
#         """
#         return prompt

#     def generate_response_with_enhanced_context(self, query, search_results, previous_context=None):
#         """
#         Generate response using advanced context-aware prompt engineering with OpenAI API
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
            
#             # Generate enhanced prompt
#             enhanced_prompt = self.generate_enhanced_prompt(
#                 context=context_contents,
#                 query=query,
#                 previous_context=previous_context
#             )

            
#             # Generate response using OpenAI
#             response = client.chat.completions.create(
#                 model="gpt-4",
#                 messages=[
#                     {"role": "system", "content": """You are a helpful assistant with expertise in providing detailed, accurate responses.
#                                                    Base your response only on the provided context and be specific about what you find or don't find in the documents."""},
#                     {"role": "user", "content": enhanced_prompt}
#                 ],
#                 max_tokens=1024,
#                 temperature=0.7
#             )

#             usage = response.usage

#             print("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$Input tokens:", usage.prompt_tokens)
#             print("Output tokens:", usage.completion_tokens)
#             print("Total tokens:", usage.total_tokens)
            
#             # Extract and process response
#             processed_response = self.post_process_func(response.choices[0].message.content)
#             clean_response = re.sub(r'\[(\d+)\]', '', processed_response)
            
#             # Generate relevant follow-up questions based on the context
#             follow_up_questions = self.generate_follow_up_questions(context_contents)
            
#             return mark_safe(clean_response.strip()), follow_up_questions
            
#         except Exception as e:
#             logger.error(f"Error in enhanced response generation: {str(e)}", exc_info=True)
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
                    
#                     # Process search results
#                     for idx in I[0]:
#                         if idx < len(metadata):
#                             content = metadata[idx]['content']
#                             if content.strip():  # Only add non-empty content
#                                 all_results.append(content)
#                                 all_citations.append({
#                                     'source_file': proc_doc.document.filename,
#                                     'page_number': metadata[idx].get('page_number', 'Unknown'),
#                                     'section_title': metadata[idx].get('section_title', 'Unknown'),
#                                     'snippet': content[:200] + "..." if len(content) > 200 else content,
#                                     'document_id': str(proc_doc.document.id)
#                                 })
                                
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
#         def is_valid_question(q):
#             """Check if a string is a valid question."""
#             # Remove common prefixes that aren't part of the actual question
#             q = re.sub(r'^(Here are|Following are|These are|Here\'s)\b.*?:', '', q, flags=re.IGNORECASE)
#             q = re.sub(r'^\d+\.\s*', '', q)
#             q = re.sub(r'^(Question|Q):\s*', '', q)
#             q = q.strip()
           
#             # Check if it's a proper question
#             return (
#                 q and  # not empty
#                 q.endswith('?') and  # ends with question mark
#                 len(q) > 10 and  # reasonable length
#                 not q.startswith("Here are") and  # not a header
#                 not q.startswith("Following are") and
#                 not any(q.startswith(prefix) for prefix in ["1.", "2.", "3."]) and  # no numbered prefixes
#                 "?" in q  # contains at least one question mark
#             )
 
#         def generate_questions():
#             """Generate and validate questions."""
#             prompt = f"""
#             Generate exactly 3 distinct follow-up questions based on this context.
           
#             Requirements:
#             - Each must be a complete, standalone question
#             - Do not include any numbering or prefixes
#             - Questions must end with a question mark
#             - Keep questions concise and direct
#             - Do not include phrases like "Here are three questions" or similar headers
           
#             Context:
#             {''.join(context[:3])}
#             """
           
#             try:
#                 response = GENERATIVE_MODEL.generate_content(prompt)
#                 # Split and clean the response
#                 questions = [q.strip() for q in response.text.split('\n') if q.strip()]
               
#                 # Clean and validate each question
#                 valid_questions = []
#                 for q in questions:
#                     cleaned = re.sub(r'^\d+\.\s*', '', q)  # Remove numbered prefixes
#                     cleaned = re.sub(r'^(Question|Q):\s*', '', cleaned)  # Remove question prefixes
#                     cleaned = cleaned.strip()
#                     if is_valid_question(cleaned):
#                         valid_questions.append(cleaned)
               
#                 return valid_questions
#             except Exception as e:
#                 logger.error(f"Error in question generation: {str(e)}")
#                 return []
 
#         # Try to generate valid questions up to 3 times
#         max_attempts = 2
#         for attempt in range(max_attempts):
#             questions = generate_questions()
           
#             # If we have exactly 3 valid questions, return them
#             if len(questions) == 3:
#                 return questions
           
#             logger.warning(f"Attempt {attempt + 1}: Generated {len(questions)} valid questions, retrying...")
       
#         # If we still don't have 3 valid questions after all attempts,
#         # fill in with default questions
#         default_questions = [
#             "What specific aspects of this topic would you like to explore further?",
#             "Could you clarify which parts of this information are most relevant to your needs?",
#             "How can I provide more detailed information about this subject?"
#         ]
       
#         # Combine any valid generated questions with default questions
#         final_questions = questions[:3]  # Take any valid questions we did get
#         while len(final_questions) < 3:
#             final_questions.append(default_questions[len(final_questions)])
       
#         return final_questions
        
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


###############################################################################

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
                    
                    # Print the document data
                    print(f"Document Response - ID: {doc.id}")
                    print(f"Filename: {document_data['filename']}")
                    print(f"Summary: {document_data['summary'][:200]}...")  # First 200 chars
                    print(f"Follow-up Questions: {document_data['follow_up_questions']}")
                    print("---")
                
                except ProcessedIndex.DoesNotExist:
                    document_data = {
                        'id': doc.id,
                        'filename': doc.filename,
                        'uploaded_at': doc.uploaded_at.strftime('%Y-%m-%d %H:%M'),
                        'summary': 'Document processing pending',
                        'follow_up_questions': []
                    }
                    document_list.append(document_data)
            
            # Print full document list
            print("Full Document List Response:")
            print(document_list)
            
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

class DocumentUploadView(APIView):
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
                            'summary': processed_index.summary,
                        })
                        last_processed_doc_id = existing_doc.id
                        processed_data = {
                            'summary': processed_index.summary,
                            'follow_up_questions': []  # Add default value if needed
                        }
                    except ProcessedIndex.DoesNotExist:
                        # Process the document if no existing index
                        processed_data = self.process_document(file)
                        
                        # Create ProcessedIndex
                        ProcessedIndex.objects.create(
                            document=existing_doc,
                            faiss_index=processed_data['index_path'],
                            metadata=processed_data['metadata_path'],
                            summary=processed_data['summary']
                        )

                        uploaded_docs.append({
                            'id': existing_doc.id,
                            'filename': existing_doc.filename,
                            'summary': processed_data['summary']
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
                        summary=processed_data['summary']
                    )

                    uploaded_docs.append({
                        'id': document.id,
                        'filename': document.filename,
                        'summary': processed_data['summary']
                    })
                    last_processed_doc_id = document.id

                    print(f"Uploaded Document - ID: {document.id}")
                    print(f"Filename: {document.filename}")
                    print(f"Summary: {processed_data['summary'][:200]}...")
                    print(f"Follow-up Questions: {processed_data.get('follow_up_questions', [])}")
                    print("---")

            # Store the last processed document ID in the session
            request.session['active_document_id'] = last_processed_doc_id

            # Ensure we have processed_data before using it
            if processed_data is None:
                return Response({
                    'error': 'No documents were successfully processed'
                }, status=status.HTTP_400_BAD_REQUEST)

            return Response({
                'message': 'Documents processed successfully',
                'documents': [{
                    'id': last_processed_doc_id,
                    'filename': file.name,
                    'summary': processed_data['summary'],
                    'follow_up_questions': processed_data.get('follow_up_questions', []),
                }],
                'active_document_id': last_processed_doc_id
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            print(f"Error processing document: {str(e)}")  # Add this for debugging
            return Response({
                'error': str(e),
                'detail': 'An error occurred while processing the document'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
    def process_with_local_parser(self, file_path):
        """Process PDF using local PyMuPDF for text extraction."""
        print("#####################################################")
        import fitz
        try:
            doc = fitz.open(file_path)
            full_text = ""
            parsed_documents = []
            
            for page_num, page in enumerate(doc):
                text = page.get_text()
                full_text += text + "\n"
                # Store as a dictionary instead of Document object
                parsed_documents.append({
                    "content": text,
                    "metadata": {
                        "page": page_num + 1,
                        "source": file_path
                    }
                })
            
            return parsed_documents, full_text
        except Exception as e:
            print(f"Error in local PDF processing: {e}")
            return [], ""

    # def process_with_llama(self, file_path):
    #     """Process PDF using LlamaParse for complex documents."""
    #     print("&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&")
    #     try:
    #         parser = LlamaParse(
    #             api_key="llx-ELriu1Ss7pRseKhI1GgCtaSbdyfyVz7UAFpGovz1ntPKVHcC",
    #             result_type="markdown",
    #             verbose=True,
    #             images=True,
    #             premium_mode=True
    #         )
    #         parsed_documents = parser.load_data(file_path)
    #         full_text = '\n'.join([doc.text for doc in parsed_documents])
    #         return parsed_documents, full_text
    #     except Exception as e:
    #         print(f"Error in LlamaParse processing: {e}")
    #         return [], ""

    def process_document(self, file):
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
                for chunk in file.chunks():
                    tmp_file.write(chunk)
                pdf_path = tmp_file.name
                
            try:
                # Initialize FAISS index for 1536-dimensional embeddings
                faiss_index = faiss.IndexFlatL2(1536)
                
                # Check document complexity
                is_complex = self.detect_document_complexity(pdf_path)
                
                # Process document based on complexity
                if is_complex:
                    parsed_documents, full_text = self.process_with_local_parser(pdf_path)
                else:
                    parsed_documents, full_text = self.process_with_local_parser(pdf_path)
                
                if not parsed_documents:
                    raise ValueError("No content could be extracted from the document")
                
                summary, follow_up_questions = self.generate_summary(full_text, file.name)
                
                # True late chunking implementation
                chunks_with_embeddings = self.true_late_chunking(full_text)
                
                # Create metadata store
                metadata_store = []
                embeddings_list = []
                
                for chunk_data in chunks_with_embeddings:
                    metadata = {
                        "content": chunk_data['text'],
                        "source_file": file.name,
                        "page_number": 'Unknown',  # Will be updated if available
                        "section_title": 'Unknown',
                        "chunk_start": chunk_data['span'][0],
                        "chunk_end": chunk_data['span'][1]
                    }
                    metadata_store.append(metadata)
                    embeddings_list.append(chunk_data['embedding'])
                
                # Convert embeddings to numpy array and add to FAISS index
                if embeddings_list:
                    embeddings_array = np.array(embeddings_list).astype('float32')
                    faiss_index.add(embeddings_array)
                
                # Save FAISS index and metadata
                index_path, metadata_path = self.save_index_and_metadata(faiss_index, metadata_store, file.name)
                
                return {
                    'index_path': index_path,
                    'metadata_path': metadata_path,
                    'summary': summary,
                    'follow_up_questions': follow_up_questions,
                    'full_text': full_text
                }
                
            finally:
                if os.path.exists(pdf_path):
                    os.unlink(pdf_path)
                    
        except Exception as e:
            print(f"Error in process_document: {str(e)}")
            raise

    def true_late_chunking(self, text, max_tokens=8192, chunk_size=512):
        """
        Implement true late chunking strategy:
        1. Get token embeddings for entire document
        2. Chunk the token embeddings
        3. Pool embeddings within chunks
        """
        print("*************************************")
        try:
            encoding = tiktoken.get_encoding("cl100k_base")
            tokens = encoding.encode(text)
            
            # Process in batches if text is too long
            if len(tokens) > max_tokens:
                return self.process_long_document_late_chunking(text, tokens, encoding, max_tokens, chunk_size)
            
            # Get token-level embeddings for the entire text
            response = client.embeddings.create(
                input=text,
                model="text-embedding-3-small",
                encoding_format="float"  # Get raw token embeddings
            )
            
            # Get token-level embeddings
            token_embeddings = np.array(response.data[0].embedding).reshape(-1, 1536)  # Reshape to token-level
            
            # Create chunks of token embeddings
            chunks_with_embeddings = []
            for i in range(0, len(tokens), chunk_size):
                chunk_tokens = tokens[i:i + chunk_size]
                chunk_text = encoding.decode(chunk_tokens)
                
                # Get corresponding token embeddings for this chunk
                chunk_token_embeddings = token_embeddings[i:i + len(chunk_tokens)]
                
                # Pool the token embeddings for this chunk (using mean pooling)
                chunk_embedding = np.mean(chunk_token_embeddings, axis=0)
                
                # Normalize the embedding
                chunk_embedding = chunk_embedding / np.linalg.norm(chunk_embedding)
                
                chunks_with_embeddings.append({
                    'text': chunk_text,
                    'span': (i, i + len(chunk_tokens)),
                    'embedding': chunk_embedding
                })
            
            return chunks_with_embeddings
            
        except Exception as e:
            print(f"Error in true_late_chunking: {str(e)}")
            return []

    def process_long_document_late_chunking(self, text, tokens, encoding, max_tokens, chunk_size):
        """Process long documents using late chunking strategy."""
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        chunks_with_embeddings = []
        window_size = max_tokens
        stride = max_tokens // 2
        
        for i in range(0, len(tokens), stride):
            window_tokens = tokens[i:i + window_size]
            window_text = encoding.decode(window_tokens)
            
            # Get token-level embeddings for this window
            response = client.embeddings.create(
                input=window_text,
                model="text-embedding-3-small",
                encoding_format="float"
            )
            
            # Get token-level embeddings for this window
            window_token_embeddings = np.array(response.data[0].embedding).reshape(-1, 1536)
            
            # Create chunks from this window's token embeddings
            for j in range(0, len(window_tokens), chunk_size):
                chunk_tokens = window_tokens[j:j + chunk_size]
                chunk_text = encoding.decode(chunk_tokens)
                
                # Get corresponding token embeddings for this chunk
                chunk_token_embeddings = window_token_embeddings[j:j + len(chunk_tokens)]
                
                # Pool the token embeddings for this chunk
                chunk_embedding = np.mean(chunk_token_embeddings, axis=0)
                chunk_embedding = chunk_embedding / np.linalg.norm(chunk_embedding)
                
                # Only add non-duplicate chunks
                global_span = (i + j, i + j + len(chunk_tokens))
                if not any(chunk['span'][0] == global_span[0] for chunk in chunks_with_embeddings):
                    chunks_with_embeddings.append({
                        'text': chunk_text,
                        'span': global_span,
                        'embedding': chunk_embedding
                    })
        
        return chunks_with_embeddings

    # def extract_key_terms(self, content, num_topics=5):
    #     """Extract key terms using N-grams, TF-IDF, and topic modeling"""
    #     # Tokenize and clean the content
    #     stop_words = set(stopwords.words('english'))
    #     words = re.findall(r'\b\w+\b', content.lower())
    #     words = [word for word in words if word not in stop_words and len(word) > 2]

    #     # Generate N-grams
    #     n_grams = list(ngrams(words, 2)) + list(ngrams(words, 3))
    #     n_gram_counts = Counter([" ".join(gram) for gram in n_grams]).most_common(10)

    #     # TF-IDF Vectorization
    #     vectorizer = TfidfVectorizer(stop_words='english', max_features=50)
    #     tfidf_matrix = vectorizer.fit_transform([content])
    #     tfidf_scores = dict(zip(vectorizer.get_feature_names_out(), tfidf_matrix.toarray().flatten()))

    #     # Topic Modeling
    #     lda = LatentDirichletAllocation(n_components=num_topics, random_state=0)
    #     lda.fit(tfidf_matrix)
        
    #     topic_terms = {}
    #     for idx, topic in enumerate(lda.components_):
    #         terms = [vectorizer.get_feature_names_out()[i] for i in topic.argsort()[:-6:-1]]
    #         topic_terms[f"Topic {idx+1}"] = terms

    #     # Aggregate key terms
    #     key_terms = dict(n_gram_counts)
    #     key_terms.update(tfidf_scores)
    #     for topic, terms in topic_terms.items():
    #         for term in terms:
    #             key_terms[term] = key_terms.get(term, 0) + 1

    #     return key_terms

    # def save_markdown(self, md_text, pdf_name, key_terms, markdown_dir):
    #     """Save markdown content with key terms"""
    #     base_name = os.path.splitext(pdf_name)[0]
    #     safe_name = re.sub(r'[^\w\-_.]', '_', base_name)
    #     md_path = os.path.join(markdown_dir, f"{safe_name}.md")

    #     with open(md_path, "w", encoding='utf-8') as f:
    #         f.write(md_text)
    #         f.write("\n\n# Key Terms and Frequencies\n")
    #         for term, freq in key_terms.items():
    #             f.write(f"- {term}: {freq}\n")

    #     return md_path

    def save_index_and_metadata(self, index, metadata, pdf_name):
        """Save FAISS index and metadata"""
        base_name = os.path.splitext(pdf_name)[0]
        safe_name = re.sub(r'[^\w\-_.]', '_', base_name)
        
        # Create directories if they don't exist
        index_dir = os.path.join(settings.MEDIA_ROOT, 'indices')
        metadata_dir = os.path.join(settings.MEDIA_ROOT, 'metadata')
        os.makedirs(index_dir, exist_ok=True)
        os.makedirs(metadata_dir, exist_ok=True)

        index_path = os.path.join(index_dir, f"{safe_name}_index.faiss")
        metadata_path = os.path.join(metadata_dir, f"{safe_name}_metadata.pkl")

        faiss.write_index(index, index_path)
        with open(metadata_path, 'wb') as f:
            pickle.dump(metadata, f)

        return index_path, metadata_path

    
    def generate_summary(self, content, file_name):
        max_chars = 30000
        truncated_content = content[:max_chars] if len(content) > max_chars else content
    
        prompt = f"""
        Please analyze this document '{file_name}' and provide:
        1. A concise summary of the main points and key findings
        
    
        Content: {truncated_content}
    
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
    
        try:
            response = GENERATIVE_MODEL.generate_content(prompt)
            response_text = response.text
            
            # Ensure proper HTML-like formatting
            # Wrap paragraphs in <p> tags if not already wrapped
            response_text = re.sub(r'^(?!<[p|b|u|ul|li])(.*?)$', r'<p>\1</p>', response_text, flags=re.MULTILINE)
            
            # Ensure bold tags for section headers
            section_headers = ['Summary Overview', 'Key Highlights', 'Detailed Insights']
            for header in section_headers:
                response_text = response_text.replace(header, f'<b>{header}</b>')
            
            # Extract follow-up questions
            parts = response_text.split('Follow-up Questions:')
            summary = parts[0].strip()
            
            # Extract or generate follow-up questions
            try:
                questions = [q.strip().lstrip('123. ') for q in parts[1].strip().split('\n') if q.strip()] if len(parts) > 1 else []
            except:
                questions = []
            
            # # Ensure 3 follow-up questions
            # while len(questions) < 3:
            #     questions.append("What other aspects of this document would you like to explore?")
            
            return summary, questions[:3]
        
        except Exception as e:
            print(f"Error generating summary: {str(e)}")
            return (
                f"""
                <b>Summary Generation Error</b>
                <p>Unable to generate a comprehensive summary for {file_name}</p>
                
                <b>Possible Reasons</b>
                <ul>
                    <li>Document may be too complex</li>
                    <li>Parsing issues encountered</li>
                    <li>Insufficient context extracted</li>
                </ul>
                """,
                [
                    "What would you like to know about this document?",
                    "Would you like me to explain any specific part?",
                    "Shall we discuss the document in more detail?"
                ]
            )
        
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
    
    Args:
        response_text (str): Raw generated response text
    
    Returns:
        str: Cleaned and formatted response
    """
    try:
        # Remove explicit section headers
        # Remove Roman numeral section headers
        response_text = re.sub(r'^[IVX]+\.\s*[\w\s]+:', '', response_text, flags=re.MULTILINE)
        
        # Remove numbered section headers
        response_text = re.sub(r'^\d+\.\s*[\w\s]+:', '', response_text, flags=re.MULTILINE)
        
        # Remove any remaining explicit section titles
        section_headers = [
            'Contextual Insight', 
            'Structured Response', 
            'Analytical Depth', 
            'Interactive Engagement'
        ]
        for header in section_headers:
            response_text = response_text.replace(header + ':', '')
        
        # Clean up extra whitespace
        response_text = re.sub(r'\n{3,}', '\n\n', response_text)
        
        # Ensure proper HTML tag formatting
        # Wrap paragraphs in <p> tags if not already wrapped
        response_text = re.sub(r'^(?!<[p|b|u])(.*?)$', r'<p>\1</p>', response_text, flags=re.MULTILINE)
        
        # Add bold tags for key points if not already present
        response_text = re.sub(r'^([A-Z][a-z\s]+):', r'<b>\1:</b>', response_text, flags=re.MULTILINE)
        
        # Ensure citations are in [N] format
        response_text = re.sub(r'\[(\d+)\]', r'[\1]', response_text)
        
        # Clean up any malformed tags
        response_text = re.sub(r'<([^/>]+)>(\s*)</\1>', '', response_text)
        
        return response_text.strip()
    
    except Exception as e:
        logger.error(f"Error in post-processing response: {str(e)}", exc_info=True)
        return response_text


class ChatView(APIView):
    permission_classes = [IsAuthenticated]

    def __init__(self, post_process_func=post_process_response):
        self.post_process_func = post_process_func

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

            # Search across selected documents
            results = self.search_documents(message, processed_docs)

            # Generate response based on search results only (no context)
            response, follow_up_questions = self.generate_response(
                message, 
                results
            )

            # Prepare conversation details
            conversation_id = conversation_id or str(uuid.uuid4())
            title = results.get('title') or f"Chat {datetime.now().strftime('%Y-%m-%d %H:%M')}"

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
                content=response,
                citations=results.get('citations', [])
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
                'response': response,
                'follow_up_questions': follow_up_questions,
                'conversation_id': str(conversation.conversation_id),
                'citations': results.get('citations', []),
                'active_document_id': active_document_id
            }

            # Print detailed chat response information
            print("\n--- Chat Interaction Logged ---")
            print(f"User Question: {message}")
            print(f"Assistant Response: {response[:500]}...")  # First 500 chars
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

    def generate_prompt(self, query, context):
        """
        Simplified prompt generation without conversation history
        """
        context_str = "\n".join(context) if context else "No document context available"

        prompt = f"""
        RESPONSE GENERATION GUIDELINES:
        1. STRUCTURE AND SPACING:
        - Use single line breaks between sections
        - No double spacing or excess line breaks
        - Keep formatting consistent and clean
 
        2. HTML FORMATTING RULES:
        - Paragraphs: <p>Your text here</p>
        - Headers/Important text: <b>Your header here</b>
        - Bullet lists:
            <ul>
            <li>First item</li>
            <li>Second item</li>
            </ul>
        - Numbered lists:
            <ol>
            <li>First item</li>
            <li>Second item</li>
            </ol>
 
        3. LIST FORMATTING:
        - Always use proper <ul> or <ol> tags for lists
        - Each list item must be wrapped in <li> tags
        - Lists should be properly indented in the HTML
        - Use unordered lists (<ul>) for bullet points
        - Use ordered lists (<ol>) for sequential steps
 
        4. SPACING RULES:
        - One line break after headers
        - One line break between paragraphs
        - No multiple line breaks
        - No excess spacing between sections
        5. SECTIONING:
            - Use <b> tags for section headings
            - Add empty lines before and after sections
            - Ensure clear visual hierarchy
        6. OVERALL STRUCTURE:
            - Start with a clear introduction
            - Group related information together
            - End with a conclusion or summary if appropriate
            - Use consistent spacing throughout
        7. LIST TYPE SELECTION:
            Use <ol> (ordered lists) for:
            - Step-by-step instructions or procedures
            - Sequential processes or timelines
            - Priority-ranked items
            - Methodological explanations
            - Chronological events
            - Hierarchical information
           
            Use <ul> (unordered lists) for:
            - Related but non-sequential items
            - Feature lists
            - Examples or options
            - General points
            - Parallel ideas
        8. CONTENT ORGANIZATION:
            - Analyze if the information has a natural sequence or order
            - Use <ol> when explaining 'how to' or 'step by step' processes
            - Use <ul> for listing features, characteristics, or parallel ideas
            - Mix both types when appropriate (e.g., steps followed by examples)
 
        PREVIOUS CONVERSATION CONTEXT:
        {previous_context or "No previous conversation context"}

        DOCUMENT CONTEXT:
        {context_str}
 
        USER QUERY:
        {query}
 
        CRITICAL REQUIREMENTS:
        - Use proper HTML list tags (<ul>, <ol>, <li>)
        - Maintain single line spacing
        - Remove any excess blank lines
        - Keep formatting consistent throughout
        - Use only information from provided documents
        - Maintain clear visual separation between different sections
        - Use HTML tags consistently for structure
            - Focus on readability and clear information hierarchy
            - Use ONLY information from the provided documents
            - NO external or speculative information
        """
        return prompt

    def generate_response(self, query, search_results):
        """
        Generate response using simplified prompt without conversation history
        """
        try:
            # Validate search results
            context_contents = search_results.get('contents', [])
            if not context_contents:
                logger.warning("No context contents found in search results")
                return (
                    "I apologize, but I couldn't find any relevant information in the documents to answer your question. "
                    "Could you please rephrase your question or provide more details?",
                    ["Would you like to try a different search term?",
                     "Can you provide more specific details about what you're looking for?",
                     "Would you like to search in different documents?"]
                )
            
            # Limit the total context size
            MAX_TOTAL_TOKENS = 6000  # Leave room for system message and completion
            total_context = []
            current_tokens = 0
            
            for content in context_contents:
                estimated_tokens = len(content) // 4  # Rough estimation
                if current_tokens + estimated_tokens > MAX_TOTAL_TOKENS:
                    break
                total_context.append(content)
                current_tokens += estimated_tokens
            
            # Generate prompt with limited context
            prompt = self.generate_prompt(query, total_context)
            
            # Generate response using OpenAI
            response = client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant with expertise in providing detailed, accurate responses. Base your response only on the provided context and be specific about what you find or don't find in the documents."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1024,
                temperature=0.7
            )

            usage = response.usage
            print("Input tokens:", usage.prompt_tokens)
            print("Output tokens:", usage.completion_tokens)
            print("Total tokens:", usage.total_tokens)
            
            # Extract and process response
            processed_response = self.post_process_func(response.choices[0].message.content)
            clean_response = re.sub(r'\[(\d+)\]', '', processed_response)
            
            # Generate follow-up questions
            follow_up_questions = self.generate_follow_up_questions(context_contents)
            
            return mark_safe(clean_response.strip()), follow_up_questions
            
        except Exception as e:
            logger.error(f"Error in response generation: {str(e)}", exc_info=True)
            return (
                "I apologize, but I'm unable to generate a response at the moment. Please try again.",
                ["Would you like to rephrase your question?",
                 "Can you provide more context?",
                 "Shall we try again?"]
            )

    def search_documents(self, query, processed_docs):
        """
        Search documents using OpenAI embeddings and return relevant content with citations
        """
        try:
            # Get query embedding using OpenAI
            response = client.embeddings.create(
                input=query,
                model="text-embedding-3-small"
            )
            query_embedding = np.array(response.data[0].embedding).astype('float32')
            
            all_results = []
            all_citations = []
            
            for proc_doc in processed_docs:
                try:
                    # Check if required files exist and are not None
                    if not proc_doc or not proc_doc.faiss_index or not proc_doc.metadata:
                        logger.warning(f"Missing required files for document processing")
                        continue
                    
                    if not os.path.exists(proc_doc.faiss_index) or not os.path.exists(proc_doc.metadata):
                        logger.warning(f"Index or metadata file not found for document")
                        continue
                    
                    # Load FAISS index and metadata
                    index = faiss.read_index(proc_doc.faiss_index)
                    with open(proc_doc.metadata, 'rb') as f:
                        metadata = pickle.load(f)
                    
                    if len(metadata) == 0:
                        logger.warning(f"Empty metadata for document")
                        continue
                    
                    # Search for similar content using FAISS
                    D, I = index.search(query_embedding.reshape(1, -1), k=5)
                    
                    # Process search results with token limit tracking
                    MAX_TOKENS_PER_DOC = 1000  # Adjust this value based on your needs
                    current_doc_tokens = 0
                    
                    for idx in I[0]:
                        if idx < len(metadata):
                            content = metadata[idx]['content']
                            if not content.strip():
                                continue
                                
                            # Estimate tokens (roughly 4 chars per token)
                            estimated_tokens = len(content) // 4
                            
                            if current_doc_tokens + estimated_tokens > MAX_TOKENS_PER_DOC:
                                logger.info(f"Reached token limit for document {proc_doc.document.filename}")
                                break
                                
                            current_doc_tokens += estimated_tokens
                            all_results.append(content)
                            all_citations.append({
                                'source_file': proc_doc.document.filename,
                                'page_number': metadata[idx].get('page_number', 'Unknown'),
                                'section_title': metadata[idx].get('section_title', 'Unknown'),
                                'snippet': content[:200] + "..." if len(content) > 200 else content,
                                'document_id': str(proc_doc.document.id)
                            })
                                
                except Exception as e:
                    logger.error(f"Error processing document {proc_doc.document.filename}: {str(e)}")
                    continue
            
            if not all_results:
                logger.warning("No results found in document search")
                
            return {
                'contents': all_results,
                'citations': all_citations,
                'conversation_id': str(uuid.uuid4()),
                'title': f"Chat {datetime.now().strftime('%Y-%m-%d %H:%M')}"
            }
            
        except Exception as e:
            logger.error(f"Error in document search: {str(e)}")
            raise

    def generate_follow_up_questions(self, context):
        def is_valid_question(q):
            """Check if a string is a valid question."""
            # Remove common prefixes that aren't part of the actual question
            q = re.sub(r'^(Here are|Following are|These are|Here\'s)\b.*?:', '', q, flags=re.IGNORECASE)
            q = re.sub(r'^\d+\.\s*', '', q)
            q = re.sub(r'^(Question|Q):\s*', '', q)
            q = q.strip()
           
            # Check if it's a proper question
            return (
                q and  # not empty
                q.endswith('?') and  # ends with question mark
                len(q) > 10 and  # reasonable length
                not q.startswith("Here are") and  # not a header
                not q.startswith("Following are") and
                not any(q.startswith(prefix) for prefix in ["1.", "2.", "3."]) and  # no numbered prefixes
                "?" in q  # contains at least one question mark
            )
 
        def generate_questions():
            """Generate and validate questions."""
            prompt = f"""
            Generate exactly 3 distinct follow-up questions based on this context.
           
            Requirements:
            - Each must be a complete, standalone question
            - Do not include any numbering or prefixes
            - Questions must end with a question mark
            - Keep questions concise and direct
            - Do not include phrases like "Here are three questions" or similar headers
           
            Context:
            {''.join(context[:3])}
            """
           
            try:
                response = GENERATIVE_MODEL.generate_content(prompt)
                # Split and clean the response
                questions = [q.strip() for q in response.text.split('\n') if q.strip()]
               
                # Clean and validate each question
                valid_questions = []
                for q in questions:
                    cleaned = re.sub(r'^\d+\.\s*', '', q)  # Remove numbered prefixes
                    cleaned = re.sub(r'^(Question|Q):\s*', '', cleaned)  # Remove question prefixes
                    cleaned = cleaned.strip()
                    if is_valid_question(cleaned):
                        valid_questions.append(cleaned)
               
                return valid_questions
            except Exception as e:
                logger.error(f"Error in question generation: {str(e)}")
                return []
 
        # Try to generate valid questions up to 3 times
        max_attempts = 2
        for attempt in range(max_attempts):
            questions = generate_questions()
           
            # If we have exactly 3 valid questions, return them
            if len(questions) == 3:
                return questions
           
            logger.warning(f"Attempt {attempt + 1}: Generated {len(questions)} valid questions, retrying...")
       
        # If we still don't have 3 valid questions after all attempts,
        # fill in with default questions
        default_questions = [
            "What specific aspects of this topic would you like to explore further?",
            "Could you clarify which parts of this information are most relevant to your needs?",
            "How can I provide more detailed information about this subject?"
        ]
       
        # Combine any valid generated questions with default questions
        final_questions = questions[:3]  # Take any valid questions we did get
        while len(final_questions) < 3:
            final_questions.append(default_questions[len(final_questions)])
       
        return final_questions
        
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