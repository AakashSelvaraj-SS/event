import re
from datetime import datetime

# Regex and extraction patterns for diverse official document formats
PATTERNS = {
    'name': [
        r"(?:name\s*of\s*(?:the\s*)?applicant|applicant\s*name|candidate\s*name|student\s*name|full\s*name|name)\s*[:.\-]?[ \t]*([A-Za-z\.[ \t]]{2,40})",
        r"(?:this\s*is\s*to\s*certify\s*that|certify\s*that\s*(?:selvi|selvan|shri|smt|mr|ms|mrs)?\.?[ \t]*)([A-Za-z\.[ \t]]{2,40})",
        r"பெயர்\s*[:.\-]?\s*([^\n\r,]+)",
        r"नाम\s*[:.\-]?\s*([^\n\r,]+)",
        r"పేరు\s*[:.\-]?\s*([^\n\r,]+)"
    ],
    'parent_name': [
        r"(?:father(?:'s)?\s*name|mother(?:'s)?\s*name|parent(?:'s)?\s*name|guardian(?:'s)?\s*name|s\/o|d\/o|w\/o|c\/o)\s*[:.\-]?[ \t]*([A-Za-z\.[ \t]]{2,40})",
        r"(?:son\s*of|daughter\s*of|wife\s*of|ward\s*of)\s*(?:thiru|smt|shri|mr|ms)?\.?[ \t]*([A-Za-z\.[ \t]]{2,40})",
        r"தந்தை\s*பெயர்\s*[:.\-]?\s*([^\n\r,]+)",
        r"पिता\s*का\s*नाम\s*[:.\-]?\s*([^\n\r,]+)"
    ],
    'dob': [
        r"(?:date\s*of\s*birth|d\.?o\.?b\.?|birth\s*date)\s*[:.\-]?[ \t]*(\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4})",
        r"(\b\d{1,2}[-/\.]\d{1,2}[-/\.]\d{4}\b)",
        r"பிறந்த\s*தேதி\s*[:.\-]?[ \t]*(\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4})",
        r"जन्म\s*तिथि\s*[:.\-]?[ \t]*(\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4})"
    ],
    'gender': [
        r"(?:gender|sex)\s*[:.\-]?[ \t]*(male|female|transgender|m|f)\b",
        r"\b(male|female|transgender)\b",
        r"பாலினம்\s*[:.\-]?[ \t]*(ஆண்|பெண்|மற்றவை)",
        r"लिंग\s*[:.\-]?[ \t]*(पुरुष|महिला)"
    ],
    'income': [
        r"(?:annual\s*income|family\s*income|total\s*income|income\s*per\s*annum|income)\s*(?:is|of)?\s*[:.\-]?[ \t]*(?:rs\.?|inr|₹)?[ \t]*([\d,]+(?:\.\d{2})?)",
        r"(?:rs\.?|₹)[ \t]*([\d,]+)\s*(?:\/\-|\s*per annum|\s*only)",
        r"வருமானம்\s*[:.\-]?[ \t]*(?:ரூ\.?)?[ \t]*([\d,]+)",
        r"वार्षिक\s*आय\s*[:.\-]?[ \t]*(?:रु\.?)?[ \t]*([\d,]+)"
    ],
    'community': [
        r"(?:community|caste|category)\s*[:.\-]?[ \t]*([A-Za-z0-9\(\)[ \t]\/\-]{2,30})",
        r"\b(BC|MBC|SC|ST|OC|OBC|EWS|General|BCC|BCM|DNC|Denotified Tribe)\b",
        r"சாதி\s*[:.\-]?[ \t]*([^\n\r,]+)",
        r"சமூகப்\s*பிரிவு\s*[:.\-]?[ \t]*([^\n\r,]+)",
        r"समुदाय|जाति\s*[:.\-]?[ \t]*([^\n\r,]+)"
    ],
    'certificate_no': [
        r"(?:certificate\s*no|cert\s*no|application\s*no|ref\s*no|document\s*no|token\s*no)\s*[:.\-]?[ \t]*([A-Za-z0-9\/-]{4,30})",
        r"([A-Z]{2,4}\/\d{4}\/\d{4,10})",
        r"சான்றிதழ்\s*எண்\s*[:.\-]?[ \t]*([A-Za-z0-9\/-]+)",
        r"प्रमाण\s*पत्र\s*संख्या\s*[:.\-]?[ \t]*([A-Za-z0-9\/-]+)"
    ],
    'issue_date': [
        r"(?:date\s*of\s*issue|issued\s*on|issue\s*date|date)\s*[:.\-]?[ \t]*(\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4})",
        r"வழங்கப்பட்ட\s*நாள்\s*[:.\-]?[ \t]*(\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4})",
        r"जारी\s*करने\s*की\s*तिथि\s*[:.\-]?[ \t]*(\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4})"
    ],
    'address': [
        r"(?:address|residence|residing\s*at|permanent\s*address)\s*[:.\-]?[ \t]*([A-Za-z0-9[ \t],\.\-\/#]{10,120})",
        r"முகவரி\s*[:.\-]?[ \t]*([^\n\r]+)",
        r"पता\s*[:.\-]?[ \t]*([^\n\r]+)"
    ],
    'id_number': [
        r"\b(\d{4}\s\d{4}\s\d{4})\b",
        r"\b([A-Z]{1}[0-9]{7})\b",
        r"\b([A-Z]{2}[0-9]{2}\s?[0-9]{11})\b",
        r"\b([A-Z]{5}[0-9]{4}[A-Z]{1})\b"
    ],
    'reg_no': [
        r"(?:register\s*no|registration\s*no|reg\.?\s*no|roll\s*no|hall\s*ticket\s*no|enrollment\s*no)\s*[:.\-]?[ \t]*([A-Za-z0-9\/-]{4,25})",
        r"பதிவு\s*எண்\s*[:.\-]?[ \t]*([A-Za-z0-9]+)",
        r"अनुक्रमांक\s*[:.\-]?[ \t]*([A-Za-z0-9]+)"
    ],
    'marks': [
        r"(?:marks\s*obtained|total\s*marks|subject\s*marks)\s*[:.\-]?[ \t]*([A-Za-z0-9[ \t],\/:]{4,60})"
    ],
    'total_marks': [
        r"(?:grand\s*total|total\s*marks|total|aggregate)\s*[:.\-]?[ \t]*(\d{2,4}\s*(?:\/\s*\d{2,4})?)",
        r"மொத்த\s*மதிப்பெண்\s*[:.\-]?[ \t]*(\d+)"
    ],
    'percentage': [
        r"(?:percentage|cgpa|gpa|marks\s*%)\s*[:.\-]?[ \t]*([\d\.]+\s*(?:%|\/\s*10)?)",
        r"(\b\d{1,2}(?:\.\d{1,2})?\s*%\b)"
    ]
}

