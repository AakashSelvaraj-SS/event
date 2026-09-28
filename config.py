import os

# Base directory of the project
BASE_DIR = os.path.abspath(os.path.dirname(__file__))

class Config:
    """Application configuration settings."""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'smartdocai-super-secret-academic-key-2026'
    
    # Upload & Storage paths
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
    PROCESSED_FOLDER = os.path.join(BASE_DIR, 'processed')
    GENERATED_EXCEL_FOLDER = os.path.join(BASE_DIR, 'generated_excel')
    REPORTS_FOLDER = os.path.join(BASE_DIR, 'reports')
    DATABASE_PATH = os.path.join(BASE_DIR, 'database', 'database.db')
    
    # Allowed document formats
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf'}
    
    # Maximum upload file size: 16 MB
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024
    
    # OCR settings
    SUPPORTED_LANGUAGES = {
        'en': 'English',
        'hi': 'Hindi',
        'ta': 'Tamil',
        'te': 'Telugu',
        'ml': 'Malayalam',
        'kn': 'Kannada'
    }
    DEFAULT_OCR_LANGUAGES = ['en', 'hi', 'ta']

    # Standard extractable attributes
    AVAILABLE_ATTRIBUTES = [
        {"id": "name", "label": "Full Name / Student Name", "category": "Personal"},
        {"id": "parent_name", "label": "Parent / Guardian Name", "category": "Personal"},
        {"id": "dob", "label": "Date of Birth", "category": "Personal"},
        {"id": "gender", "label": "Gender", "category": "Personal"},
        {"id": "income", "label": "Annual / Family Income", "category": "Financial"},
        {"id": "community", "label": "Community / Caste (BC/MBC/SC/ST/OC)", "category": "Demographic"},
        {"id": "certificate_no", "label": "Certificate / Application Number", "category": "Official"},
        {"id": "issue_date", "label": "Issue Date", "category": "Official"},
        {"id": "address", "label": "Address / Residence", "category": "Location"},
        {"id": "id_number", "label": "ID / Aadhaar / Passport / DL Number", "category": "Official"},
        {"id": "reg_no", "label": "Register / Roll Number", "category": "Academic"},
        {"id": "marks", "label": "Subject Marks / Grades", "category": "Academic"},
        {"id": "total_marks", "label": "Total Marks", "category": "Academic"},
        {"id": "percentage", "label": "Percentage / CGPA", "category": "Academic"}
    ]
