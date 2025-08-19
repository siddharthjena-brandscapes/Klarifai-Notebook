# # deployment.py

# from .settings import *
# import os
# import logging

# # Set up logging
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)

# logger.info("Loading deployment settings...")

# # Debug flag - set to False in production
# DEBUG = False

# # Handle allowed hosts
# ALLOWED_HOSTS = [
#     os.environ.get('WEBSITE_HOSTNAME', ''),
#     '.azurewebsites.net',
#     'localhost',
#     '127.0.0.1',
#     '169.254.129.2',
#     '169.254.131.2',
#     '169.254.129.3',
    
# ]
# logger.info(f"Allowed hosts: {ALLOWED_HOSTS}")

# # CORS settings
# CORS_ALLOWED_ORIGINS = [
#     'https://lemon-plant-073b3600f.1.azurestaticapps.net',
#     'https://bsw.klarifai.ai',
    
# ]

# CSRF_TRUSTED_ORIGINS = [
#     'https://' + os.environ.get('WEBSITE_HOSTNAME', ''),
#     'https://*.azurewebsites.net'
# ]

# # Get Google API key
# GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY')

# # Get secret key
# SECRET_KEY = os.environ.get('MY_SECRET_KEY', 'django-insecure-default-key-for-development-only')

# # Configure middleware
# MIDDLEWARE = [
#     'django.middleware.security.SecurityMiddleware',
#     'corsheaders.middleware.CorsMiddleware',
#     'whitenoise.middleware.WhiteNoiseMiddleware',
#     'django.contrib.sessions.middleware.SessionMiddleware',
#     'django.middleware.common.CommonMiddleware',
#     'django.middleware.csrf.CsrfViewMiddleware',
#     'django.contrib.auth.middleware.AuthenticationMiddleware',
#     'django.contrib.messages.middleware.MessageMiddleware',
#     'django.middleware.clickjacking.XFrameOptionsMiddleware',
# ]

# # Database configuration - Updated for VM connection
# try:
#     # Check for VM database connection first
#     VM_DB_HOST = os.environ.get('VM_DB_HOST')  # Your VM's public IP or domain
#     VM_DB_PORT = os.environ.get('VM_DB_PORT', '5432')
#     VM_DB_NAME = os.environ.get('VM_DB_NAME', 'klarifai_prod_db')  # Match your docker-compose
#     VM_DB_USER = os.environ.get('VM_DB_USER', 'postgres')
#     VM_DB_PASSWORD = os.environ.get('VM_DB_PASSWORD', 'KlarifaiDatabase123')  # Match your docker-compose
    
#     if VM_DB_HOST:
#         # Use VM PostgreSQL database
#         DATABASES = {
#             'default': {
#                 'ENGINE': 'django.db.backends.postgresql',
#                 'NAME': VM_DB_NAME,
#                 'USER': VM_DB_USER,
#                 'PASSWORD': VM_DB_PASSWORD,
#                 'HOST': VM_DB_HOST,
#                 'PORT': VM_DB_PORT,
#                 'OPTIONS': {
#                     'connect_timeout': 60,
#                     'application_name': 'django_app',
#                 },
#                 'CONN_MAX_AGE': 0,  # Disable connection pooling for external connections
#             }
#         }
#         logger.info(f"Database configured for VM connection: {VM_DB_HOST}:{VM_DB_PORT}")
#     else:
#         # Fallback to Azure PostgreSQL if available
#         CONNECTION = os.environ.get('AZURE_POSTGRESQL_CONNECTIONSTRING', '')
#         logger.info(f"Have PostgreSQL connection string: {'Yes' if CONNECTION else 'No'}")
        
#         CONNECTION_STR = {}
#         if CONNECTION:
#             if ' ' in CONNECTION:
#                 for pair in CONNECTION.split(' '):
#                     if '=' in pair:
#                         key, value = pair.split('=', 1)
#                         CONNECTION_STR[key] = value
#             else:
#                 for pair in CONNECTION.split(';'):
#                     if '=' in pair:
#                         key, value = pair.split('=', 1)
#                         CONNECTION_STR[key] = value
            
