import json
import re

try:
    import cv2
    import numpy as np
    HAS_CV2 = True
except ImportError:
    HAS_CV2 = False

def detect_and_decode_qr(image_path_or_array):
    """
    Detect and decode QR code in the document using OpenCV QRCodeDetector with pyzbar fallback.
    
    Returns:
        tuple: (qr_found_bool, decoded_text, points)
    """
    if not HAS_CV2:
        return False, "", None

    try:
        if isinstance(image_path_or_array, str):
            img_bytes = np.fromfile(image_path_or_array, dtype=np.uint8)
            img = cv2.imdecode(img_bytes, cv2.IMREAD_COLOR)
        else:
            img = image_path_or_array

        if img is None:
            return False, "", None

        detector = cv2.QRCodeDetector()
        decoded_text, points, _ = detector.detectAndDecode(img)

        if decoded_text and decoded_text.strip():
            return True, decoded_text.strip(), points

        # Try pyzbar fallback if available
        try:
            from pyzbar.pyzbar import decode
            barcodes = decode(img)
            for barcode in barcodes:
                if barcode.type == 'QRCODE':
                    data = barcode.data.decode('utf-8', errors='ignore').strip()
                    if data:
                        return True, data, barcode.polygon
        except ImportError:
            pass

        return False, "", None

    except Exception as e:
        print(f"QR detection note: {e}")
        return False, "", None

def verify_qr_data_consistency(qr_text, extracted_fields):
    """
    Cross-reference QR code data against extracted document fields.
    
    Returns:
        dict: {
            'status': 'Verified' | 'Data Mismatch' | 'QR Not Found' | 'QR Present (Metadata)',
            'details': str,
            'qr_data': str
        }
    """
    if not qr_text or not qr_text.strip():
        return {
            'status': 'QR Not Found',
            'details': 'No QR code was detected in the document image.',
            'qr_data': ''
        }

    qr_clean = qr_text.lower()
    matches_found = 0
    checked_fields = []

    for field_key in ['name', 'certificate_no', 'dob', 'income', 'community', 'id_number']:
        val = extracted_fields.get(field_key, {})
        field_val = val.get('value', '') if isinstance(val, dict) else str(val)
        
        if field_val and len(field_val.strip()) > 2:
            cleaned_val = field_val.strip().lower()
            if cleaned_val in qr_clean or any(part in qr_clean for part in cleaned_val.split() if len(part) > 3):
                matches_found += 1
                checked_fields.append(f"{field_key}: MATCH")

    if matches_found >= 1:
        status = 'Verified'
        details = f"Consistent data detected: {matches_found} field(s) matched between QR payload and document text."
    elif 'http' in qr_clean or 'gov' in qr_clean or len(qr_text) > 10:
        status = 'QR Present (Metadata)'
        details = "QR code contains portal URL/metadata. Local text match could not be definitively linked."
    else:
        status = 'Data Mismatch'
        details = "QR payload did not directly match the OCR extracted fields."

    return {
        'status': status,
        'details': details,
        'qr_data': qr_text[:300] + ('...' if len(qr_text) > 300 else '')
    }
