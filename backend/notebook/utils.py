# chat/utils.py
import os
import tempfile
from django.conf import settings
from azure.storage.blob import BlobServiceClient, ContentSettings
import logging
import uuid

logger = logging.getLogger(__name__)

_blob_service_client = None

def get_azure_settings():
    """
    Get Azure Storage settings reliably from environment variables and Django settings
    with better error handling
    """
    logger.info("Getting Azure Storage settings...")
    
    try:
        # First try direct environment variables (highest priority)
        account_name = os.environ.get('AZURE_STORAGE_ACCOUNT_NAME')
        account_key = os.environ.get('AZURE_STORAGE_ACCOUNT_KEY')
        container_name = 'uploadfiles'  # Always use uploadfiles container
        connection_string = os.environ.get('AZURE_STORAGE_CONNECTION_STRING')
        
        # If not in env, try from Django settings
        if not account_name:
            try:
                from django.conf import settings
                account_name = getattr(settings, 'AZURE_STORAGE_ACCOUNT_NAME', None)
                if account_name:
                    logger.info(f"Got account_name from settings: {account_name}")
            except Exception as e:
                logger.warning(f"Error getting AZURE_STORAGE_ACCOUNT_NAME from settings: {str(e)}")
        
        if not account_key:
            try:
                from django.conf import settings
                account_key = getattr(settings, 'AZURE_STORAGE_ACCOUNT_KEY', None)
                if account_key:
                    logger.info("Got account_key from settings")
            except Exception as e:
                logger.warning(f"Error getting AZURE_STORAGE_ACCOUNT_KEY from settings: {str(e)}")
        
        if not connection_string:
            try:
                from django.conf import settings
                connection_string = getattr(settings, 'AZURE_STORAGE_CONNECTION_STRING', None)
                if connection_string:
                    logger.info("Got connection_string from settings")
            except Exception as e:
                logger.warning(f"Error getting AZURE_STORAGE_CONNECTION_STRING from settings: {str(e)}")
        
        # Only build connection string if we have account name and key but no connection string
        if account_name and account_key and not connection_string:
            connection_string = f"DefaultEndpointsProtocol=https;AccountName={account_name};AccountKey={account_key};EndpointSuffix=core.windows.net"
            logger.info("Created connection string from account name and key")
        
        # If we don't have minimum required settings for Azure Blob, use placeholder values
        # This way the app can still start, even if blob operations will fail later
        if not account_name:
            logger.warning("Azure Storage account name not found. Using development placeholder.")
            account_name = 'devstoreaccount1'
        
        logger.info(f"Using Azure settings: Account={account_name}, Container={container_name}")
        return account_name, connection_string, container_name
        
    except Exception as e:
        logger.error(f"Error getting Azure settings: {str(e)}")
        # Return development values as a fallback
        return 'devstoreaccount1', None, 'uploadfiles'  # Change default container to 'uploadfiles'

    """
    Get Azure Storage settings reliably from environment variables and Django settings
    with better error handling
    """
    logger.info("Getting Azure Storage settings...")
    
    try:
        # First try direct environment variables (highest priority)
        account_name = os.environ.get('AZURE_STORAGE_ACCOUNT_NAME')
        account_key = os.environ.get('AZURE_STORAGE_ACCOUNT_KEY')
        container_name = 'uploadfiles'  # Hardcoded container name
        connection_string = os.environ.get('AZURE_STORAGE_CONNECTION_STRING')
        
        # If not in env, try from Django settings
        if not account_name:
            try:
                from django.conf import settings
                account_name = getattr(settings, 'AZURE_STORAGE_ACCOUNT_NAME', None)
                if account_name:
                    logger.info(f"Got account_name from settings: {account_name}")
            except Exception as e:
                logger.warning(f"Error getting AZURE_STORAGE_ACCOUNT_NAME from settings: {str(e)}")
        
        if not account_key:
            try:
                from django.conf import settings
                account_key = getattr(settings, 'AZURE_STORAGE_ACCOUNT_KEY', None)
                if account_key:
                    logger.info("Got account_key from settings")
            except Exception as e:
                logger.warning(f"Error getting AZURE_STORAGE_ACCOUNT_KEY from settings: {str(e)}")
        
        if not connection_string:
            try:
                from django.conf import settings
                connection_string = getattr(settings, 'AZURE_STORAGE_CONNECTION_STRING', None)
                if connection_string:
                    logger.info("Got connection_string from settings")
            except Exception as e:
                logger.warning(f"Error getting AZURE_STORAGE_CONNECTION_STRING from settings: {str(e)}")
        
        # Only build connection string if we have account name and key but no connection string
        if account_name and account_key and not connection_string:
            connection_string = f"DefaultEndpointsProtocol=https;AccountName={account_name};AccountKey={account_key};EndpointSuffix=core.windows.net"
            logger.info("Created connection string from account name and key")
        
        # If we don't have minimum required settings for Azure Blob, use placeholder values
        # This way the app can still start, even if blob operations will fail later
        if not account_name:
            logger.warning("Azure Storage account name not found. Using development placeholder.")
            account_name = 'devstoreaccount1'
        
        logger.info(f"Using Azure settings: Account={account_name}, Container={container_name}")
        return account_name, connection_string, container_name
        
    except Exception as e:
        logger.error(f"Error getting Azure settings: {str(e)}")
        # Return development values as a fallback
        return 'devstoreaccount1', None, 'uploadfiles'