#             if all(k in CONNECTION_STR for k in ['dbname', 'user', 'password', 'host']):
#                 DATABASES = {
#                     'default': {
#                         'ENGINE': 'django.db.backends.postgresql',
#                         'NAME': CONNECTION_STR.get('dbname'),
#                         'USER': CONNECTION_STR.get('user'),
#                         'PASSWORD': CONNECTION_STR.get('password'),
#                         'HOST': CONNECTION_STR.get('host'),
#                         'PORT': '5432',
#                         'OPTIONS': {'sslmode': 'require'},
#                         'CONN_MAX_AGE': 60,
#                     },
#                 }
#                 logger.info("Database configured from Azure connection string")
#             else:
#                 logger.warning("Incomplete database connection information")
                
# except Exception as e:
#     logger.error(f"Error parsing database connection: {str(e)}")
#     logger.info("Using default database configuration from settings.py")

# # Redis configuration for VM connection
# try:
#     REDIS_HOST = os.environ.get('REDIS_HOST', VM_DB_HOST)  # Same as DB host by default
#     REDIS_PORT = os.environ.get('REDIS_PORT', '6379')
#     REDIS_PASSWORD = os.environ.get('REDIS_PASSWORD', 'Redis@123')  # Match your docker-compose
    
#     if REDIS_HOST:
#         CACHES = {
#             'default': {
#                 'BACKEND': 'django_redis.cache.RedisCache',
#                 'LOCATION': f'redis://:{REDIS_PASSWORD}@{REDIS_HOST}:{REDIS_PORT}/1',
#                 'OPTIONS': {
#                     'CLIENT_CLASS': 'django_redis.client.DefaultClient',
#                     'CONNECTION_POOL_KWARGS': {
#                         'max_connections': 50,
#                         'retry_on_timeout': True,
#                     }
#                 }
#             }
#         }
#         logger.info(f"Redis configured for VM connection: {REDIS_HOST}:{REDIS_PORT}")
#     else:
#         logger.info("Redis not configured - using dummy cache")
#         CACHES = {
#             'default': {
#                 'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
#             }
#         }
# except Exception as e:
#     logger.error(f"Error configuring Redis: {str(e)}")

# # Azure Blob Storage Configuration
# try:
#     AZURE_ACCOUNT_NAME = os.environ.get('AZURE_STORAGE_ACCOUNT_NAME')
#     AZURE_ACCOUNT_KEY = os.environ.get('AZURE_STORAGE_ACCOUNT_KEY')
#     AZURE_CONTAINER = os.environ.get('AZURE_STORAGE_CONTAINER_NAME')
    
#     logger.info(f"Azure Storage Account Name: {AZURE_ACCOUNT_NAME or 'Not set'}")
#     logger.info(f"Azure Container: {AZURE_CONTAINER or 'Not set'}")
    
#     AZURE_STORAGE_ACCOUNT_NAME = AZURE_ACCOUNT_NAME
#     AZURE_STORAGE_ACCOUNT_KEY = AZURE_ACCOUNT_KEY
#     AZURE_STORAGE_CONTAINER_NAME = AZURE_CONTAINER
    
#     if AZURE_ACCOUNT_NAME and AZURE_ACCOUNT_KEY:
#         AZURE_STORAGE_CONNECTION_STRING = os.environ.get('AZURE_STORAGE_CONNECTION_STRING') or \
#             f"DefaultEndpointsProtocol=https;AccountName={AZURE_ACCOUNT_NAME};AccountKey={AZURE_ACCOUNT_KEY};EndpointSuffix=core.windows.net"
#         logger.info("Azure Storage connection string constructed")
#     else:
#         logger.warning("Missing Azure Storage credentials - blob operations may fail")

#     AZURE_CUSTOM_DOMAIN = f'{AZURE_ACCOUNT_NAME}.blob.core.windows.net'
# except Exception as e:
#     logger.error(f"Error setting up Azure Storage: {str(e)}")

# # Storage configuration
# try:
#     STATIC_URL = '/static/'
#     STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
    
#     STORAGES = {
#         "staticfiles": {
#             "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
#         },
#     }
    
