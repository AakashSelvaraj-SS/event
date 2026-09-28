/**
 * Analytics Dashboard Charts Renderer (Chart.js)
 */
function initAnalyticsCharts(data) {
    if (!data) return;

    // Harmonious color palettes
    const palette = [
        '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'
    ];

    // 1. Document Type Distribution (Pie / Doughnut Chart)
    const docTypeCtx = document.getElementById('docTypeChart');
    if (docTypeCtx && data.doc_type_distribution) {
        const labels = Object.keys(data.doc_type_distribution);
        const values = Object.values(data.doc_type_distribution);

        new Chart(docTypeCtx, {
            type: 'doughnut',
            data: {
                labels: labels.length ? labels : ['No Documents'],
                datasets: [{
                    data: values.length ? values : [0],
                    backgroundColor: palette,
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 12, font: { family: 'Inter', size: 12 } } }
                },
                cutout: '65%'
            }
        });
    }

    // 2. Language Distribution (Bar Chart)
    const langCtx = document.getElementById('languageChart');
    if (langCtx && data.language_distribution) {
        const labels = Object.keys(data.language_distribution);
        const values = Object.values(data.language_distribution);

        new Chart(langCtx, {
            type: 'bar',
            data: {
                labels: labels.length ? labels : ['None'],
                datasets: [{
                    label: 'Documents',
                    data: values.length ? values : [0],
                    backgroundColor: '#3b82f6',
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, ticks: { precision: 0 } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    // 3. Community Distribution (Doughnut Chart)
    const communityCtx = document.getElementById('communityChart');
    if (communityCtx && data.community_distribution) {
        const labels = Object.keys(data.community_distribution);
        const values = Object.values(data.community_distribution);

        new Chart(communityCtx, {
            type: 'pie',
            data: {
                labels: labels.length ? labels : ['No Community Data'],
                datasets: [{
                    data: values.length ? values : [1],
                    backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#64748b'],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 12, font: { family: 'Inter', size: 12 } } }
                }
            }
        });
    }

    // 4. QR Verification Breakdown
    const qrCtx = document.getElementById('qrStatusChart');
    if (qrCtx && data.qr_status_distribution) {
        const labels = Object.keys(data.qr_status_distribution);
        const values = Object.values(data.qr_status_distribution);

        new Chart(qrCtx, {
            type: 'doughnut',
            data: {
                labels: labels.length ? labels : ['Not Checked'],
                datasets: [{
                    data: values.length ? values : [0],
                    backgroundColor: ['#10b981', '#ef4444', '#f59e0b', '#94a3b8'],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 12, font: { family: 'Inter', size: 12 } } }
                },
                cutout: '60%'
            }
        });
    }

    // 5. Extraction Quality & Confidence
    const confCtx = document.getElementById('confidenceChart');
    if (confCtx && data.confidence_distribution) {
        const labels = Object.keys(data.confidence_distribution);
        const values = Object.values(data.confidence_distribution);

        new Chart(confCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Extracted Fields',
                    data: values,
                    backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, ticks: { precision: 0 } },
                    x: { grid: { display: false } }
                }
            }
        });
    }
}
