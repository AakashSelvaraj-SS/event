# AI Document Extractor 📄✨
> An intelligent, multilingual web application for automated document OCR extraction, user-selected Excel spreadsheet generation, QR code verification, and real-time session analytics. Designed as an academic & research grade project.

---

## 🌟 1. Project Overview

The **AI Document Extractor** solves the tedious problem of manually transcribing official documents and certificates into spreadsheets. 

Users can upload single or batch documents (Income Certificates, Community Certificates, Birth Certificates, Marksheets, Aadhaar, Passports, Driving Licences), customize the exact columns they want in the final Excel file, verify/edit OCR extractions interactively, and export a professionally formatted, editable `.xlsx` workbook along with session analytics and charts.

---

## 🚀 2. Key Features

- 🔐 **Secure User Authentication**: Session-based login/registration with Werkzeug password hashing and protected routes.
- 📂 **Multi-Format & Batch Upload**: Supports PNG, JPG, JPEG, and PDF documents with drag-and-drop support.
- 🖼️ **Advanced OpenCV Preprocessing**: Grayscale conversion, bilateral filtering, CLAHE contrast enhancement, sharpening, and Otsu adaptive thresholding.
- 🌐 **Multilingual OCR & Script Detection**: EasyOCR + PyPDF2 text recognition supporting English, Tamil, Hindi, Telugu, Malayalam, and Kannada.
- 📑 **Smart Document Classification**: Automatically classifies certificates (Income, Community, Birth, Marksheet, Residence, Aadhaar, Passport, DL).
- 🎯 **User-Selectable Excel Attributes**: Select only the exact attributes you need in the spreadsheet before processing.
- 🔍 **QR Code Consistency Verification**: Uses OpenCV `QRCodeDetector` to decode QR codes and cross-check payload integrity against OCR fields.
- 📊 **Confidence & Quality Scoring**: Per-field extraction confidence badges (High / Medium / Low).
- ✏️ **Interactive Preview & Inline Editing**: Allows users to inspect and correct values before generating the Excel file.
- 📑 **Dynamic Styled Excel Generator**: Produces editable `.xlsx` files with professional headers, auto-adjusted column widths, freeze panes, and filters using OpenPyXL and Pandas.
- 📈 **Session-Specific Analytics**: Real-time Chart.js visualizations (Doc Types, Languages, Communities, Income ranges, QR status) strictly representing the active session.
- 🔄 **Session Reset & Report Export**: Export HTML/PDF analytics reports and start fresh upload sessions with confirmation safety.

---

## 🛠️ 3. Technology Stack

| Layer | Technologies Used |
|---|---|
| **Backend Framework** | Python 3.9+, Flask |
| **Authentication & Security** | Flask Session, Werkzeug Security |
| **Database** | SQLite 3 |
| **OCR Engine** | EasyOCR, PyPDF2 |
| **Image Preprocessing** | OpenCV (`opencv-python-headless`), Pillow, NumPy |
| **Spreadsheet Generation** | Pandas, OpenPyXL |
| **QR Code Verification** | OpenCV `QRCodeDetector` |
| **Frontend UI** | HTML5, CSS3, JavaScript (ES6+), Bootstrap 5.3, Bootstrap Icons |
| **Data Visualizations** | Chart.js |
| **Testing** | Pytest |

---

## 📁 4. Project Folder Structure

```text
smartdocai/
│
├── app.py                     # Main Flask Application & Route Controller
├── config.py                  # Global Configuration & Environment Settings
├── requirements.txt           # Python Dependencies
├── README.md                  # Comprehensive Documentation
│
├── database/
│   ├── schema.sql             # SQLite Database Schema Definitions
│   ├── db.py                  # Database Connection & Query Helper Methods
│   └── database.db            # Auto-generated SQLite Database File
│
├── templates/                 # Jinja2 HTML Templates
│   ├── base.html              # Responsive Layout with Sidebar & Navigation
│   ├── login.html             # User Login Screen
│   ├── register.html          # User Registration Screen
│   ├── dashboard.html         # Dashboard & Session Metric Cards
│   ├── upload.html            # Drag-and-Drop Document Upload Zone
│   ├── attributes.html        # Dynamic Attribute / Column Selector
│   ├── preview.html           # Interactive Inline Editable Preview Table
│   ├── excel.html             # Generated Excel Landing & Download Screen
│   ├── analytics.html         # Chart.js Session Analytics Dashboard
│   └── settings.html          # User Profile & System Configuration
│
├── static/
│   ├── css/
│   │   └── style.css          # Design System, Glassmorphic & Modern Styling
│   └── js/
│       ├── main.js            # Core App JavaScript & Sidebar Toggle
│       ├── upload.js          # File Upload Validation & Drag-and-Drop
│       └── analytics.js       # Chart.js Visualizations
│
├── utils/                     # Modular Core Processing Services
│   ├── helpers.py             # File Validation, Paths, & Utility Functions
│   ├── preprocessing.py       # OpenCV Image Enhancement Pipeline
│   ├── ocr.py                 # EasyOCR & PyPDF2 Text Recognition Wrapper
│   ├── language_detection.py  # Script & Unicode Language Analyzer
│   ├── document_detection.py  # Rule & Keyword Document Classification
│   ├── extraction.py          # Regex & Heuristic Attribute Extraction
│   ├── qr_verification.py     # QR Code Decoding & Consistency Checking
│   ├── excel_generator.py     # OpenPyXL & Pandas Formatted Spreadsheet Creator
│   └── analytics.py           # Session Metric Calculator & Report Generator
│
├── uploads/                   # Stored Uploaded Documents (Isolated)
├── processed/                 # Stored OpenCV Preprocessed Images
├── generated_excel/           # Generated .xlsx Spreadsheets
├── reports/                   # Saved Analytics HTML/PDF Reports
└── tests/
    └── test_app.py            # Automated Unit & Pipeline Test Suite
```

