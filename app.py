import os
import json
from flask import Flask, render_template, request, redirect, url_for, flash, session, send_from_directory, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps

from config import Config
from database.db import (
    init_db, create_user, get_user_by_username, get_user_by_id,
    get_or_create_current_session, reset_user_session,
    add_document, get_session_documents, update_document_processing, delete_document,
    save_extracted_records, get_session_extracted_records, update_extracted_value,
    save_selected_attributes, get_selected_attributes, save_analytics_report
)
from utils.helpers import (
    allowed_file, generate_unique_filename, get_file_type,
    format_file_size, ensure_app_directories
)
from utils.preprocessing import preprocess_image
from utils.ocr import perform_ocr
from utils.language_detection import detect_language, get_ocr_languages
from utils.document_detection import detect_document_type
from utils.extraction import extract_all_attributes
from utils.qr_verification import detect_and_decode_qr, verify_qr_data_consistency
from utils.excel_generator import generate_custom_excel
from utils.analytics import compute_session_analytics, generate_analytics_html_report

# Initialize Flask application
app = Flask(__name__)
app.config.from_object(Config)

# Ensure runtime directories & database schema exist
ensure_app_directories()
init_db()

# Login Required Decorator
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please log in to access this page.', 'warning')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

# Context Processor for Global Template Data
@app.context_processor
def inject_global_data():
    current_user = None
    if 'user_id' in session:
        current_user = get_user_by_id(session['user_id'])
    return {
        'current_user': current_user,
        'app_name': 'AI Document Extractor'
    }

# ==================================================
# AUTHENTICATION ROUTES
# ==================================================

@app.route('/')
def index():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
        
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '')

        if not username or not password:
            flash('Please provide both username and password.', 'danger')
            return render_template('login.html')

        user = get_user_by_username(username)
        if user and check_password_hash(user['password_hash'], password):
            session.clear()
            session['user_id'] = user['id']
            session['username'] = user['username']
            session['full_name'] = user['full_name']
            flash(f"Welcome back, {user['full_name']}!", 'success')
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid username or password. Please try again.', 'danger')

    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))

    if request.method == 'POST':
        full_name = request.form.get('full_name', '').strip()
        username = request.form.get('username', '').strip()
        email = request.form.get('email', '').strip()
        password = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')

        # Validations
        if not full_name or not username or not email or not password:
            flash('All fields are required.', 'danger')
            return render_template('register.html')

        if password != confirm_password:
            flash('Passwords do not match.', 'danger')
            return render_template('register.html')

        if len(password) < 6:
            flash('Password must be at least 6 characters.', 'danger')
            return render_template('register.html')

        # Check existing username
        if get_user_by_username(username):
            flash('Username is already taken. Please choose another.', 'warning')
            return render_template('register.html')

        password_hash = generate_password_hash(password)
        user_id = create_user(username, email, password_hash, full_name)

        if user_id:
            flash('Account created successfully! You can now log in.', 'success')
            return redirect(url_for('login'))
        else:
            flash('Registration failed. Email or username might already exist.', 'danger')

    return render_template('register.html')

@app.route('/logout')
def logout():
    session.clear()
    flash('You have been logged out securely.', 'info')
    return redirect(url_for('login'))

# ==================================================
# DASHBOARD & MAIN WORKFLOW
# ==================================================

@app.route('/dashboard')
@login_required
def dashboard():
    user_id = session['user_id']
    curr_session = get_or_create_current_session(user_id)
    documents = get_session_documents(curr_session['id'])
    extracted_records = get_session_extracted_records(curr_session['id'])
    analytics = compute_session_analytics(documents, extracted_records)
    
    return render_template(
        'dashboard.html',
        session_info=curr_session,
        documents=documents,
        analytics=analytics
    )

# ==================================================
# DOCUMENT UPLOAD MODULE
# ==================================================