def get_blob_service_client():
    """Get authenticated BlobServiceClient with better error handling"""
    global _blob_service_client
    
    if _blob_service_client is not None:
        return _blob_service_client
    
    try:
        _, connection_string, _ = get_azure_settings()
        
        if not connection_string:
            logger.error("No Azure Blob Storage connection string available")
            return None
        
        logger.info("Creating BlobServiceClient from connection string")
        _blob_service_client = BlobServiceClient.from_connection_string(connection_string)
        return _blob_service_client
    
    except Exception as e:
        logger.error(f"Error creating BlobServiceClient: {str(e)}", exc_info=True)
        return None

def ensure_container_exists(container_name):
    """Ensure the specified container exists in Azure Blob Storage"""
    try:
        blob_service_client = get_blob_service_client()
        if not blob_service_client:
            logger.error("Failed to get blob service client")
            return False
        
        container_client = blob_service_client.get_container_client(container_name)
        
        # Check if container exists
        if not container_client.exists():
            logger.info(f"Container {container_name} doesn't exist, creating it...")
            container_client.create_container()
            logger.info(f"Container {container_name} created successfully")
        
        return True
    
    except Exception as e:
        logger.error(f"Error ensuring container exists: {str(e)}", exc_info=True)
        return False

def upload_document_to_blob(file, main_project_id=None):
    """
    Upload a document file to Azure Blob Storage in the media/documents folder
    
    Args:
        file: The file to upload
        main_project_id: Optional project ID for organizing files
        
    Returns:
        dict: Upload result information or None on failure
    """
    folder_path = 'media/documents'
    if main_project_id:
        folder_path = f"{folder_path}/{main_project_id}"
    
    return upload_to_azure_blob(file, folder_path=folder_path)

def upload_transcript_to_blob(transcript_content, filename, is_video=False):
    """
    Upload a transcript file to Azure Blob Storage in the transcripts folder
    
    Args:
        transcript_content: The transcript content as string or bytes
        filename: The filename to use
        is_video: Whether this is a transcript from a video
        
    Returns:
        dict: Upload result information or None on failure
    """
    try:
        # Create folder structure based on source type
        source_type = "video" if is_video else "audio"
        folder_path = f'transcripts/{source_type}'
        
        # Convert string to bytes if needed
        if isinstance(transcript_content, str):
            transcript_content = transcript_content.encode('utf-8')
        
        # Upload to Azure Blob
        result = upload_bytes_to_azure_blob(
            transcript_content, 
            filename, 
            folder_path=folder_path,
            content_type='text/plain',
            container_name='uploadfiles'
        )
        
        if result:
            logger.info(f"Successfully uploaded transcript to: {result['filename']}")
            return result
        else:
            logger.error(f"Failed to upload transcript: {filename}")
            return None
            
    except Exception as e:
        logger.error(f"Error uploading transcript to blob: {str(e)}", exc_info=True)
        return None
    

