from .settings import *
import os
from .settings import BASE_DIR


DEBUG = True

GOOGLE_API_KEY = os.environ['GOOGLE_API_KEY']

ALLOWED_HOSTS = [
    os.environ.get('WEBSITE_HOSTNAME', ''),
    '.azurewebsites.net',
    'localhost',
    '127.0.0.1',
    '169.254.129.2'
]

CORS_ALLOWED_ORIGINS = [
    'https://blue-mushroom-065c30e0f.6.azurestaticapps.net' 
]

CSRF_TRUSTED_ORIGINS = [
    'https://' + os.environ.get('WEBSITE_HOSTNAME', ''),
    'https://*.azurewebsites.net'
]
SECRET_KEY = os.environ['MY_SECRET_KEY']

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',  # Should be first
    'corsheaders.middleware.CorsMiddleware',         # Before CommonMiddleware
    'whitenoise.middleware.WhiteNoiseMiddleware',    # After SecurityMiddleware
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# Parse connection string
CONNECTION = os.environ['AZURE_POSTGRESQL_CONNECTIONSTRING']
CONNECTION_STR = {pair.split('=')[0]: pair.split('=')[1] 
                 for pair in CONNECTION.split(' ')}

# Azure PostgreSQL database configuration
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': CONNECTION_STR.get('dbname'),  # Azure PostgreSQL typically uses 'dbname' in connection string
        'USER': CONNECTION_STR.get('user'),
        'PASSWORD': CONNECTION_STR.get('password'),
        'HOST': CONNECTION_STR.get('host'),
        'PORT': '5432',
        'OPTIONS': {'sslmode': 'require'},
        'CONN_MAX_AGE': 600,
    },
    # 'data_analysis': {
    #     'ENGINE': 'django.db.backends.postgresql',
    #     'NAME': os.getenv('AZURE_DATA_ANALYSIS_NAME'),
    #     'USER': CONNECTION_STR.get('user'),
    #     'PASSWORD': CONNECTION_STR.get('password'),
    #     'HOST': CONNECTION_STR.get('host'),
    #     'PORT': '5432',
    #     'OPTIONS': {'sslmode': 'require'},
    # }
}

# Production CORS settings
# CORS_ALLOWED_ORIGINS = [
#     os.getenv('FRONTEND_URL'),
# ]
# CORS_ALLOW_CREDENTIALS = True

# Static and Media Files
STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Email configuration
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', 587))
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER

# Logging configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'WARNING',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': os.getenv('DJANGO_LOG_LEVEL', 'WARNING'),
            'propagate': False,
        },
    },
}