#     if AZURE_ACCOUNT_NAME and AZURE_ACCOUNT_KEY and AZURE_CONTAINER:
#         STORAGES["default"] = {
#             "BACKEND": "storages.backends.azure_storage.AzureStorage",
#             "OPTIONS": {
#                 "account_name": AZURE_ACCOUNT_NAME,
#                 "account_key": AZURE_ACCOUNT_KEY,
#                 "azure_container": AZURE_CONTAINER,
#                 "custom_domain": f"{AZURE_ACCOUNT_NAME}.blob.core.windows.net",
#             },
#         }
        
#         MEDIA_URL = f'https://{AZURE_CUSTOM_DOMAIN}/{AZURE_CONTAINER}/'
#         logger.info(f"Media URL configured: {MEDIA_URL}")
#         logger.info("Azure Blob Storage configured as default storage")
        
#         BLOB_MEDIA_FOLDER = 'media/'
#         DOCUMENTS_PATH = f'{BLOB_MEDIA_FOLDER}documents/'
#         GENERATED_IMAGES_PATH = f'{BLOB_MEDIA_FOLDER}generated_images/'
#         PROFILE_PICTURES_PATH = f'{BLOB_MEDIA_FOLDER}profile_pictures/'
#         FAISS_INDEXES_PATH = 'faiss_indexes/'
#         MARKDOWN_FILES_PATH = 'markdownfiles/'
#         TRANSCRIPTS_PATH = 'transcripts/'
        
#         logger.info(f"Blob paths configured: documents={DOCUMENTS_PATH}, profile_pictures={PROFILE_PICTURES_PATH}")
#     else:
#         STORAGES["default"] = {
#             "BACKEND": "django.core.files.storage.FileSystemStorage",
#         }
        
#         logger.warning("Azure Blob Storage not fully configured. Using local file system for media storage.")
#         MEDIA_URL = '/media/'
#         MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
# except Exception as e:
#     logger.error(f"Error configuring storage: {str(e)}")

# # Email configuration
# try:
#     EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
#     EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
#     EMAIL_PORT = int(os.getenv('EMAIL_PORT', 587))
#     EMAIL_USE_TLS = True
#     EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER')
#     EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')
#     DEFAULT_FROM_EMAIL = EMAIL_HOST_USER
# except Exception as e:
#     logger.error(f"Error configuring email: {str(e)}")

# # Security settings for production
# SECURE_BROWSER_XSS_FILTER = True
# SECURE_CONTENT_TYPE_NOSNIFF = True
# X_FRAME_OPTIONS = 'DENY'
# SECURE_HSTS_SECONDS = 31536000 if not DEBUG else 0
# SECURE_HSTS_INCLUDE_SUBDOMAINS = True
# SECURE_HSTS_PRELOAD = True

# # Logging configuration
# LOGGING = {
#     'version': 1,
#     'disable_existing_loggers': False,
#     'formatters': {
#         'verbose': {
#             'format': '[{levelname}] {asctime} {module} {process:d} {thread:d} {message}',
#             'style': '{',
#         },
#         'simple': {
#             'format': '[{levelname}] {message}',
#             'style': '{',
#         },
#     },
#     'handlers': {
#         'console': {
#             'class': 'logging.StreamHandler',
#             'formatter': 'verbose',
#             'level': 'INFO',
#         },
#     },
#     'root': {
#         'handlers': ['console'],
#         'level': 'INFO',
#     },
#     'loggers': {
#         'django': {
#             'handlers': ['console'],
#             'level': os.getenv('DJANGO_LOG_LEVEL', 'WARNING'),
#             'propagate': False,
#         },
#         'chat': {
#             'handlers': ['console'],
#             'level': 'INFO',
#             'propagate': False,
#         },
#         'azure': {
#             'handlers': ['console'],
#             'level': 'WARNING',
#             'propagate': False,
#         },
#     },
# }

# logger.info("Deployment settings loaded successfully!")
# logger.info(f"Database Host: {DATABASES.get('default', {}).get('HOST', 'Not configured')}")
# logger.info(f"Redis Host: {REDIS_HOST if 'REDIS_HOST' in locals() else 'Not configured'}")