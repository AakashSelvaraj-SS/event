import sqlite3
import os
from config import Config

def get_db_connection():
    """Get a connection to the SQLite database with row factory enabled."""
    os.makedirs(os.path.dirname(Config.DATABASE_PATH), exist_ok=True)
    conn = sqlite3.connect(Config.DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db():
    """Initialize the SQLite database with the schema."""
    conn = get_db_connection()
    schema_path = os.path.join(os.path.dirname(__file__), 'schema.sql')
    with open(schema_path, 'r', encoding='utf-8') as f:
        conn.executescript(f.read())
    conn.commit()
    conn.close()

# User Management Functions
def create_user(username, email, password_hash, full_name):
    """Create a new user in the database."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO users (username, email, password_hash, full_name) VALUES (?, ?, ?, ?)",
            (username, email, password_hash, full_name)
        )
        conn.commit()
        user_id = cursor.lastrowid
        return user_id
    except sqlite3.IntegrityError:
        return None
    finally:
        conn.close()

def get_user_by_username(username):
    """Retrieve user record by username."""
    conn = get_db_connection()
    user = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
    conn.close()
    return user

def get_user_by_id(user_id):
    """Retrieve user record by ID."""
    conn = get_db_connection()
    user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    return user

# Session Management Functions
def get_or_create_current_session(user_id):
    """Get the currently active processing session for a user or create a new one."""
    conn = get_db_connection()
    session = conn.execute(
        "SELECT * FROM processing_sessions WHERE user_id = ? AND is_current = 1 ORDER BY id DESC LIMIT 1",
        (user_id,)
    ).fetchone()
    
    if not session:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO processing_sessions (user_id, session_name, status, is_current) VALUES (?, ?, 'active', 1)",
            (user_id, 'Current Session')
        )
        conn.commit()
        session_id = cursor.lastrowid
        session = conn.execute("SELECT * FROM processing_sessions WHERE id = ?", (session_id,)).fetchone()
    
    conn.close()
    return session

def reset_user_session(user_id):
    """Archive old sessions and create a brand new clean session for the user."""
    conn = get_db_connection()
    cursor = conn.cursor()
    # Mark all previous sessions as not current
    cursor.execute("UPDATE processing_sessions SET is_current = 0, status = 'completed' WHERE user_id = ?", (user_id,))
    # Create new current session
    cursor.execute(
        "INSERT INTO processing_sessions (user_id, session_name, status, is_current) VALUES (?, ?, 'active', 1)",
        (user_id, 'New Processing Session')
    )
    conn.commit()
    new_session_id = cursor.lastrowid
    conn.close()
    return new_session_id

# Document Management Functions
def add_document(session_id, original_filename, stored_filename, file_type, file_size):
    """Register an uploaded document into the database."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """INSERT INTO documents 
           (session_id, original_filename, stored_filename, file_type, file_size, status) 
           VALUES (?, ?, ?, ?, ?, 'uploaded')""",
        (session_id, original_filename, stored_filename, file_type, file_size)
    )
    conn.commit()
    doc_id = cursor.lastrowid
    conn.close()
    return doc_id

def get_session_documents(session_id):
    """Get all documents uploaded in a specific session."""
    conn = get_db_connection()
    docs = conn.execute("SELECT * FROM documents WHERE session_id = ? ORDER BY id ASC", (session_id,)).fetchall()
    conn.close()
    return docs

def update_document_processing(doc_id, status, doc_type, detected_language, qr_status, qr_data=None, error_msg=None):
    """Update a document's classification, OCR status, and QR results."""
    conn = get_db_connection()
    conn.execute(
        """UPDATE documents 
           SET status = ?, doc_type = ?, detected_language = ?, qr_status = ?, qr_data = ?, error_message = ?
           WHERE id = ?""",
        (status, doc_type, detected_language, qr_status, qr_data, error_msg, doc_id)
    )
    conn.commit()
    conn.close()

def delete_document(doc_id, session_id):
    """Delete a document from session."""
    conn = get_db_connection()
    doc = conn.execute("SELECT * FROM documents WHERE id = ? AND session_id = ?", (doc_id, session_id)).fetchone()
    if doc:
        conn.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
        conn.commit()
    conn.close()
    return doc

# Extracted Records Functions
def save_extracted_records(session_id, document_id, records_dict):
    """Save extracted key-value pairs with confidence score for a document."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Remove existing extracted records for this document to avoid duplicates
    cursor.execute("DELETE FROM extracted_records WHERE document_id = ?", (document_id,))
    
    for field_key, data in records_dict.items():
        val = data.get('value', '') if isinstance(data, dict) else str(data)
        conf = data.get('confidence', 80.0) if isinstance(data, dict) else 80.0
        label = data.get('label', field_key.replace('_', ' ').title()) if isinstance(data, dict) else field_key
        
        cursor.execute(
            """INSERT INTO extracted_records 
               (session_id, document_id, field_key, field_label, extracted_value, confidence_score) 
               VALUES (?, ?, ?, ?, ?, ?)""",
            (session_id, document_id, field_key, label, val, conf)
        )
    conn.commit()
    conn.close()

def get_session_extracted_records(session_id):
    """Get all extracted records for a session grouped by document."""
    conn = get_db_connection()
    records = conn.execute(
        """SELECT r.*, d.original_filename, d.doc_type, d.detected_language, d.qr_status
           FROM extracted_records r
           JOIN documents d ON r.document_id = d.id
           WHERE r.session_id = ?
           ORDER BY r.document_id ASC, r.id ASC""",
        (session_id,)
    ).fetchall()
    conn.close()
    return records

def update_extracted_value(record_id, new_value):
    """Update an edited value in preview."""
    conn = get_db_connection()
    conn.execute(
        "UPDATE extracted_records SET extracted_value = ?, is_edited = 1 WHERE id = ?",
        (new_value, record_id)
    )
    conn.commit()
    conn.close()

# Attribute Selection Functions
def save_selected_attributes(session_id, attribute_keys):
    """Store the list of attributes selected by user for the session."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM selected_attributes WHERE session_id = ?", (session_id,))
    for idx, key in enumerate(attribute_keys):
        cursor.execute(
            "INSERT INTO selected_attributes (session_id, attribute_key, display_order) VALUES (?, ?, ?)",
            (session_id, key, idx)
        )
    conn.commit()
    conn.close()

def get_selected_attributes(session_id):
    """Retrieve the selected attributes list for a session."""
    conn = get_db_connection()
    rows = conn.execute(
        "SELECT attribute_key FROM selected_attributes WHERE session_id = ? ORDER BY display_order ASC",
        (session_id,)
    ).fetchall()
    conn.close()
    return [r['attribute_key'] for r in rows]

# Analytics Persistence
def save_analytics_report(user_id, session_id, title, analytics_json, excel_filename):
    """Save an analytics snapshot to database history."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """INSERT INTO saved_analytics (user_id, session_id, report_title, analytics_json, excel_filename)
           VALUES (?, ?, ?, ?, ?)""",
        (user_id, session_id, title, analytics_json, excel_filename)
    )
    conn.commit()
    report_id = cursor.lastrowid
    conn.close()
    return report_id