def get_transcript_from_blob(blob_path, container_name='uploadfiles'):
    """
    Retrieve transcript content from Azure Blob Storage
    
    Args:
        blob_path: Path to the transcript in blob storage
        container_name: Container name (default: uploadfiles)
        
    Returns:
        str: Transcript content or None if failed
    """
    try:
        content_bytes = get_blob_content(blob_path, container_name)
        if content_bytes:
            return content_bytes.decode('utf-8')
        return None
    except Exception as e:
        logger.error(f"Error retrieving transcript from blob: {str(e)}")
        return None
    
def list_transcripts(source_type=None, container_name='uploadfiles'):
    """
    List all transcripts in blob storage
    
    Args:
        source_type: Filter by 'audio' or 'video', or None for all
        container_name: Container name (default: uploadfiles)
        
    Returns:
        list: List of transcript blob information
    """
    try:
        if source_type:
            folder_path = f'transcripts/{source_type}'
        else:
            folder_path = 'transcripts'
            
        return list_blobs_in_folder(folder_path, container_name)
    except Exception as e:
        logger.error(f"Error listing transcripts: {str(e)}")
        return []


def upload_faiss_index_to_blob(faiss_index_bytes, index_filename, metadata_bytes, metadata_filename):
    """
    Upload FAISS index and metadata files to Azure Blob Storage
    
    Args:
        faiss_index_bytes: The FAISS index data
        index_filename: The filename for the index
        metadata_bytes: The metadata data
        metadata_filename: The filename for the metadata
        
    Returns:
        tuple: (index_upload_result, metadata_upload_result)
    """
    folder_path = 'faissindex'
    
    index_result = upload_bytes_to_azure_blob(
        faiss_index_bytes, 
        index_filename, 
        folder_path=folder_path
    )
    
    metadata_result = upload_bytes_to_azure_blob(
        metadata_bytes, 
        metadata_filename, 
        folder_path=folder_path
    )
    
    return index_result, metadata_result

def upload_markdown_to_blob(markdown_content, filename):
    """
    Upload a markdown file to Azure Blob Storage
    
    Args:
        markdown_content: The markdown content as string
        filename: The filename to use
        
    Returns:
        dict: Upload result information or None on failure
    """
    folder_path = 'markdown'
    
    # Convert string to bytes if needed
    if isinstance(markdown_content, str):
        markdown_content = markdown_content.encode('utf-8')
    
    return upload_bytes_to_azure_blob(markdown_content, filename, folder_path=folder_path)

def upload_to_azure_blob(file, folder_path='', container_name=None, content_type=None):
    """
    Upload a file to Azure Blob Storage with proper folder structure
    """
    try:
        account_name, _, default_container = get_azure_settings()
        container_name = container_name or default_container
        
        # Ensure container exists
        if not ensure_container_exists(container_name):
            logger.error(f"Failed to ensure container {container_name} exists")
            return None
        
        # Get the shared blob service client
        blob_service_client = get_blob_service_client()
        if not blob_service_client:
            logger.error("Failed to get blob service client")
            return None
        
        # Get a container client
        container_client = blob_service_client.get_container_client(container_name)
        
        # Generate a unique filename with original extension
        file_extension = os.path.splitext(file.name)[1].lower()
        unique_name = f"{uuid.uuid4().hex}{file_extension}"
        
        # Ensure folder path ends with a slash if not empty
        if folder_path and not folder_path.endswith('/'):
            folder_path += '/'
            
        # Construct blob path
        blob_path = f"{folder_path}{unique_name}"
        
        # Determine content type if not provided
        if not content_type:
            content_type = get_content_type(file.name)
        
        # Upload with content settings
        blob_client = container_client.get_blob_client(blob_path)
        
        logger.info(f"Uploading file {file.name} to blob path {blob_path} in container {container_name}")
        
        # Upload the blob
        blob_client.upload_blob(
            file.read(),
            overwrite=True,
            content_settings=ContentSettings(content_type=content_type)
        )
        
        # Construct URL
        blob_url = f"https://{account_name}.blob.core.windows.net/{container_name}/{blob_path}"
        
        return {
            'url': blob_url,
            'filename': blob_path,
            'original_name': file.name,
            'size': file.size
        }
        
    except Exception as e:
        logger.error(f"Error uploading to Azure Blob Storage: {str(e)}", exc_info=True)
        return None

