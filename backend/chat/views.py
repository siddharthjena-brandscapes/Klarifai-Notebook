#views.py original
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login
from django.contrib.auth.hashers import check_password
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated, AllowAny  # Combined imports
from rest_framework_simplejwt.tokens import RefreshToken  # Added only once
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
import os
import pickle
import tempfile
import re
from datetime import datetime
from django.core.files.storage import default_storage
from django.conf import settings
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk.util import ngrams
from collections import Counter
import google.generativeai as genai  # Merged single instance
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import LatentDirichletAllocation
from llama_parse import LlamaParse
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
            last_processed_doc_id = None  # Track the last processed document

            for file in files:
                # Check for existing document
                existing_doc = Document.objects.filter(
                    user=user, 
                    filename=file.name,
                    main_project=main_project
                ).first()

                if existing_doc:
                    # Handle existing document
                    try:
                        processed_index = ProcessedIndex.objects.get(document=existing_doc)
                        uploaded_docs.append({
                            'id': existing_doc.id,
                            'filename': existing_doc.filename,
                            'summary': processed_index.summary,
                            # Add other relevant details
                        })
                        last_processed_doc_id = existing_doc.id
                    except ProcessedIndex.DoesNotExist:
                        # Process the document if no existing index
                        document = existing_doc
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
                else:
                    # Create new document
                    document = Document.objects.create(
                        user=user, 
                        file=file, 
                        filename=file.name,
                        main_project=main_project
                    )
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
                    print(f"Summary: {processed_data['summary'][:200]}...")  # First 200 chars
                    print(f"Follow-up Questions: {processed_data.get('follow_up_questions', [])}")
                    print("---")

            # Print full uploaded documents list
            print("Full Uploaded Documents Response:")
            print(uploaded_docs)

            # Store the last processed document ID in the session
            request.session['active_document_id'] = last_processed_doc_id

            return Response({
                'message': 'Documents processed successfully',
                'documents': [{
                    'id': document.id,
                    'filename': document.filename,
                    'summary': processed_data['summary'],
                    'follow_up_questions': processed_data.get('follow_up_questions', []),
                    # other fields...
                }],
                'active_document_id': last_processed_doc_id
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def process_document(self, file):
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
            for chunk in file.chunks():
                tmp_file.write(chunk)
            pdf_path = tmp_file.name

        text_embedder = SentenceTransformer('all-MiniLM-L6-v2')
        faiss_index = faiss.IndexFlatL2(384)

        # Parse the document using LlamaParse
        parser = LlamaParse(
            api_key="llx-qCIa9mCC9pL0IEhBhe0FyOI0G6UqoxKlq7gCjqDn8zYlb6LJ",
            result_type="markdown",
            verbose=True,
            images=True,
            premium_mode=True
        )
        parsed_documents = parser.load_data(pdf_path)
        full_text = '\n'.join([doc.text for doc in parsed_documents])

        # Extract key terms using topic modeling
        key_terms = self.extract_key_terms(full_text)

        # Generate summary and follow-up questions
        summary, follow_up_questions = self.generate_summary(full_text, file.name)
        print('***********',summary)
        # Create embeddings and metadata
        texts_to_embed = [doc.text for doc in parsed_documents]
        metadata_store = []

        for doc in parsed_documents:
            metadata_store.append({
                "content": doc.text,
                "source_file": file.name,
                "page_number": getattr(doc, 'page', 'Unknown'),
                "section_title": getattr(doc, 'section_title', 'Unknown')
            })

        embeddings = text_embedder.encode(texts_to_embed, convert_to_tensor=True)
        faiss_index.add(np.array(embeddings).astype('float32'))

        # Save FAISS index and metadata
        index_path, metadata_path = self.save_index_and_metadata(faiss_index, metadata_store, file.name)

        os.unlink(pdf_path)
        print(summary)

        return {
            'index_path': index_path,
            'metadata_path': metadata_path,
            'summary': summary,
            'follow_up_questions': follow_up_questions,
            'key_terms': key_terms,
            'full_text': full_text
        }

    def extract_key_terms(self, content, num_topics=5):
        """Extract key terms using N-grams, TF-IDF, and topic modeling"""
        # Tokenize and clean the content
        stop_words = set(stopwords.words('english'))
        words = re.findall(r'\b\w+\b', content.lower())
        words = [word for word in words if word not in stop_words and len(word) > 2]

        # Generate N-grams
        n_grams = list(ngrams(words, 2)) + list(ngrams(words, 3))
        n_gram_counts = Counter([" ".join(gram) for gram in n_grams]).most_common(10)

        # TF-IDF Vectorization
        vectorizer = TfidfVectorizer(stop_words='english', max_features=50)
        tfidf_matrix = vectorizer.fit_transform([content])
        tfidf_scores = dict(zip(vectorizer.get_feature_names_out(), tfidf_matrix.toarray().flatten()))

        # Topic Modeling
        lda = LatentDirichletAllocation(n_components=num_topics, random_state=0)
        lda.fit(tfidf_matrix)
        
        topic_terms = {}
        for idx, topic in enumerate(lda.components_):
            terms = [vectorizer.get_feature_names_out()[i] for i in topic.argsort()[:-6:-1]]
            topic_terms[f"Topic {idx+1}"] = terms

        # Aggregate key terms
        key_terms = dict(n_gram_counts)
        key_terms.update(tfidf_scores)
        for topic, terms in topic_terms.items():
            for term in terms:
                key_terms[term] = key_terms.get(term, 0) + 1

        return key_terms

    def save_markdown(self, md_text, pdf_name, key_terms, markdown_dir):
        """Save markdown content with key terms"""
        base_name = os.path.splitext(pdf_name)[0]
        safe_name = re.sub(r'[^\w\-_.]', '_', base_name)
        md_path = os.path.join(markdown_dir, f"{safe_name}.md")

        with open(md_path, "w", encoding='utf-8') as f:
            f.write(md_text)
            f.write("\n\n# Key Terms and Frequencies\n")
            for term, freq in key_terms.items():
                f.write(f"- {term}: {freq}\n")

        return md_path

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

            # Retrieve previous conversation context
            previous_messages = self.get_conversation_context(conversation_id)

            # Prepare conversation context
            previous_context = self.prepare_conversation_context(previous_messages)

            # Search across selected documents
            results = self.search_documents(message, processed_docs)

            # Generate response based on search results and context
            response, follow_up_questions = self.generate_response_with_enhanced_context(
                message, 
                results, 
                previous_context
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

            # Update memory buffer with conversation context
            memory_buffer, created = ConversationMemoryBuffer.objects.get_or_create(
                conversation=conversation
            )
            memory_buffer.update_memory(conversation.messages.all())

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

    def get_conversation_context(self, conversation_id, max_context_length=5):
        """
        Retrieve previous messages for context
        Limit to last 5 messages to prevent context overflow
        """
        try:
            conversation = ChatHistory.objects.get(conversation_id=conversation_id)
            messages = conversation.messages.order_by('-created_at')[:max_context_length]
            
            # Reverse to maintain chronological order
            return list(reversed(messages))
        except ChatHistory.DoesNotExist:
            return []
    def prepare_conversation_context(self, previous_messages):
        """
        Prepare a structured conversation context
        """
        context = []
        for msg in previous_messages:
            role = "Human" if msg.role == 'user' else "AI"
            context.append(f"{role}: {msg.content}")
        return "\n".join(context) if context else "No previous context"

    def generate_enhanced_prompt(self, context, query, previous_context=None):
        """
        Advanced Prompt Engineering for Context-Aware, Conversational Response Generation
        """
        # Prepare context string
        context_str = "\n".join(context) if context else "No document context available"

        prompt = f"""
        RESPONSE GENERATION GUIDELINES:
        - Provide a clear, concise, and informative answer
        - Use semantic HTML tags for structure: <b>, <p>, <ul>, <li>
        - Maintain a natural, conversational tone
        - Ensure the response is directly derived from the provided context

        CONTEXT ANALYSIS:
        - Carefully examine the document context
        - Identify key information relevant to the query
        - Synthesize information into a coherent response

        PREVIOUS CONVERSATION CONTEXT:
        {previous_context or "No previous conversation context"}

        DOCUMENT CONTEXT:
        {context_str}

        USER QUERY: {query}

        RESPONSE FORMAT REQUIREMENTS:
        1. Begin with a brief introductory paragraph
        2. Use <b> tags for key section headings
        3. Utilize <p> tags for detailed explanations
        4. Employ <ul> and <li> for list-based information and use bullets to display it
        6. Ensure the response flows naturally and is easy to read

        CRITICAL CONSTRAINTS:
        - Use ONLY information from the provided documents
        - NO external or speculative information
        - Maintain clarity and readability

        GENERATE A RESPONSE THAT:
        - Directly addresses the query
        - Provides comprehensive information
        - Uses structured formatting
        """
        return prompt

    def generate_response_with_enhanced_context(self, query, search_results, previous_context=None):
        """
        Generate response using advanced context-aware prompt engineering
        """
        try:
            # Prepare context for prompt
            context_contents = search_results.get('contents', [])
          

            # Generate enhanced prompt
            enhanced_prompt = self.generate_enhanced_prompt(
                context=context_contents,
                query=query,
                previous_context=previous_context
            )

            # Generate response using the enhanced prompt
            model = genai.GenerativeModel('gemini-1.5-flash', 
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
            
            
            # Generate response
            response = model.generate_content(enhanced_prompt)
            # Post-process the response
            processed_response = self.post_process_func(response.text)

            # Remove citation markers [1], [2], etc.
            clean_response = re.sub(r'\[(\d+)\]', '', processed_response)
            
            # Generate follow-up questions
            follow_up_questions = self.generate_follow_up_questions(context_contents)

            return mark_safe(clean_response.strip()), follow_up_questions

        except Exception as e:
            logger.error(f"Error in enhanced response generation: {str(e)}", exc_info=True)
            return (
                "I apologize, but I'm unable to generate a response at the moment.", 
                [
                    "Would you like to rephrase your question?",
                    "Can you provide more context?",
                    "Shall we try again?"
                ]
            )

    def search_documents(self, query, processed_docs):
        text_embedder = SentenceTransformer('all-MiniLM-L6-v2')
        query_embedding = text_embedder.encode([query])[0]

        all_results = []
        all_citations = []

        for proc_doc in processed_docs:
            try:
                if not os.path.exists(proc_doc.faiss_index):
                    continue
                    
                if not os.path.exists(proc_doc.metadata):
                    continue

                index = faiss.read_index(proc_doc.faiss_index)
                with open(proc_doc.metadata, 'rb') as f:
                    metadata = pickle.load(f)

                D, I = index.search(query_embedding.reshape(1, -1), k=5)

                for idx in I[0]:
                    if idx < len(metadata):
                        content = metadata[idx]['content']
                        all_results.append(content)
                        all_citations.append({
                            'source_file': proc_doc.document.filename,
                            'page_number': metadata[idx].get('page_number', 'Unknown'),
                            'section_title': metadata[idx].get('section_title', 'Unknown'),
                            'snippet': content[:200] + "..." if len(content) > 200 else content,
                            'document_id': str(proc_doc.document.id)
                        })

            except Exception as e:
                continue

        return {
            'contents': all_results,
            'citations': all_citations,
            'conversation_id': str(uuid.uuid4()),
            'title': f"Chat {datetime.now().strftime('%Y-%m-%d %H:%M')}"
        }

    def generate_follow_up_questions(self, context):
        prompt = f"""
        Based on this context, suggest 3 relevant follow-up questions, the length of the questions should be short:
        {''.join(context[:3])}
        """
        
        try:
            response = GENERATIVE_MODEL.generate_content(prompt)
            questions = response.text.split('\n')
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
