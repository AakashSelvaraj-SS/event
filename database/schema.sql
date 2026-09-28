-- Database Schema for AI Document Extractor

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS processing_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_name TEXT,
    status TEXT DEFAULT 'active', -- 'active', 'completed', 'archived'
    is_current INTEGER DEFAULT 1, -- 1 for active session, 0 for past
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    original_filename TEXT NOT NULL,
    stored_filename TEXT NOT NULL,
    file_type TEXT NOT NULL, -- 'image', 'pdf'
    file_size INTEGER DEFAULT 0,
    status TEXT DEFAULT 'uploaded', -- 'uploaded', 'processed', 'failed'
    doc_type TEXT DEFAULT 'Other', -- 'Income Certificate', 'Community Certificate', etc.
    detected_language TEXT DEFAULT 'English',
    qr_status TEXT DEFAULT 'QR Not Found', -- 'Verified', 'Data Mismatch', 'QR Not Found', 'Unreadable QR'
    qr_data TEXT,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES processing_sessions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS extracted_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    document_id INTEGER NOT NULL,
    field_key TEXT NOT NULL,
    field_label TEXT NOT NULL,
    extracted_value TEXT,
    confidence_score REAL DEFAULT 0.0,
    is_edited INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES processing_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS selected_attributes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    attribute_key TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    FOREIGN KEY (session_id) REFERENCES processing_sessions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS saved_analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_id INTEGER,
    report_title TEXT NOT NULL,
    analytics_json TEXT NOT NULL,
    excel_filename TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
