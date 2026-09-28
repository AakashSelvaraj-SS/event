import re

# Comprehensive keywords and patterns for various document types across languages
DOCUMENT_SIGNATURES = {
    'Income Certificate': {
        'keywords': [
            'income certificate', 'annual income', 'family income', 'income per annum',
            'revenue department', 'tahsildar', 'taluk', 'revenue divisional officer',
            'வருமானச் சான்றிதழ்', 'வருமானம்', 'வருமான சான்றிதழ்',
            'आय प्रमाण पत्र', 'वार्षिक आय', 'पारिवारिक आय',
            'ఆదాయ ధ్రువీకరణ పత్రం', 'ఆదాయం',
            'வருமானம்'
        ],
        'patterns': [
            r'income\s*(?:certificate|statement|details)',
            r'annual\s*income\s*(?:of|is|:)?',
            r'rs\.?\s*[\d,]+(?:\s*\/\-|\s*per annum)'
        ],
        'weight': 1.2
    },
    'Community Certificate': {
        'keywords': [
            'community certificate', 'caste certificate', 'backward class', 'most backward class',
            'scheduled caste', 'scheduled tribe', 'denotified community', 'obc', 'sc/st', 'mbc', 'bc',
            'சாதிச் சான்றிதழ்', 'சமூகச் சான்றிதழ்', 'பிற்படுத்தப்பட்டோர்', 'மிகவும் பிற்படுத்தப்பட்டோர்',
            'जाति प्रमाण पत्र', 'समुदाय प्रमाण पत्र', 'अनुसूचित जाति', 'अनुसूचित जनजाति',
            'కుల ధ్రువీకరణ పత్రం'
        ],
        'patterns': [
            r'(?:community|caste)\s*(?:certificate|details)',
            r'belongs\s*to\s*(?:the\s*)?(?:bc|mbc|sc|st|obc|general|caste)',
            r'recognized\s*as\s*(?:a\s*)?backward\s*class'
        ],
        'weight': 1.2
    },
    'Residence Certificate': {
        'keywords': [
            'residence certificate', 'domicile certificate', 'nativity certificate', 'residential certificate',
            'permanent resident', 'ordinarily resident', 'village administrative officer',
            'இருப்பிடச் சான்றிதழ்', 'குடியிருப்பு சான்றிதழ்',
            'निवास प्रमाण पत्र', 'मूल निवास'
        ],
        'patterns': [
            r'(?:residence|domicile|nativity)\s*certificate',
            r'is\s*a\s*(?:permanent\s*)?resident\s*of'
        ],
        'weight': 1.1
    },
    'Birth Certificate': {
        'keywords': [
            'birth certificate', 'date of birth', 'place of birth', 'registration of births',
            'vital statistics', 'municipal corporation', 'panchayat', 'hospital',
            'பிறப்புச் சான்றிதழ்', 'பிறந்த தேதி',
            'जन्म प्रमाण पत्र', 'जन्म तिथि',
            'పుట్టిన తేదీ ధ్రువీకరణ పత్రం'
        ],
        'patterns': [
            r'birth\s*certificate',
            r'form\s*no\.?\s*5\s*birth',
            r'registered\s*under\s*section\s*12\/17'
        ],
        'weight': 1.2
    },
    'Marksheet': {
        'keywords': [
            'statement of marks', 'mark sheet', 'grade card', 'academic transcript',
            'board of higher secondary', 'board of secondary education', 'controller of examinations',
            'semester', 'subject code', 'credits', 'cgpa', 'total marks', 'percentage', 'pass', 'distinction',
            'மதிப்பெண் சான்றிதழ்', 'அங்கீகரிக்கப்பட்ட',
            'अंक पत्र', 'अंक तालिका', 'परीक्षा परिणाम'
        ],
        'patterns': [
            r'statement\s*of\s*(?:marks|grades)',
            r'mark\s*sheet',
            r'roll\s*(?:no|number)\s*[:.]',
            r'subject(?:\s*code|\s*name)'
        ],
        'weight': 1.3
    },
    'Aadhaar': {
        'keywords': [
            'unique identification authority of india', 'uidai', 'government of india',
            'aadhaar', 'aadhar', 'मेरा आधार मेरी पहचान', 'enrollment no', 'vid:', 'help@uidai.gov.in'
        ],
        'patterns': [
            r'\b\d{4}\s\d{4}\s\d{4}\b',
            r'uidai|aadhaar|aadhar'
        ],
        'weight': 1.4
    },
    'Passport': {
        'keywords': [
            'passport', 'republic of india', 'ministry of external affairs', 'given names',
            'surname', 'nationality indian', 'type p', 'code ind', 'place of issue'
        ],
        'patterns': [
            r'passport\s*no',
            r'republic\s*of\s*india\s*passport',
            r'p<ind[a-z0-9<]+'
        ],
        'weight': 1.4
    },
    'Driving Licence': {
        'keywords': [
            'driving licence', 'driving license', 'motor vehicles act', 'transport department',
            'licensing authority', 'valid till', 'non-transport', 'lmv', 'mcwg'
        ],
        'patterns': [
            r'driving\s*licen[cs]e',
            r'dl\s*no\.?\s*[:.]?\s*[a-z0-9/-]+',
            r'form\s*7\s*driving'
        ],
        'weight': 1.3
    }
}

def detect_document_type(text):
    """
    Classify the document type from OCR extracted text.
    
    Returns:
        tuple: (document_type_string, confidence_percentage)
    """
    if not text or not text.strip():
        return 'Other', 50.0

    lower_text = text.lower()
    scores = {}

    for doc_type, info in DOCUMENT_SIGNATURES.items():
        score = 0
        weight = info.get('weight', 1.0)
        
        # Keyword matching
        for kw in info['keywords']:
            if kw.lower() in lower_text:
                score += (15 * weight)
                
        # Regex pattern matching
        for pat in info['patterns']:
            if re.search(pat, lower_text, re.IGNORECASE):
                score += (25 * weight)

        scores[doc_type] = score

    best_type = max(scores, key=scores.get)
    best_score = scores[best_type]

    if best_score >= 25:
        confidence = min(98.0, 60.0 + (best_score / 2.0))
        return best_type, round(confidence, 1)
    
    return 'Other', 60.0