def upload_bytes_to_azure_blob(content_bytes, filename, folder_path='', content_type=None, container_name=None):
    """Upload bytes to Azure Blob Storage"""
    import logging
    
    logger = logging.getLogger(__name__)
    
    try:
        logger.info(f"Starting to upload bytes to Azure Blob Storage: {folder_path}/{filename}")
        
        # Get Azure settings
        account_name, connection_string, default_container = get_azure_settings()
        container_name = container_name or default_container
        
        # Validate connection string
        if not connection_string:
            logger.error("Azure Storage Connection String not configured")
            return None
        
        # Get blob service client
        from azure.storage.blob import BlobServiceClient, ContentSettings
        blob_service_client = BlobServiceClient.from_connection_string(connection_string)
        
        # Get container client
        container_client = blob_service_client.get_container_client(container_name)
        
        # Check if container exists, create if not
        if not container_client.exists():
            logger.info(f"Container {container_name} doesn't exist, creating it...")
            container_client.create_container()
        
        # Ensure folder path ends with a slash if not empty
        if folder_path and not folder_path.endswith('/'):
            folder_path += '/'
        
        # Construct blob path
        blob_path = f"{folder_path}{filename}"
        
        # Determine content type if not provided
        if not content_type:
            import os
            content_type = get_content_type(filename)
        
        # Upload with content settings
        logger.info(f"Uploading blob: {blob_path}, Content-Type: {content_type}, Size: {len(content_bytes)} bytes")
        blob_client = container_client.get_blob_client(blob_path)
        
        blob_client.upload_blob(
            content_bytes,
            overwrite=True,
            content_settings=ContentSettings(content_type=content_type)
        )
        
        # Construct URL
        blob_url = f"https://{account_name}.blob.core.windows.net/{container_name}/{blob_path}"
        
        logger.info(f"Successfully uploaded blob: {blob_path}, URL: {blob_url}")
        
        return {
            'url': blob_url,
            'filename': blob_path
        }
        
    except Exception as e:
        logger.error(f"Error uploading bytes to Azure Blob Storage: {str(e)}", exc_info=True)
        return None

def download_blob_to_file(blob_path, local_path, container_name=None):
    """
    Download a file from Azure Blob Storage to a local file
    
    Args:
        blob_path: Path of the blob in the container
        local_path: Local path where to save the downloaded file
        container_name: Override the default container name
        
    Returns:
        bool: True if download was successful, False otherwise
    """
    try:
        # Get Azure settings
        account_name, _, default_container = get_azure_settings()
        container_name = container_name or default_container
        
        # Ensure container exists
        if not ensure_container_exists(container_name):
            logger.error(f"Failed to ensure container {container_name} exists")
            return False
        
        # Get the blob service client
        blob_service_client = get_blob_service_client()
        if not blob_service_client:
            logger.error("Failed to get blob service client")
            return False
        
        # Normalize the blob path - Remove any leading slashes
        normalized_path = blob_path
        while normalized_path.startswith('/'):
            normalized_path = normalized_path[1:]
        
        # Create directory for local path if it doesn't exist
        os.makedirs(os.path.dirname(local_path), exist_ok=True)
        
        # Get the container client
        container_client = blob_service_client.get_container_client(container_name)
        
        # Get the blob client
        blob_client = container_client.get_blob_client(normalized_path)
        
        # Check if blob exists
        if not blob_client.exists():
            logger.error(f"Blob {normalized_path} not found in container {container_name}")
            return False
        
        # Download the blob
        with open(local_path, "wb") as local_file:
            download_stream = blob_client.download_blob()
            local_file.write(download_stream.readall())
            
        logger.info(f"Blob {normalized_path} downloaded successfully to {local_path}")
        return True
        
    except Exception as e:
        logger.error(f"Error downloading from Azure Blob Storage: {str(e)}", exc_info=True)
        return False

