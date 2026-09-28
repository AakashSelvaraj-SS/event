import re

# Unicode ranges for major Indian languages
SCRIPT_RANGES = {
    'Hindi': (0x0900, 0x097F),       # Devanagari
    'Tamil': (0x0B80, 0x0BFF),       # Tamil
    'Telugu': (0x0C00, 0x0C7F),      # Telugu
    'Kannada': (0x0C80, 0x0CFF),     # Kannada
    'Malayalam': (0x0D00, 0x0D7F),   # Malayalam
    'Bengali': (0x0980, 0x09FF),     # Bengali
    'Gujarati': (0x0A80, 0x0AFF),    # Gujarati
    'English': (0x0041, 0x007A)      # Basic Latin
}

LANGUAGE_EASYOCR_MAP = {
    'English': 'en',
    'Hindi': 'hi',
    'Tamil': 'ta',
    'Telugu': 'te',
    'Kannada': 'kn',
    'Malayalam': 'ml'
}

def detect_language(text):
    """
    Detect the primary language of the text based on script analysis & character distributions.
    
    Returns:
        tuple: (language_name, confidence_percentage)
    """
    if not text or not text.strip():
        return 'English', 100.0

    counts = {lang: 0 for lang in SCRIPT_RANGES}
    total_relevant_chars = 0

    for char in text:
        code = ord(char)
        for lang, (start, end) in SCRIPT_RANGES.items():
            if start <= code <= end:
                counts[lang] += 1
                total_relevant_chars += 1
                break

    if total_relevant_chars == 0:
        return 'English', 90.0

    # Find highest count
    dominant_lang = max(counts, key=counts.get)
    highest_count = counts[dominant_lang]
    
    # If dominant language is an Indic script with significant presence (> 15% of total text), assign that language
    non_english_counts = {k: v for k, v in counts.items() if k != 'English'}
    best_indic = max(non_english_counts, key=non_english_counts.get)
    if non_english_counts[best_indic] > 10 and (non_english_counts[best_indic] / total_relevant_chars) > 0.15:
        dominant_lang = best_indic
        confidence = min(99.0, (non_english_counts[best_indic] / total_relevant_chars) * 100 + 40.0)
    else:
        confidence = min(99.0, (highest_count / total_relevant_chars) * 100.0)

    return dominant_lang, round(confidence, 1)

def get_ocr_languages(detected_lang):
    """Return appropriate language code list for EasyOCR given detected language."""
    code = LANGUAGE_EASYOCR_MAP.get(detected_lang, 'en')
    if code == 'en':
        return ['en']
    return ['en', code]