def normalize_income(val):
    if not val:
        return ""
    cleaned = re.sub(r'[^\d]', '', val)
    if cleaned:
        try:
            num = int(cleaned)
            return str(num)
        except ValueError:
            return cleaned
    return val

def normalize_community(val):
    if not val:
        return ""
    up = val.strip().upper()
    if 'MBC' in up or 'MOST BACKWARD' in up or 'மிகவும்' in up:
        return 'MBC'
    elif 'BCM' in up or 'BC MUSLIM' in up:
        return 'BCM'
    elif 'BC' in up or 'BACKWARD' in up or 'OBC' in up or 'பிற்படுத்தப்பட்டோர்' in up:
        return 'BC'
    elif 'SC' in up or 'SCHEDULED CASTE' in up or 'தாழ்த்தப்பட்டோர்' in up:
        return 'SC'
    elif 'ST' in up or 'SCHEDULED TRIBE' in up or 'பழங்குடியினர்' in up:
        return 'ST'
    elif 'OC' in up or 'GENERAL' in up or 'FC' in up or 'FORWARD' in up:
        return 'OC'
    return val.strip()

def normalize_gender(val):
    if not val:
        return ""
    low = val.strip().lower()
    if low in ['m', 'male', 'ஆண்', 'पुरुष']:
        return 'Male'
    elif low in ['f', 'female', 'பெண்', 'महिला']:
        return 'Female'
    elif low in ['transgender', 'மற்றவை']:
        return 'Transgender'
    return val.title()

def extract_field(field_key, text):
    patterns = PATTERNS.get(field_key, [])
    for idx, pattern in enumerate(patterns):
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            raw_val = match.group(1).strip()
            raw_val = re.sub(r'^[ :.\-]+|[ :.\-]+$', '', raw_val)
            
            if field_key == 'income':
                raw_val = normalize_income(raw_val)
            elif field_key == 'community':
                raw_val = normalize_community(raw_val)
            elif field_key == 'gender':
                raw_val = normalize_gender(raw_val)

            base_conf = 95.0 - (idx * 5.0)
            if len(raw_val) > 1:
                conf = min(98.0, max(65.0, base_conf))
            else:
                conf = 60.0

            return {
                'value': raw_val,
                'confidence': round(conf, 1),
                'label': field_key.replace('_', ' ').title()
            }

    # Context fallback
    fallback_keywords = {
        'name': ['name', 'பெயர்', 'नाम'],
        'parent_name': ['father', 'mother', 'parent', 'guardian'],
        'dob': ['dob', 'birth', 'தேதி'],
        'income': ['income', 'வருமானம்', 'आय'],
        'community': ['community', 'caste', 'சாதி', 'जाति'],
        'certificate_no': ['certificate', 'சான்றிதழ்', 'प्रमाण']
    }
    
    keywords = fallback_keywords.get(field_key, [])
    for line in text.split('\n'):
        for kw in keywords:
            if kw.lower() in line.lower():
                parts = re.split(r'[:.\-]', line, maxsplit=1)
                if len(parts) > 1 and len(parts[1].strip()) > 1:
                    val = parts[1].strip()
                    if field_key == 'income':
                        val = normalize_income(val)
                    elif field_key == 'community':
                        val = normalize_community(val)
                    return {
                        'value': val,
                        'confidence': 72.0,
                        'label': field_key.replace('_', ' ').title()
                    }

    return {
        'value': '',
        'confidence': 0.0,
        'label': field_key.replace('_', ' ').title()
    }

def extract_all_attributes(text, doc_type='Other'):
    results = {}
    for key in PATTERNS.keys():
        results[key] = extract_field(key, text)
    return results
