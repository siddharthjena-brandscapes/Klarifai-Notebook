# ideagen/utils.py
from chat.utils import (
    
    delete_from_azure_blob,
    get_azure_settings,
)
import io
import os
import base64
from django.conf import settings
from django.core.files.base import ContentFile
import logging
from django.utils import timezone
from django.db import models, transaction
 
logger = logging.getLogger(__name__)



def update_project_timestamp(project_id, user):
    """
    Update the timestamp for a project to mark it as recently modified
    """
    from django.utils import timezone
    
    try:
        # First, try to import Project model from ideaGen app
        from ideaGen.models import Project
        
        # Get the project
        project = Project.objects.filter(id=project_id, user=user).first()
        
        if project:
            # Check which field exists for timestamp
            if hasattr(project, 'last_modified'):
                project.last_modified = timezone.now()
                project.save(update_fields=['last_modified'])
            elif hasattr(project, 'last_modified_at'):
                project.last_modified_at = timezone.now()
                project.save(update_fields=['last_modified_at'])
            else:
                # If neither expected field exists, try to update the entire object
                # This is less efficient but serves as a fallback
                project.save()
                
            print(f"Successfully updated timestamp for project {project_id}")
            return True
        else:
            print(f"Project {project_id} not found for user {user.username}")
            return False
            
    except Exception as e:
        # Log the error but don't crash the application
        print(f"Error updating project {project_id} timestamp: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return False
 
# Path in Azure Blob Storage for generated images
GENERATED_IMAGES_PATH = 'media/generated_images/'

def upload_to_azure_blob(file, folder_path, content_type=None):
    """
    Upload a file to Azure Blob Storage
    
    Args:
        file: Django file object
        folder_path: Path where file should be stored (e.g., 'media/generated_images/')
        content_type: MIME type of the file
    
    Returns:
        dict: Contains 'url' and 'filename' if successful, None if failed
    """
    try:
        account_name, account_key, container_name = get_azure_settings()
        
        if not all([account_name, account_key, container_name]):
            logger.error("Missing Azure Storage credentials")
            return None
        
        # Create blob service client
        blob_service_client = BlobServiceClient(
            account_url=f"https://{account_name}.blob.core.windows.net",
            credential=account_key
        )
        
        # Generate unique filename if not provided
        if hasattr(file, 'name') and file.name:
            filename = file.name
        else:
            import uuid
            filename = f"{uuid.uuid4()}.png"
        
        # Construct the full blob path
        blob_name = f"{folder_path}{filename}"
        
        # Ensure we're at the beginning of the file
        if hasattr(file, 'seek'):
            file.seek(0)
        
        # Get blob client
        blob_client = blob_service_client.get_blob_client(
            container=container_name,
            blob=blob_name
        )
        
        # Read file content
        if hasattr(file, 'read'):
            file_content = file.read()
        else:
            file_content = file
        
        # Upload the blob
        blob_client.upload_blob(
            file_content,
            content_type=content_type or 'application/octet-stream',
            overwrite=True
        )
        
        # Construct the full URL
        blob_url = f"https://{account_name}.blob.core.windows.net/{container_name}/{blob_name}"
        
        logger.info(f"Successfully uploaded file to Azure Blob: {blob_url}")
        
        return {
            'url': blob_url,
            'filename': blob_name,  # This includes the full path: media/generated_images/filename.png
            'container': container_name
        }
        
    except Exception as e:
        logger.error(f"Error uploading to Azure Blob Storage: {str(e)}", exc_info=True)
        return None

def upload_image_to_azure(image_data, filename):
    """
    Upload an image to Azure Blob Storage in the generated_images folder
    
    Args:
        image_data: PIL Image object or file-like object
        filename: Name to give the image file
    
    Returns:
        dict with URL and other metadata, or None on error
    """
    try:
        # Convert PIL Image to bytes if needed
        if hasattr(image_data, 'save'):
            img_buffer = io.BytesIO()
            image_data.save(img_buffer, format="PNG")
            img_buffer.seek(0)
            file_obj = ContentFile(img_buffer.getvalue())
            file_obj.name = filename
        else:
            # Assume it's already a file-like object
            file_obj = image_data
            file_obj.name = filename
        
        # Upload to Azure Blob Storage with correct path
        logger.info(f"Uploading image {filename} to Azure Blob Storage at path: {GENERATED_IMAGES_PATH}")
        result = upload_to_azure_blob(
            file=file_obj,
            folder_path=GENERATED_IMAGES_PATH,  # This creates: media/generated_images/filename.png
            content_type='image/png'
        )
        
        if result:
            logger.info(f"Successfully uploaded image to Azure Blob: {result['url']}")
            return result
        else:
            logger.error(f"Failed to upload image {filename} to Azure Blob")
            return None
    
    except Exception as e:
        logger.error(f"Error uploading image to Azure Blob: {str(e)}", exc_info=True)
        return None
 
def validate_api_tokens(user):
    """
    Validates API tokens for a user and returns appropriate error messages if invalid.
    
    Args:
        user: User instance
        
    Returns:
        dict: {'valid': boolean, 'hf_token': token if valid, 'error': error message if invalid}
    """
    try:
        # Get the user's tokens
        user_tokens = UserAPITokens.objects.get(user=user)
        
        # Validate Hugging Face token
        hf_token = user_tokens.nebius_token
        if not hf_token or hf_token.strip() == "":
            return {
                'valid': False,
                'hf_token': None,
                'error': "Nebius API token is missing or invalid. Please update your API token in your profile settings."
            }
            
        # Validate Gemini token if needed
        gemini_token = user_tokens.gemini_token
        if not gemini_token or gemini_token.strip() == "":
            return {
                'valid': False,
                'hf_token': hf_token,
                'error': "Google Gemini API token is missing or invalid. Please update your API token in your profile settings."
            }
            
        # All tokens valid
        return {
            'valid': True,
            'hf_token': hf_token,
            'gemini_token': gemini_token,
            'error': None
        }
            
    except UserAPITokens.DoesNotExist:
        return {
            'valid': False,
            'hf_token': None,
            'error': "No API tokens found for this user. Please set up your API tokens in your profile settings."
        }
    except Exception as e:
        return {
            'valid': False,
            'hf_token': None,
            'error': f"Error validating API tokens: {str(e)}"
        }
 
        
def delete_image_from_azure(blob_path):
    """
    Delete an image from Azure Blob Storage
    
    Args:
        blob_path: The path to the blob in Azure Storage
    
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        if not blob_path:
            return False
            
        # If the path is a full URL, extract just the path part
        if blob_path.startswith('http'):
            _, _, container_name = get_azure_settings()
            # Extract the path after the container name
            parts = blob_path.split(container_name + '/')
            if len(parts) > 1:
                blob_path = parts[1]
        
        # Ensure the path includes 'media/generated_images/'
        if not blob_path.startswith('media/'):
            # If the path doesn't start with media/ but should, add it
            if blob_path.startswith('generated_images/'):
                blob_path = f"media/{blob_path}"
        
        logger.info(f"Deleting image from Azure Blob: {blob_path}")
        return delete_from_azure_blob(blob_path)
    
    except Exception as e:
        logger.error(f"Error deleting image from Azure Blob: {str(e)}")
        return False
 

def get_full_azure_url(blob_path):
    """
    Convert a blob path to a full Azure Blob Storage URL
    
    Args:
        blob_path: The path to the blob in Azure Storage
    
    Returns:
        str: The full URL to the blob
    """
    try:
        account_name, _, container_name = get_azure_settings()
        
        # Ensure the blob path doesn't start with a slash
        if blob_path.startswith('/'):
            blob_path = blob_path[1:]
            
        # FIXED: Ensure the path includes 'media/generated_images/'
        if not blob_path.startswith('media/generated_images/'):
            # If the path is just a filename, add the full path
            if '/' not in blob_path:
                blob_path = f"media/generated_images/{blob_path}"
            # If the path starts with 'generated_images/', add 'media/'
            elif blob_path.startswith('generated_images/'):
                blob_path = f"media/{blob_path}"
        
        # Log the final constructed path
        logger.info(f"Constructing Azure URL with path: {blob_path}")
            
        # Construct the full URL
        return f"https://{account_name}.blob.core.windows.net/{container_name}/{blob_path}"
    
    except Exception as e:
        logger.error(f"Error constructing Azure URL: {str(e)}")
        return None