# In utils.py - modify the download_blob_to_temp_file function
def download_blob_to_temp_file(blob_path, container_name=None):
    """
    Download a blob from Azure Storage to a temporary file
    FIXED: Better path handling and blob service client usage
    """
    try:
        # Default to uploadfiles container for consistency
        container_name = container_name or 'uploadfiles'
        
        # Enhanced logging for debugging
        print(f"BLOB DEBUG: Attempting to download blob: {blob_path}")
        print(f"BLOB DEBUG: Container name: {container_name}")
        
        # Get temp file path
        file_extension = os.path.splitext(blob_path)[1]
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=file_extension)
        temp_path = temp_file.name
        temp_file.close()
        
        # Get blob service client
        blob_service_client = get_blob_service_client()
        if not blob_service_client:
            print("❌ Failed to get blob service client")
            return None
        
        # Clean up the blob path - remove leading slashes and normalize
        normalized_path = blob_path.strip('/')
        
        # Try these paths in order (with better path handling):
        paths_to_try = [
            normalized_path,  # Original path without leading slash
            f"faissindex/{os.path.basename(normalized_path)}",  # Direct faissindex folder
            f"faissindex/{normalized_path}",  # Full path in faissindex folder
            os.path.basename(normalized_path),  # Just the filename
        ]
        
        # If the original path doesn't start with faissindex/, add more variations
        if not normalized_path.startswith('faissindex/'):
            paths_to_try.extend([
                f"media/documents/{normalized_path}",  # Add media/documents/ prefix
                f"media/{normalized_path}",  # Add just media/ prefix
            ])
        
        # Try each path
        for try_path in paths_to_try:
            print(f"BLOB DEBUG: Trying path: {try_path}")
            
            try:
                # Get the blob client
                blob_client = blob_service_client.get_container_client(container_name).get_blob_client(try_path)
                
                # Check if blob exists and download
                if blob_client.exists():
                    print(f"BLOB DEBUG: Blob found at {try_path}, downloading to: {temp_path}")
                    
                    # Download the blob
                    with open(temp_path, "wb") as local_file:
                        download_stream = blob_client.download_blob()
                        local_file.write(download_stream.readall())
                    
                    # Verify the file was downloaded
                    if os.path.exists(temp_path) and os.path.getsize(temp_path) > 0:
                        print(f"BLOB DEBUG: Blob downloaded successfully to {temp_path}, size: {os.path.getsize(temp_path)} bytes")
                        return temp_path
                    else:
                        print(f"BLOB DEBUG: Downloaded file is empty or doesn't exist")
                        
                else:
                    print(f"BLOB DEBUG: Blob does not exist at {try_path}")
                    
            except Exception as path_error:
                print(f"BLOB DEBUG: Error trying path {try_path}: {str(path_error)}")
                continue
        
        print("BLOB DEBUG: No matching blob found after trying all path variations")
        
        # Last resort - try listing blobs to find similar files
        try:
            container_client = blob_service_client.get_container_client(container_name)
            print("BLOB DEBUG: Listing blobs in container to find matches...")
            
            # List all blobs in the container (or at least faissindex folder)
            blob_prefix = "faissindex/" if not normalized_path.startswith('faissindex/') else ""
            blobs_list = container_client.list_blobs(name_starts_with=blob_prefix)
            
            # Print available blobs for debugging
            available_blobs = []
            for blob in blobs_list:
                available_blobs.append(blob.name)
                print(f"BLOB DEBUG: Found blob: {blob.name}")
                if len(available_blobs) >= 20:  # Limit output
                    print("BLOB DEBUG: (more blobs exist but not shown)")
                    break
                    
            # Try to find a blob with a similar filename
            basename = os.path.basename(normalized_path)
            print(f"BLOB DEBUG: Looking for blobs containing: {basename}")
            
            # Look for exact or partial matches
            for blob_name in available_blobs:
                if basename in blob_name or blob_name.endswith(basename):
                    print(f"BLOB DEBUG: Found potential match: {blob_name}")
                    try:
                        blob_client = container_client.get_blob_client(blob_name)
                        
                        # Download the blob
                        with open(temp_path, "wb") as local_file:
                            download_stream = blob_client.download_blob()
                            local_file.write(download_stream.readall())
                        
                        if os.path.exists(temp_path) and os.path.getsize(temp_path) > 0:
                            print(f"BLOB DEBUG: Successfully downloaded match: {blob_name}")
                            return temp_path
                    except Exception as match_error:
                        print(f"BLOB DEBUG: Error downloading match {blob_name}: {str(match_error)}")
                        continue
                        
        except Exception as list_error:
            print(f"BLOB DEBUG: Error listing blobs: {str(list_error)}")
        
        # Clean up failed temp file
        try:
            if os.path.exists(temp_path):
                os.unlink(temp_path)
        except:
            pass
            
        return None
        
    except Exception as e:
        print(f"❌ Error downloading from Azure Blob Storage: {str(e)}")
        import traceback
        print(traceback.format_exc())
        
        # Clean up on failure
        if 'temp_path' in locals() and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
            except:
                pass
        return None

