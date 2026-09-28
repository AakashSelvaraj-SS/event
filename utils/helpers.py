import os
import re
import uuid
from werkzeug.utils import secure_filename
from config import Config

def allowed_file(filename):
    """Check if uploaded file has a permitted extension."""
    if '.' not in filename:
        return False
    ext = filename.rsplit('.', 1)[1].lower()
    return ext in Config.ALLOWED_EXTENSIONS

def generate_unique_filename(original_filename):
    """Generate a sanitized unique filename to avoid collision."""
    sanitized = secure_filename(original_filename)
    name, ext = os.path.splitext(sanitized)
    unique_id = uuid.uuid4().hex[:8]
    return f"{name}_{unique_id}{ext}"

def get_file_type(filename):
    """Return whether the file is an 'image' or 'pdf'."""
    ext = filename.rsplit('.', 1)[1].lower()
    if ext == 'pdf':
        return 'pdf'
    return 'image'

def format_file_size(size_bytes):
    """Format file size into human-readable string (KB, MB)."""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.2f} MB"

def clean_extracted_text(text):
    """Clean and normalize OCR text output."""
    if not text:
        return ""
    # Normalize multiple whitespace
    cleaned = re.sub(r'[ \t]+', ' ', text)
    # Remove excessive blank lines
    cleaned = re.sub(r'\n\s*\n', '\n', cleaned)
    return cleaned.strip()

def ensure_app_directories():
    """Ensure all runtime directories exist."""
    dirs = [
        Config.UPLOAD_FOLDER,
        Config.PROCESSED_FOLDER,
        Config.GENERATED_EXCEL_FOLDER,
        Config.REPORTS_FOLDER,
        os.path.dirname(Config.DATABASE_PATH)
    ]
    for d in dirs:
        os.makedirs(d, exist_ok=True)