@app.route('/upload', methods=['GET', 'POST'])
@login_required
def upload():
    user_id = session['user_id']
    curr_session = get_or_create_current_session(user_id)
    session_id = curr_session['id']

    if request.method == 'POST':
        if 'documents' not in request.files:
            flash('No files were uploaded.', 'danger')
            return redirect(url_for('upload'))

        files = request.files.getlist('documents')
        if not files or files[0].filename == '':
            flash('Please select at least one document.', 'warning')
            return redirect(url_for('upload'))

        uploaded_count = 0
        for file in files:
            if file and allowed_file(file.filename):
                original_filename = file.filename
                stored_filename = generate_unique_filename(original_filename)
                save_path = os.path.join(Config.UPLOAD_FOLDER, stored_filename)
                file.save(save_path)

                file_size = os.path.getsize(save_path)
                file_type = get_file_type(original_filename)

                add_document(session_id, original_filename, stored_filename, file_type, file_size)
                uploaded_count += 1
            else:
                flash(f'Skipped invalid file format: {file.filename}', 'warning')

        if uploaded_count > 0:
            flash(f'Successfully uploaded {uploaded_count} document(s)! Now select your required Excel attributes.', 'success')
            return redirect(url_for('attributes'))

    documents = get_session_documents(session_id)
    return render_template('upload.html', documents=documents, session_info=curr_session)

@app.route('/delete-document/<int:doc_id>', methods=['POST'])
@login_required
def delete_doc(doc_id):
    user_id = session['user_id']
    curr_session = get_or_create_current_session(user_id)
    doc = delete_document(doc_id, curr_session['id'])
    if doc:
        flash(f"Document '{doc['original_filename']}' removed.", 'info')
    return redirect(url_for('upload'))

# ==================================================
# ATTRIBUTE SELECTION MODULE
# ==================================================

@app.route('/attributes', methods=['GET', 'POST'])
@login_required
def attributes():
    user_id = session['user_id']
    curr_session = get_or_create_current_session(user_id)
    session_id = curr_session['id']

    documents = get_session_documents(session_id)
    if not documents:
        flash('Please upload at least one document before selecting attributes.', 'warning')
        return redirect(url_for('upload'))

    if request.method == 'POST':
        selected_attrs = request.form.getlist('attributes')
        if not selected_attrs:
            flash('Please select at least one attribute to include in the Excel file.', 'danger')
            return render_template('attributes.html', available_attributes=Config.AVAILABLE_ATTRIBUTES, selected=[])

        save_selected_attributes(session_id, selected_attrs)
        flash('Attributes saved! Starting document processing...', 'info')
        return redirect(url_for('process_documents'))

    existing_selected = get_selected_attributes(session_id)
    if not existing_selected:
        # Default selections
        existing_selected = ['name', 'parent_name', 'dob', 'income', 'community', 'certificate_no']

    return render_template(
        'attributes.html',
        available_attributes=Config.AVAILABLE_ATTRIBUTES,
        selected=existing_selected,
        total_docs=len(documents)
    )

# ==================================================
# PROCESSING PIPELINE (PREPROCESSING + OCR + EXTRACTION + QR)
# ==================================================

@app.route('/process', methods=['GET', 'POST'])
@login_required
def process_documents():
    user_id = session['user_id']
    curr_session = get_or_create_current_session(user_id)
    session_id = curr_session['id']

    documents = get_session_documents(session_id)
    if not documents:
        flash('No documents to process. Please upload files first.', 'warning')
        return redirect(url_for('upload'))

    selected_attrs = get_selected_attributes(session_id)
    if not selected_attrs:
        return redirect(url_for('attributes'))

    # Process all uploaded documents
    for doc in documents:
        try:
            raw_path = os.path.join(Config.UPLOAD_FOLDER, doc['stored_filename'])
            file_type = doc['file_type']

            # Step 1: Image Preprocessing (OpenCV)
            if file_type == 'image':
                proc_path, proc_img_arr = preprocess_image(raw_path)
            else:
                proc_path = raw_path
                proc_img_arr = None

            # Step 2: OCR Extraction (EasyOCR / PyPDF2)
            ocr_text, ocr_conf, _ = perform_ocr(proc_path, file_type, ['en'])

            # Step 3: Language Detection
            detected_lang, lang_conf = detect_language(ocr_text)

            # Step 4: Document Type Detection
            doc_type, type_conf = detect_document_type(ocr_text)

            # Step 5: Information Extraction
            extracted_fields = extract_all_attributes(ocr_text, doc_type)

            # Step 6: QR Code Detection & Consistency Verification
            qr_found, qr_decoded, _ = detect_and_decode_qr(proc_path if file_type == 'image' else raw_path)
            qr_verif = verify_qr_data_consistency(qr_decoded, extracted_fields)

            # Step 7: Update Document in Database
            update_document_processing(
                doc_id=doc['id'],
                status='processed',
                doc_type=doc_type,
                detected_language=detected_lang,
                qr_status=qr_verif['status'],
                qr_data=qr_verif['qr_data']
            )

            # Step 8: Save Extracted Records to Database
            save_extracted_records(session_id, doc['id'], extracted_fields)

        except Exception as e:
            print(f"Error processing document #{doc['id']}: {e}")
            update_document_processing(
                doc_id=doc['id'],
                status='failed',
                doc_type='Unknown',
                detected_language='English',
                qr_status='Error',
                error_msg=str(e)
            )

    flash('All documents processed successfully! Review and edit values below before generating your Excel.', 'success')
    return redirect(url_for('preview'))

