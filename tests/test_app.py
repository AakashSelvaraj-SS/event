import os
import pytest
import tempfile
import io
import uuid
import openpyxl
from werkzeug.security import generate_password_hash, check_password_hash

from app import app
from database.db import (
    init_db, create_user, get_user_by_username, get_or_create_current_session,
    reset_user_session, add_document, get_session_documents,
    save_extracted_records, get_session_extracted_records,
    save_selected_attributes, get_selected_attributes
)
from utils.language_detection import detect_language
from utils.document_detection import detect_document_type
from utils.extraction import extract_field, extract_all_attributes
from utils.excel_generator import generate_custom_excel
from utils.analytics import compute_session_analytics

@pytest.fixture
def client():
    app.config['TESTING'] = True
    app.config['SECRET_KEY'] = 'test-secret-key'
    
    with app.test_client() as client:
        with app.app_context():
            init_db()
        yield client

def test_user_registration_and_hash():
    """Test creating user and verifying password hash."""
    unique_user = f"user_{uuid.uuid4().hex[:6]}"
    pwd = "SecretPassword123"
    pwd_hash = generate_password_hash(pwd)
    
    assert check_password_hash(pwd_hash, pwd) is True
    assert check_password_hash(pwd_hash, "WrongPassword") is False
    
    user_id = create_user(unique_user, f"{unique_user}@example.com", pwd_hash, "Test User")
    assert user_id is not None
    
    user = get_user_by_username(unique_user)
    assert user is not None
    assert user['full_name'] == "Test User"

def test_language_detection():
    """Test multi-language script detection."""
    eng_text = "This is a government of India certificate"
    lang, conf = detect_language(eng_text)
    assert lang == "English"
    
    tamil_text = "இது வருமானச் சான்றிதழ் ஆகும்"
    lang, conf = detect_language(tamil_text)
    assert lang == "Tamil"
    
    hindi_text = "यह आय प्रमाण पत्र है"
    lang, conf = detect_language(hindi_text)
    assert lang == "Hindi"

def test_document_type_detection():
    """Test document classification signatures."""
    income_sample = "GOVERNMENT OF TAMIL NADU REVENUE DEPARTMENT INCOME CERTIFICATE Annual Income: Rs 120000"
    doc_type, conf = detect_document_type(income_sample)
    assert doc_type == "Income Certificate"
    
    caste_sample = "COMMUNITY CERTIFICATE This is to certify that applicant belongs to Backward Class (BC)"
    doc_type, conf = detect_document_type(caste_sample)
    assert doc_type == "Community Certificate"

def test_information_extraction():
    """Test extraction of specific attributes with normalization."""
    sample_text = """
    Applicant Name: Rahul Kumar
    Father's Name: Suresh Kumar
    Date of Birth: 15-08-2000
    Annual Income: Rs. 1,50,000/-
    Community: MBC
    Certificate No: TN-2024-88992
    """
    extracted = extract_all_attributes(sample_text)
    
    assert extracted['name']['value'] == "Rahul Kumar"
    assert extracted['parent_name']['value'] == "Suresh Kumar"
    assert extracted['dob']['value'] == "15-08-2000"
    assert extracted['income']['value'] == "150000"
    assert extracted['community']['value'] == "MBC"
    assert extracted['certificate_no']['value'] == "TN-2024-88992"

def test_excel_generator_with_selected_columns(tmp_path):
    """Test generating .xlsx containing only selected attributes."""
    documents_data = [
        {
            'fields': {
                'name': 'Rahul Kumar',
                'income': '150000',
                'community': 'BC',
                'certificate_no': 'TN-101'
            }
        },
        {
            'fields': {
                'name': 'Priya S',
                'income': '90000',
                'community': 'MBC',
                'certificate_no': 'TN-102'
            }
        }
    ]
    
    selected_attributes = ['name', 'income', 'community']
    file_path, filename, records_count, cols_count = generate_custom_excel(
        session_id=1,
        documents_data=documents_data,
        selected_attribute_keys=selected_attributes
    )
    
    assert os.path.exists(file_path)
    assert records_count == 2
    assert cols_count == 3
    
    wb = openpyxl.load_workbook(file_path)
    ws = wb.active
    header_values = [cell.value for cell in ws[1]]
    assert len(header_values) == 3
    wb.close()

def test_session_analytics_computation():
    """Test analytics calculations."""
    docs = [
        {'id': 1, 'status': 'processed', 'doc_type': 'Income Certificate', 'detected_language': 'English', 'qr_status': 'Verified'},
        {'id': 2, 'status': 'processed', 'doc_type': 'Community Certificate', 'detected_language': 'Tamil', 'qr_status': 'QR Not Found'}
    ]
    records = [
        {'field_key': 'income', 'extracted_value': '120000', 'confidence_score': 95.0},
        {'field_key': 'community', 'extracted_value': 'MBC', 'confidence_score': 92.0}
    ]
    
    analytics = compute_session_analytics(docs, records)
    assert analytics['total_documents'] == 2
    assert analytics['successful_documents'] == 2
    assert analytics['qr_verified_count'] == 1
    assert analytics['doc_type_distribution']['Income Certificate'] == 1
    assert analytics['language_distribution']['Tamil'] == 1