---

## 💻 5. Installation & Setup Guide (Windows PowerShell)

Follow these steps to set up and run the application locally on Windows:

### Step 1: Open VS Code Terminal (PowerShell)
Make sure you are in the project root directory:
```powershell
cd c:\Users\ssaak\OneDrive\Desktop\smartdocai
```

### Step 2: Create a Python Virtual Environment
```powershell
python -m venv venv
```

### Step 3: Activate the Virtual Environment
```powershell
.\venv\Scripts\Activate.ps1
```
*(If PowerShell shows an execution policy error, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` and then run the activate command again).*

### Step 4: Upgrade pip & Install Dependencies
```powershell
python -m pip install --upgrade pip
pip install -r requirements.txt
```

---

## 🏃 6. Running the Application

Start the Flask development server:
```powershell
python app.py
```

Open your web browser and navigate to:
👉 **`http://127.0.0.1:5000/`**

---

## 📖 7. Step-by-Step User Workflow

1. **Register / Login**:
   - Create an account or log in with your credentials.
2. **Dashboard**:
   - View your current active session metrics and quick links.
3. **Upload Documents**:
   - Drag & drop one or multiple document files (images or PDFs).
4. **Select Excel Attributes**:
   - Choose which columns (e.g. Name, Income, Community, DOB, Certificate No) should appear in the final spreadsheet.
5. **Process Documents**:
   - OpenCV enhances image clarity $\rightarrow$ EasyOCR & PyPDF2 extract text $\rightarrow$ Language and Document Type are detected $\rightarrow$ Regex & patterns extract fields $\rightarrow$ QR code consistency is checked.
6. **Preview & Edit**:
   - Inspect extracted fields, review confidence score badges, and click on any value to make corrections.
7. **Generate & Download Excel**:
   - Click **Generate Excel** to create the `.xlsx` file containing **only** your selected attributes.
8. **View Session Analytics**:
   - Inspect Chart.js visualizations of the current session.
   - Click **Save Analytics Report** to download an offline report.
9. **Start New Upload**:
   - Click **New Upload** or **New Session** to safely clear the active session and start a fresh batch.

---

## 🌐 8. Supported Document Types & Languages

### Document Types
- **Income Certificate**
- **Community / Caste Certificate**
- **Residence / Domicile / Nativity Certificate**
- **Birth Certificate**
- **Academic Marksheets & Grade Sheets**
- **Aadhaar Card**
- **Passport**
- **Driving Licence**
- **General / Other Documents**

### Supported Languages
- English (`en`)
- Hindi (`hi`)
- Tamil (`ta`)
- Telugu (`te`)
- Malayalam (`ml`)
- Kannada (`kn`)

---

## 🔍 9. QR Code Verification Note
The QR verification feature utilizes OpenCV's `QRCodeDetector` (and `pyzbar` fallback) to read payload strings, URLs, or JSON from document images and cross-references data points (such as name, certificate number, or income) against OCR extracted fields. 

> [!NOTE]
> This performs a **local consistency check** between the document's visual text and its encoded QR payload. It does not connect to closed government servers without dedicated external API authorization.

---

## 🧪 10. Running Automated Tests

Run the test suite using `pytest`:
```powershell
pytest tests/test_app.py -v
```

---

## 🔮 11. Future Enhancements

- 🤖 Integration with Hugging Face LayoutLM for end-to-end multi-modal document parsing.
- ☁️ Cloud storage integration (AWS S3 / Google Cloud Storage).
- 📧 Direct email dispatch of generated spreadsheets.
- 🏛️ Official DigiLocker and API verification service hooks.