# ==================================================
# EDITABLE PREVIEW MODULE
# ==================================================

@app.route('/preview')
@login_required
def preview():
    user_id = session['user_id']
    curr_session = get_or_create_current_session(user_id)
    session_id = curr_session['id']

    documents = get_session_documents(session_id)
    selected_attrs = get_selected_attributes(session_id)
    extracted_records = get_session_extracted_records(session_id)

    if not extracted_records:
        flash('No extracted data found. Please run the document processing step.', 'warning')
        return redirect(url_for('upload'))

    # Group extracted records by document ID
    doc_records_map = {}
    for r in extracted_records:
        d_id = r['document_id']
        if d_id not in doc_records_map:
            doc_records_map[d_id] = {
                'doc_info': {
                    'id': d_id,
                    'filename': r['original_filename'],
                    'doc_type': r['doc_type'],
                    'language': r['detected_language'],
                    'qr_status': r['qr_status']
                },
                'fields': {}
            }
        doc_records_map[d_id]['fields'][r['field_key']] = {
            'record_id': r['id'],
            'label': r['field_label'],
            'value': r['extracted_value'] or '',
            'confidence': float(r['confidence_score'] or 0.0),
            'is_edited': r['is_edited']
        }

    return render_template(
        'preview.html',
        doc_records_map=doc_records_map,
        selected_attrs=selected_attrs,
        available_attributes=Config.AVAILABLE_ATTRIBUTES,
        session_info=curr_session
    )

