/**
 * Upload Module - Drag and drop & file validation
 */
document.addEventListener('DOMContentLoaded', function () {
    const dropzone = document.getElementById('uploadDropzone');
    const fileInput = document.getElementById('documentInput');
    const fileListContainer = document.getElementById('selectedFilesList');
    const selectedFilesSection = document.getElementById('selectedFilesSection');
    const uploadForm = document.getElementById('uploadForm');
    const submitBtn = document.getElementById('submitUploadBtn');

    if (!dropzone || !fileInput) return;

    // Trigger file chooser when clicking dropzone
    dropzone.addEventListener('click', () => fileInput.click());

    // Drag and drop event listeners
    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.remove('dragover');
        }, false);
    });

    // Handle dropped files
    dropzone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        fileInput.files = files;
        updateFileList();
    });

    // Handle file picker selection
    fileInput.addEventListener('change', updateFileList);

    function formatBytes(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }

    function updateFileList() {
        if (!fileListContainer) return;
        fileListContainer.innerHTML = '';

        const files = Array.from(fileInput.files);
        if (files.length === 0) {
            if (selectedFilesSection) selectedFilesSection.classList.add('d-none');
            if (submitBtn) submitBtn.disabled = true;
            return;
        }

        if (selectedFilesSection) selectedFilesSection.classList.remove('d-none');
        if (submitBtn) submitBtn.disabled = false;

        files.forEach((file, index) => {
            const isPdf = file.name.toLowerCase().endsWith('.pdf');
            const iconClass = isPdf ? 'bi-file-earmark-pdf-fill text-danger' : 'bi-file-earmark-image-fill text-primary';

            const card = document.createElement('div');
            card.className = 'd-flex align-items-center justify-content-between p-2 mb-2 bg-white rounded border shadow-xs';
            card.innerHTML = `
                <div class="d-flex align-items-center gap-2 overflow-hidden">
                    <i class="bi ${iconClass} fs-4"></i>
                    <div class="text-truncate">
                        <div class="fw-medium text-truncate fs-sm">${file.name}</div>
                        <small class="text-muted fs-xs">${formatBytes(file.size)}</small>
                    </div>
                </div>
                <span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">Ready</span>
            `;
            fileListContainer.appendChild(card);
        });
    }
});
