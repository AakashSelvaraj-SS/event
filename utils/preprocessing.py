import os
from config import Config

try:
    import cv2
    import numpy as np
    HAS_CV2 = True
except ImportError:
    HAS_CV2 = False

try:
    from PIL import Image, ImageEnhance, ImageFilter
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

def preprocess_image(input_path, output_filename=None):
    """
    Image preprocessing pipeline to enhance text clarity for OCR.
    Leaves original upload intact and saves enhanced image in PROCESSED_FOLDER.
    Uses OpenCV when available, with PIL fallback.
    
    Returns:
        tuple: (processed_image_path, preprocessed_image_object)
    """
    if not output_filename:
        output_filename = f"proc_{os.path.basename(input_path)}"
        
    output_path = os.path.join(Config.PROCESSED_FOLDER, output_filename)
    os.makedirs(Config.PROCESSED_FOLDER, exist_ok=True)

    if HAS_CV2:
        try:
            img_bytes = np.fromfile(input_path, dtype=np.uint8)
            img = cv2.imdecode(img_bytes, cv2.IMREAD_COLOR)
            
            if img is not None:
                # 1. Rescaling
                h, w = img.shape[:2]
                if max(h, w) > 2500:
                    scale = 2500.0 / max(h, w)
                    img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
                elif min(h, w) < 800:
                    scale = 1200.0 / min(h, w)
                    img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_CUBIC)

                # 2. Grayscale Conversion
                gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

                # 3. Bilateral Filter Denoising
                denoised = cv2.bilateralFilter(gray, d=9, sigmaColor=75, sigmaSpace=75)

                # 4. CLAHE Contrast Enhancement
                clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
                contrast_enhanced = clahe.apply(denoised)

                # 5. Sharpening Filter
                sharpen_kernel = np.array([[-1, -1, -1],
                                           [-1,  9, -1],
                                           [-1, -1, -1]])
                sharpened = cv2.filter2D(contrast_enhanced, -1, sharpen_kernel)

                is_success, buffer = cv2.imencode(".png", sharpened)
                if is_success:
                    with open(output_path, "wb") as f:
                        f.write(buffer)
                    return output_path, sharpened
        except Exception as e:
            print(f"OpenCV processing note: {e}")

    # Fallback using PIL
    if HAS_PIL:
        try:
            with Image.open(input_path) as pil_img:
                gray = pil_img.convert('L')
                enhancer = ImageEnhance.Contrast(gray)
                enhanced = enhancer.enhance(1.5)
                enhanced.save(output_path)
                return output_path, enhanced
        except Exception as e:
            print(f"PIL processing note: {e}")

    return input_path, None