def delete_blob(blob_path, container_name=None):
    """
    Delete a blob from Azure Storage
    
    Args:
        blob_path: Path of the blob in the container
        container_name: Override the default container name
        
    Returns:
        bool: True if deletion was successful, False otherwise
    """
    try:
        # Get Azure settings
        _, _, default_container = get_azure_settings()
        container_name = container_name or default_container
        
        # Get the blob service client
        blob_service_client = get_blob_service_client()
        if not blob_service_client:
            logger.error("Failed to get blob service client")
            return False
        
        # Normalize the blob path - Remove any leading slashes
        normalized_path = blob_path
        while normalized_path.startswith('/'):
            normalized_path = normalized_path[1:]
        
        # Get the blob client
        blob_client = blob_service_client.get_blob_client(
            container=container_name,
            blob=normalized_path
        )
        
        # Check if blob exists before deleting
        if not blob_client.exists():
            logger.error(f"Blob {normalized_path} not found in container {container_name}")
            return False
        
        # Delete the blob
        blob_client.delete_blob()
        logger.info(f"Blob {normalized_path} deleted successfully from container {container_name}")
        
        return True
        
    except Exception as e:
        logger.error(f"Error deleting blob from Azure Storage: {str(e)}", exc_info=True)
        return False

def get_blob_content(blob_path, container_name=None):
    """
    Get the content of a blob from Azure Storage with enhanced error handling
    FIXED: Better path resolution and blob service client usage
    
    Args:
        blob_path: Path of the blob in the container
        container_name: Override the default container name
        
    Returns:
        bytes: The blob content if successful, None otherwise
    """
    try:
        # Get Azure settings
        _, _, default_container = get_azure_settings()
        container_name = container_name or default_container or 'uploadfiles'
        
        print(f"BLOB CONTENT DEBUG: Getting content for {blob_path} from container {container_name}")
        
        # Get the blob service client
        blob_service_client = get_blob_service_client()
        if not blob_service_client:
            print("❌ Failed to get blob service client")
            return None
        
        # Clean up the blob path - remove leading slashes and normalize
        normalized_path = blob_path.strip('/')
        
        # Try these paths in order (similar to download function):
        paths_to_try = [
            normalized_path,  # Original path without leading slash
            f"faissindex/{os.path.basename(normalized_path)}",  # Direct faissindex folder
            f"faissindex/{normalized_path}",  # Full path in faissindex folder
            os.path.basename(normalized_path),  # Just the filename
        ]
        
        # If the original path doesn't start with faissindex/, add more variations
        if not normalized_path.startswith('faissindex/'):
            paths_to_try.extend([
                f"media/documents/{normalized_path}",  # Add media/documents/ prefix
                f"media/{normalized_path}",  # Add just media/ prefix
            ])
        
        # Try each path
        for try_path in paths_to_try:
            print(f"BLOB CONTENT DEBUG: Trying path: {try_path}")
            
            try:
                # Get the blob client
                blob_client = blob_service_client.get_blob_client(
                    container=container_name,
                    blob=try_path
                )
                
                # Check if blob exists and get content
                if blob_client.exists():
                    print(f"✅ Blob found at {try_path}")
                    
                    # Get blob properties first to check size
                    blob_properties = blob_client.get_blob_properties()
                    blob_size = blob_properties.size
                    print(f"Blob size: {blob_size} bytes")
                    
                    if blob_size == 0:
                        print(f"❌ Blob is empty at {try_path}")
                        continue
                    
                    # Download the blob content
                    download_stream = blob_client.download_blob()
                    content = download_stream.readall()
                    
                    print(f"✅ Successfully downloaded {len(content)} bytes from {try_path}")
                    return content
                else:
                    print(f"❌ Blob does not exist at {try_path}")
                    
            except Exception as path_error:
                print(f"❌ Error trying content path {try_path}: {str(path_error)}")
                continue
        
        print("❌ No matching content blob found after trying all path variations")
        
        # Last resort - try to find similar blobs
        try:
            container_client = blob_service_client.get_container_client(container_name)
            print("BLOB CONTENT DEBUG: Searching for similar blobs...")
            
            # List blobs that might match
            blob_prefix = "faissindex/" if not normalized_path.startswith('faissindex/') else ""
            blobs_list = container_client.list_blobs(name_starts_with=blob_prefix)
            
            # Look for partial matches
            basename = os.path.basename(normalized_path)
            print(f"BLOB CONTENT DEBUG: Looking for blobs containing: {basename}")
            
            for blob in blobs_list:
                if basename in blob.name or blob.name.endswith(basename):
                    print(f"BLOB CONTENT DEBUG: Found potential match: {blob.name}")
                    try:
                        blob_client = container_client.get_blob_client(blob.name)
                        
                        # Get blob properties
                        blob_properties = blob_client.get_blob_properties()
                        if blob_properties.size > 0:
                            # Download content
                            download_stream = blob_client.download_blob()
                            content = download_stream.readall()
                            
                            print(f"✅ Successfully got content from match: {blob.name}")
                            return content
                            
                    except Exception as match_error:
                        print(f"❌ Error getting content from match {blob.name}: {str(match_error)}")
                        continue
                        
        except Exception as search_error:
            print(f"❌ Error searching for similar blobs: {str(search_error)}")
        
        return None
        
    except Exception as e:
        print(f"❌ Error getting blob content from Azure Storage: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return None


def get_content_type(filename):
    """
    Get content type based on file extension
    """
    extension = os.path.splitext(filename)[1].lower()
    
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
        '.gif': 'image/gif',
        '.faiss': 'application/octet-stream',
        '.pkl': 'application/octet-stream',
        '.md': 'text/markdown',
        '.mp3': 'audio/mpeg',
        '.mp4': 'video/mp4',
        '.wav': 'audio/wav',
        '.mpeg': 'video/mpeg',
        '.m4a': 'audio/m4a',
        '.aac': 'audio/aac',
        '.flac': 'audio/flac',
        '.avi': 'video/x-msvideo',
        '.mov': 'video/quicktime',
        '.wmv': 'video/x-ms-wmv',
        '.mkv': 'video/x-matroska',
        '.flv': 'video/x-flv',
        '.webm': 'video/webm',
    }
    
    return content_types.get(extension, 'application/octet-stream')

