import json
import os
from collections import Counter
from config import Config

def compute_session_analytics(documents, extracted_records_list):
    """
    Compute structured statistical metrics for the current session.
    
    Args:
        documents (list of sqlite3.Row or dict): documents in current session
        extracted_records_list (list of sqlite3.Row or dict): extracted records
        
    Returns:
        dict: comprehensive analytics payload for Chart.js and UI cards
    """
    total_docs = len(documents)
    if total_docs == 0:
        return {
            'total_documents': 0,
            'total_records': 0,
            'successful_documents': 0,
            'failed_documents': 0,
            'qr_verified_count': 0,
            'avg_confidence': 0.0,
            'doc_type_distribution': {},
            'language_distribution': {},
            'community_distribution': {},
            'income_distribution': {},
            'qr_status_distribution': {},
            'confidence_distribution': {'High (>=85%)': 0, 'Medium (70-84%)': 0, 'Review Needed (<70%)': 0}
        }

    # Status counts
    success_count = sum(1 for d in documents if d['status'] == 'processed')
    failed_count = sum(1 for d in documents if d['status'] == 'failed')
    qr_verified = sum(1 for d in documents if d['qr_status'] == 'Verified')

    # Distributions
    doc_types = Counter(d['doc_type'] for d in documents if d['doc_type'])
    languages = Counter(d['detected_language'] for d in documents if d['detected_language'])
    qr_statuses = Counter(d['qr_status'] for d in documents if d['qr_status'])

    # Confidence and community / income aggregations from records
    confidences = []
    communities = Counter()
    income_brackets = {
        'Below ₹50,000': 0,
        '₹50,000 - ₹1,00,000': 0,
        '₹1,00,000 - ₹2,50,000': 0,
        '₹2,50,000 - ₹5,00,000': 0,
        'Above ₹5,00,000': 0
    }
    
    conf_buckets = {
        'High (>=85%)': 0,
        'Medium (70-84%)': 0,
        'Review Needed (<70%)': 0
    }

    for r in extracted_records_list:
        conf = float(r['confidence_score'] or 0.0)
        confidences.append(conf)
        
        if conf >= 85:
            conf_buckets['High (>=85%)'] += 1
        elif conf >= 70:
            conf_buckets['Medium (70-84%)'] += 1
        else:
            conf_buckets['Review Needed (<70%)'] += 1

        val = str(r['extracted_value'] or '').strip()
        field_key = r['field_key']
        
        if field_key == 'community' and val:
            up_val = val.upper()
            if 'MBC' in up_val:
                communities['MBC'] += 1
            elif 'SC' in up_val:
                communities['SC'] += 1
            elif 'ST' in up_val:
                communities['ST'] += 1
            elif 'BC' in up_val or 'OBC' in up_val:
                communities['BC'] += 1
            elif 'OC' in up_val or 'GENERAL' in up_val or 'FC' in up_val:
                communities['OC / General'] += 1
            else:
                communities['Other'] += 1

        elif field_key == 'income' and val:
            try:
                num = int(''.join(filter(str.isdigit, val)))
                if num < 50000:
                    income_brackets['Below ₹50,000'] += 1
                elif num <= 100000:
                    income_brackets['₹50,000 - ₹1,00,000'] += 1
                elif num <= 250000:
                    income_brackets['₹1,00,000 - ₹2,50,000'] += 1
                elif num <= 500000:
                    income_brackets['₹2,50,000 - ₹5,00,000'] += 1
                else:
                    income_brackets['Above ₹5,00,000'] += 1
            except ValueError:
                pass

    avg_conf = (sum(confidences) / len(confidences)) if confidences else 0.0

    return {
        'total_documents': total_docs,
        'total_records': len(extracted_records_list),
        'successful_documents': success_count,
        'failed_documents': failed_count,
        'qr_verified_count': qr_verified,
        'avg_confidence': round(avg_conf, 1),
        'doc_type_distribution': dict(doc_types),
        'language_distribution': dict(languages),
        'community_distribution': dict(communities),
        'income_distribution': {k: v for k, v in income_brackets.items() if v > 0} or {'No Income Data': 0},
        'qr_status_distribution': dict(qr_statuses),
        'confidence_distribution': conf_buckets
    }

def generate_analytics_html_report(user_name, session_id, analytics_data):
    """Generate a printable HTML analytics report file."""
    os.makedirs(Config.REPORTS_FOLDER, exist_ok=True)
    report_filename = f"analytics_report_session_{session_id}.html"
    report_path = os.path.join(Config.REPORTS_FOLDER, report_filename)
    
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Analytics Report - Session #{session_id}</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body {{ font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; background-color: #f8fafc; color: #1e293b; }}
        .header-card {{ background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: white; border-radius: 12px; padding: 25px; margin-bottom: 25px; }}
        .stat-card {{ background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; text-align: center; }}
        .stat-num {{ font-size: 24px; font-weight: bold; color: #1e3a8a; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 15px; background: white; }}
        th, td {{ padding: 10px; border: 1px solid #e2e8f0; text-align: left; }}
        th {{ background-color: #f1f5f9; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header-card">
            <h2>AI Document Extractor - Analytics Report</h2>
            <p class="mb-0">User: {user_name} | Session ID: #{session_id} | Generated Automatically</p>
        </div>
        
        <div class="row g-3 mb-4">
            <div class="col-md-3"><div class="stat-card"><div>Total Documents</div><div class="stat-num">{analytics_data.get('total_documents', 0)}</div></div></div>
            <div class="col-md-3"><div class="stat-card"><div>Total Records</div><div class="stat-num">{analytics_data.get('total_records', 0)}</div></div></div>
            <div class="col-md-3"><div class="stat-card"><div>QR Verified</div><div class="stat-num">{analytics_data.get('qr_verified_count', 0)}</div></div></div>
            <div class="col-md-3"><div class="stat-card"><div>Avg Confidence</div><div class="stat-num">{analytics_data.get('avg_confidence', 0)}%</div></div></div>
        </div>

        <h4>Document Classification Breakdown</h4>
        <table>
            <tr><th>Document Type</th><th>Count</th></tr>
            {"".join(f"<tr><td>{k}</td><td>{v}</td></tr>" for k, v in analytics_data.get('doc_type_distribution', {}).items())}
        </table>

        <h4 class="mt-4">Language Distribution</h4>
        <table>
            <tr><th>Detected Language</th><th>Count</th></tr>
            {"".join(f"<tr><td>{k}</td><td>{v}</td></tr>" for k, v in analytics_data.get('language_distribution', {}).items())}
        </table>

        <h4 class="mt-4">QR Code Verification Summary</h4>
        <table>
            <tr><th>Status</th><th>Count</th></tr>
            {"".join(f"<tr><td>{k}</td><td>{v}</td></tr>" for k, v in analytics_data.get('qr_status_distribution', {}).items())}
        </table>
    </div>
</body>
</html>"""

    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(html_content)
        
    return report_path, report_filename