@app.route('/save-preview', methods=['POST'])
@login_required
def save_preview():
    """Save inline table modifications sent by the user."""
    try:
        data = request.get_json()
        if not data or 'records' not in data:
            return jsonify({'success': False, 'message': 'Invalid payload'}), 400

        for item in data['records']:
            rec_id = item.get('record_id')
            new_val = item.get('value', '').strip()
            if rec_id:
                update_extracted_value(rec_id, new_val)

        return jsonify({'success': True, 'message': 'All changes saved successfully!'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# ==================================================
# EXCEL GENERATION & DOWNLOAD MODULE
# ==================================================

@app.route('/generate-excel', methods=['POST', 'GET'])
@login_required
def generate_excel():
    user_id = session['user_id']
    curr_session = get_or_create_current_session(user_id)
    session_id = curr_session['id']

    documents = get_session_documents(session_id)
    selected_attrs = get_selected_attributes(session_id)
    extracted_records = get_session_extracted_records(session_id)

    if not extracted_records:
        flash('No extracted data to generate Excel. Please process documents first.', 'warning')
        return redirect(url_for('upload'))

    # Assemble structured document records
    docs_data_dict = {}
    for r in extracted_records:
        d_id = r['document_id']
        if d_id not in docs_data_dict:
            docs_data_dict[d_id] = {'fields': {}}
        docs_data_dict[d_id]['fields'][r['field_key']] = r['extracted_value'] or ''

    documents_data = list(docs_data_dict.values())

    file_path, filename, total_records, total_cols = generate_custom_excel(
        session_id=session_id,
        documents_data=documents_data,
        selected_attribute_keys=selected_attrs
    )

    session['latest_excel_filename'] = filename

    flash(f"Editable Excel file generated with {total_records} record(s) and {total_cols} selected column(s)!", 'success')
    return redirect(url_for('excel_view', filename=filename))

@app.route('/excel')
@login_required
def excel_view():
    filename = request.args.get('filename') or session.get('latest_excel_filename')
    if not filename:
        flash('No Excel file generated yet.', 'warning')
        return redirect(url_for('dashboard'))

    user_id = session['user_id']
    curr_session = get_or_create_current_session(user_id)
    session_id = curr_session['id']
    
    documents = get_session_documents(session_id)
    selected_attrs = get_selected_attributes(session_id)
    file_path = os.path.join(Config.GENERATED_EXCEL_FOLDER, filename)
    file_size = os.path.getsize(file_path) if os.path.exists(file_path) else 0

    return render_template(
        'excel.html',
        filename=filename,
        file_size_formatted=format_file_size(file_size),
        total_records=len(documents),
        total_columns=len(selected_attrs),
        selected_attrs=selected_attrs
    )

@app.route('/download-excel/<path:filename>')
@login_required
def download_excel(filename):
    return send_from_directory(Config.GENERATED_EXCEL_FOLDER, filename, as_attachment=True)

# ==================================================
# SESSION ANALYTICS MODULE
# ==================================================

@app.route('/analytics')
@login_required
def analytics():
    user_id = session['user_id']
    curr_session = get_or_create_current_session(user_id)
    session_id = curr_session['id']

    documents = get_session_documents(session_id)
    extracted_records = get_session_extracted_records(session_id)
    analytics_data = compute_session_analytics(documents, extracted_records)

    return render_template(
        'analytics.html',
        analytics=analytics_data,
        analytics_json=json.dumps(analytics_data),
        session_info=curr_session
    )

@app.route('/save-analytics', methods=['POST'])
@login_required
def save_analytics():
    user_id = session['user_id']
    curr_session = get_or_create_current_session(user_id)
    session_id = curr_session['id']

    documents = get_session_documents(session_id)
    extracted_records = get_session_extracted_records(session_id)
    analytics_data = compute_session_analytics(documents, extracted_records)

    title = request.form.get('report_title', f"Analytics Report - Session #{session_id}")
    report_path, report_filename = generate_analytics_html_report(
        user_name=session.get('full_name', 'User'),
        session_id=session_id,
        analytics_data=analytics_data
    )

    save_analytics_report(
        user_id=user_id,
        session_id=session_id,
        title=title,
        analytics_json=json.dumps(analytics_data),
        excel_filename=session.get('latest_excel_filename')
    )

    flash(f"Analytics report successfully saved as '{report_filename}'.", 'success')
    return send_from_directory(Config.REPORTS_FOLDER, report_filename, as_attachment=True)

# ==================================================
# NEW UPLOAD / SESSION REFRESH MODULE
# ==================================================

@app.route('/new-upload', methods=['POST'])
@login_required
def new_upload():
    user_id = session['user_id']
    new_session_id = reset_user_session(user_id)
    session.pop('latest_excel_filename', None)
    flash('New session started. Old session data and analytics have been refreshed.', 'info')
    return redirect(url_for('upload'))

# ==================================================
# SETTINGS MODULE
# ==================================================

@app.route('/settings', methods=['GET', 'POST'])
@login_required
def settings():
    user_id = session['user_id']
    user = get_user_by_id(user_id)

    if request.method == 'POST':
        flash('Settings updated successfully.', 'success')

    return render_template('settings.html', user=user, supported_languages=Config.SUPPORTED_LANGUAGES)

# Application Runner
if __name__ == '__main__':
    print("=" * 60)
    print(" AI DOCUMENT EXTRACTOR - Academic Edition")
    print(" Server starting on http://127.0.0.1:5000")
    print("=" * 60)
    app.run(host='127.0.0.1', port=5000, debug=True)