def list_blobs_in_folder(folder_path, container_name=None):
    """
    List all blobs in a specific folder from Azure Blob Storage
    
    Args:
        folder_path: Folder path in the container
        container_name: Override the default container name
        
    Returns:
        list: List of blob information dictionaries
    """
    try:
        # Get Azure settings
        _, _, default_container = get_azure_settings()
        container_name = container_name or default_container
        
        # Get the blob service client
        blob_service_client = get_blob_service_client()
        if not blob_service_client:
            logger.error("Failed to get blob service client")
            return []
        
        # Get the container client
        container_client = blob_service_client.get_container_client(container_name)
        
        # Ensure folder path ends with a slash if not empty
        if folder_path and not folder_path.endswith('/'):
            folder_path += '/'
        
        # List blobs with the specified prefix
        blobs = container_client.list_blobs(name_starts_with=folder_path)
        
        # Format blob information
        blob_list = []
        for blob in blobs:
            blob_list.append({
                'name': blob.name,
                'size': blob.size,
                'content_type': blob.content_settings.content_type if hasattr(blob, 'content_settings') else None,
                'creation_time': blob.creation_time,
                'last_modified': blob.last_modified
            })
        
        return blob_list
        
    except Exception as e:
        logger.error(f"Error listing blobs from Azure Storage: {str(e)}", exc_info=True)
        return []

# Fix for upload_file_to_blob function in chat/utils.py
# Add this update to prevent folder creation for profile pictures

def upload_file_to_blob(file, filename, folder_path=None, container_name='uploadfiles'):
    """
    Upload a file to Azure Blob Storage.
    
    Args:
        file: File object to upload
        filename: Desired filename in blob storage
        folder_path: Optional folder path to prepend to filename
        container_name: Azure container name (default: 'uploadfiles')
        
    Returns:
        dict: Upload result with information about the uploaded file
    """
    from azure.storage.blob import BlobServiceClient
    import os
    
    try:
        # Get service client
        blob_service_client = get_blob_service_client()
        container_client = blob_service_client.get_container_client(container_name)
        
        # Prepare the blob path
        blob_path = filename
        if folder_path:
            # Ensure folder path doesn't end with slash
            folder_path = folder_path.rstrip('/')
            blob_path = f"{folder_path}/{os.path.basename(filename)}"
            
        print(f"Uploading to blob path: {blob_path}")
        
        # Create blob client
        blob_client = container_client.get_blob_client(blob_path)
        
        # Upload file (read in chunks to handle large files)
        if hasattr(file, 'read'):
            # For file-like objects
            file.seek(0)  # Ensure we're at the start of the file
            blob_client.upload_blob(file, overwrite=True)
        else:
            # For cases where file might be a string or bytes
            blob_client.upload_blob(file, overwrite=True)
        
        # IMPORTANT: Return just the blob path, not creating a folder structure
        return {
            'success': True,
            'filename': blob_path,
            'container': container_name
        }
        
    except Exception as e:
        print(f"Error uploading to blob storage: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }


def upload_profile_picture_to_blob(file, username):
    """
    Upload a profile picture to Azure Blob Storage in the media/profile_pictures folder
    
    Args:
        file: The file to upload
        username: Username for organizing files
        
    Returns:
        dict: Upload result information or None on failure
    """
    import uuid
    import os
    
    try:
        # Get Azure settings
        account_name, connection_string, default_container = get_azure_settings()
        container_name = 'uploadfiles'  # Always use uploadfiles container
        
        # Validate connection string
        if not connection_string:
            logger.error("Azure Storage Connection String not configured")
            return None
        
        # Ensure container exists
        if not ensure_container_exists(container_name):
            logger.error(f"Failed to ensure container {container_name} exists")
            return None
        
        # Get blob service client
        blob_service_client = get_blob_service_client()
        if not blob_service_client:
            logger.error("Failed to get blob service client")
            return None
        
        # Get container client
        container_client = blob_service_client.get_container_client(container_name)
        
        # Generate a unique filename with original extension
        file_extension = os.path.splitext(file.name)[1].lower()
        unique_id = uuid.uuid4().hex[:8]
        unique_filename = f"{username}_{unique_id}{file_extension}"
        
        # Set folder path for profile pictures
        folder_path = 'media/profile_pictures'
        
        # Construct blob path
        blob_path = f"{folder_path}/{unique_filename}"
        
        # Determine content type
        content_type = get_content_type(file.name)
        
        # Upload with content settings
        blob_client = container_client.get_blob_client(blob_path)
        
        logger.info(f"Uploading profile picture {file.name} to blob path {blob_path} in container {container_name}")
        
        # Upload the blob
        blob_client.upload_blob(
            file.read(),
            overwrite=True,
            content_settings=ContentSettings(content_type=content_type)
        )
        
        # Construct URL
        blob_url = f"https://{account_name}.blob.core.windows.net/{container_name}/{blob_path}"
        
        logger.info(f"Successfully uploaded profile picture to: {blob_url}")
        
        return {
            'url': blob_url,
            'filename': blob_path,
            'original_name': file.name,
            'size': file.size
        }
        
    except Exception as e:
        logger.error(f"Error uploading profile picture to Azure Blob Storage: {str(e)}", exc_info=True)
        return None



def delete_profile_picture_from_blob(blob_path, container_name='uploadfiles'):
    """
    Delete a profile picture from Azure Blob Storage
    
    Args:
        blob_path: Path to the blob in the container
        container_name: Container name (default: uploadfiles)
        
    Returns:
        bool: True if deletion was successful, False otherwise
    """
    try:
        # Get the blob service client
        blob_service_client = get_blob_service_client()
        if not blob_service_client:
            logger.error("Failed to get blob service client")
            return False
        
        # Normalize the blob path - Remove any leading slashes
        normalized_path = blob_path
        while normalized_path.startswith('/'):
            normalized_path = normalized_path[1:]
        
        # Get the blob client
        blob_client = blob_service_client.get_blob_client(
            container=container_name,
            blob=normalized_path
        )
        
        # Check if blob exists before deleting
        if blob_client.exists():
            # Delete the blob
            blob_client.delete_blob()
            logger.info(f"Profile picture {normalized_path} deleted successfully from container {container_name}")
            return True
        else:
            logger.warning(f"Profile picture {normalized_path} not found in container {container_name}")
            return True  # Consider it successful if already doesn't exist
        
    except Exception as e:
        logger.error(f"Error deleting profile picture from Azure Storage: {str(e)}", exc_info=True)
        return False