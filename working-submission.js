// ===== APPLICATION STATE =====
const appState = {
    currentSubmission: {
        subject: '',
        question: '',
        finalAnswer: '',
        steps: [''],
        images: [],
        notes: '',
        timestamp: null
    },
    submissions: [],
    imageFiles: []
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    loadSubmissions();
    setupEventListeners();
    addInitialStep();
    renderSubmissions();
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // Form submission
    document.getElementById('workingForm').addEventListener('submit', handleFormSubmit);
    document.getElementById('workingForm').addEventListener('reset', handleFormReset);

    // Add step button
    document.getElementById('addStepBtn').addEventListener('click', addStep);

    // Image upload
    const imageUploadArea = document.getElementById('imageUploadArea');
    const fileInput = document.getElementById('workingImages');

    imageUploadArea.addEventListener('click', () => fileInput.click());
    imageUploadArea.addEventListener('dragover', handleDragOver);
    imageUploadArea.addEventListener('dragleave', handleDragLeave);
    imageUploadArea.addEventListener('drop', handleDrop);

    fileInput.addEventListener('change', handleFileSelect);

    // Form inputs for real-time preview
    document.getElementById('subject').addEventListener('change', updatePreview);
    document.getElementById('question').addEventListener('input', updatePreview);
    document.getElementById('finalAnswer').addEventListener('input', updatePreview);
    document.getElementById('notes').addEventListener('input', updatePreview);

    // Steps container delegation
    document.getElementById('stepsContainer').addEventListener('input', (e) => {
        if (e.target.classList.contains('step-input')) {
            updatePreview();
        }
    });
}

// ===== STEP MANAGEMENT =====
function addInitialStep() {
    addStep();
}

function addStep() {
    appState.currentSubmission.steps.push('');
    renderSteps();
    updatePreview();
}

function removeStep(index) {
    if (appState.currentSubmission.steps.length > 1) {
        appState.currentSubmission.steps.splice(index, 1);
        renderSteps();
        updatePreview();
    } else {
        showError('You must have at least one step!');
    }
}

function renderSteps() {
    const stepsContainer = document.getElementById('stepsContainer');
    stepsContainer.innerHTML = '';

    appState.currentSubmission.steps.forEach((step, index) => {
        const stepDiv = document.createElement('div');
        stepDiv.className = 'step-item';

        stepDiv.innerHTML = `
            <div class="step-number">${index + 1}</div>
            <div class="step-input-wrapper">
                <textarea 
                    class="step-input" 
                    placeholder="Step ${index + 1}: Explain your working here. Use $...$ for LaTeX math (e.g., $E=mc^2$)"
                >${step}</textarea>
                ${appState.currentSubmission.steps.length > 1 ? `
                    <button type="button" class="remove-step" onclick="removeStep(${index})">
                        Remove
                    </button>
                ` : ''}
            </div>
        `;

        stepsContainer.appendChild(stepDiv);

        // Attach event listener to textarea
        stepDiv.querySelector('.step-input').addEventListener('input', (e) => {
            appState.currentSubmission.steps[index] = e.target.value;
            updatePreview();
        });
    });
}

// ===== IMAGE UPLOAD HANDLERS =====
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById('imageUploadArea').classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById('imageUploadArea').classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById('imageUploadArea').classList.remove('drag-over');

    const files = e.dataTransfer.files;
    processFiles(files);
}

function handleFileSelect(e) {
    const files = e.target.files;
    processFiles(files);
}

function processFiles(files) {
    for (let file of files) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            showError(`${file.name} is not an image file!`);
            continue;
        }

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            showError(`${file.name} is larger than 10MB!`);
            continue;
        }

        // Read file as data URL
        const reader = new FileReader();
        reader.onload = (e) => {
            appState.imageFiles.push({
                name: file.name,
                dataUrl: e.target.result
            });
            renderImagePreviews();
            updatePreview();
        };
        reader.readAsDataURL(file);
    }

    // Reset file input
    document.getElementById('workingImages').value = '';
}

function renderImagePreviews() {
    const previewContainer = document.getElementById('imagePreviewContainer');
    previewContainer.innerHTML = '';

    appState.imageFiles.forEach((image, index) => {
        const previewDiv = document.createElement('div');
        previewDiv.className = 'image-preview-item';

        previewDiv.innerHTML = `
            <img src="${image.dataUrl}" alt="${image.name}">
            <button type="button" class="remove-image" onclick="removeImage(${index})">×</button>
        `;

        previewContainer.appendChild(previewDiv);
    });
}

function removeImage(index) {
    appState.imageFiles.splice(index, 1);
    renderImagePreviews();
    updatePreview();
}

// ===== FORM VALIDATION =====
function validateForm() {
    const errors = [];

    // Get current form values
    const subject = document.getElementById('subject').value.trim();
    const question = document.getElementById('question').value.trim();
    const finalAnswer = document.getElementById('finalAnswer').value.trim();
    const steps = appState.currentSubmission.steps.filter(s => s.trim());

    if (!subject) {
        errors.push('Please select a subject');
        markFieldError('subject');
    }

    if (!question) {
        errors.push('Please enter a question');
        markFieldError('question');
    }

    if (!finalAnswer) {
        errors.push('Please enter your final answer');
        markFieldError('finalAnswer');
    }

    if (steps.length === 0) {
        errors.push('Please provide at least one step of working');
    }

    return errors;
}

function markFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    field.classList.add('error');
    setTimeout(() => field.classList.remove('error'), 3000);
}

// ===== FORM SUBMISSION =====
function handleFormSubmit(e) {
    e.preventDefault();

    // Validate form
    const errors = validateForm();
    if (errors.length > 0) {
        showError(errors.join('\n'));
        return;
    }

    // Create submission
    const submission = {
        id: Date.now(),
        subject: document.getElementById('subject').value,
        question: document.getElementById('question').value,
        finalAnswer: document.getElementById('finalAnswer').value,
        steps: appState.currentSubmission.steps.filter(s => s.trim()),
        images: [...appState.imageFiles],
        notes: document.getElementById('notes').value,
        timestamp: new Date().toLocaleString()
    };

    // Add to submissions
    appState.submissions.unshift(submission);

    // Save to localStorage
    saveSubmissions();

    // Show success message
    showSuccess('✅ Your working has been submitted successfully!');

    // Reset form
    document.getElementById('workingForm').reset();
    appState.currentSubmission = {
        subject: '',
        question: '',
        finalAnswer: '',
        steps: [''],
        images: [],
        notes: '',
        timestamp: null
    };
    appState.imageFiles = [];
    renderSteps();
    renderImagePreviews();
    updatePreview();

    // Render submissions
    renderSubmissions();

    // Scroll to submissions
    document.querySelector('.submissions-section').scrollIntoView({ behavior: 'smooth' });
}

function handleFormReset(e) {
    setTimeout(() => {
        appState.currentSubmission = {
            subject: '',
            question: '',
            finalAnswer: '',
            steps: [''],
            images: [],
            notes: '',
            timestamp: null
        };
        appState.imageFiles = [];
        renderSteps();
        renderImagePreviews();
        updatePreview();
    }, 0);
}

// ===== PREVIEW FUNCTIONALITY =====
function updatePreview() {
    const previewContainer = document.getElementById('previewContainer');

    const subject = document.getElementById('subject').value;
    const question = document.getElementById('question').value.trim();
    const finalAnswer = document.getElementById('finalAnswer').value.trim();
    const steps = appState.currentSubmission.steps;
    const notes = document.getElementById('notes').value.trim();

    // Check if any content exists
    if (!subject && !question && !finalAnswer && steps.every(s => !s.trim()) && appState.imageFiles.length === 0) {
        previewContainer.innerHTML = '<p class="placeholder">Fill out the form to see a preview of your submission</p>';
        previewContainer.classList.remove('has-content');
        return;
    }

    previewContainer.classList.add('has-content');

    let previewHTML = '<div class="preview-content">';

    if (subject) {
        previewHTML += `
            <div class="preview-item">
                <strong>📚 Subject:</strong>
                <p>${escapeHTML(subject)}</p>
            </div>
        `;
    }

    if (question) {
        previewHTML += `
            <div class="preview-item">
                <strong>❓ Question:</strong>
                <p>${escapeHTML(question)}</p>
            </div>
        `;
    }

    if (finalAnswer) {
        previewHTML += `
            <div class="preview-item">
                <strong>✅ Final Answer:</strong>
                <p>${escapeHTML(finalAnswer)}</p>
            </div>
        `;
    }

    // Steps preview
    const nonEmptySteps = steps.filter(s => s.trim());
    if (nonEmptySteps.length > 0) {
        previewHTML += '<div class="preview-steps"><strong>📝 Your Working:</strong>';
        nonEmptySteps.forEach((step, index) => {
            previewHTML += `
                <div class="preview-step">
                    <span class="step-label">Step ${index + 1}</span>
                    <div class="step-content">${escapeHTML(step)}</div>
                </div>
            `;
        });
        previewHTML += '</div>';
    }

    // Images preview
    if (appState.imageFiles.length > 0) {
        previewHTML += `
            <div class="preview-item">
                <strong>📷 Supporting Images (${appState.imageFiles.length}):</strong>
                <div class="modal-images" style="margin-top: 15px;">
                    ${appState.imageFiles.map(img => `
                        <img src="${img.dataUrl}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 6px; border: 2px solid #e0e0e0;">
                    `).join('')}
                </div>
            </div>
        `;
    }

    if (notes) {
        previewHTML += `
            <div class="preview-item">
                <strong>📌 Notes:</strong>
                <p>${escapeHTML(notes)}</p>
            </div>
        `;
    }

    previewHTML += '</div>';

    previewContainer.innerHTML = previewHTML;

    // Render LaTeX math
    if (window.MathJax) {
        MathJax.typesetPromise([previewContainer]).catch(err => console.log('MathJax error:', err));
    }
}

// ===== SUBMISSIONS DISPLAY =====
function renderSubmissions() {
    const container = document.getElementById('submissionsContainer');

    if (appState.submissions.length === 0) {
        container.innerHTML = '<p class="placeholder">No submissions yet. Submit your working to see it here!</p>';
        return;
    }

    container.innerHTML = '';
    appState.submissions.forEach(submission => {
        const card = document.createElement('div');
        card.className = 'submission-card';

        const shortQuestion = submission.question.length > 50 
            ? submission.question.substring(0, 50) + '...' 
            : submission.question;

        card.innerHTML = `
            <div class="submission-header">
                <span class="submission-subject">${submission.subject.toUpperCase()}</span>
                <span class="submission-date">${submission.timestamp}</span>
            </div>
            <div class="submission-question">${escapeHTML(shortQuestion)}</div>
            <div class="submission-answer"><strong>Answer:</strong> ${escapeHTML(submission.finalAnswer)}</div>
            <div class="submission-actions">
                <button class="btn-small btn-view" onclick="viewSubmission(${submission.id})">View Full</button>
                <button class="btn-small btn-delete" onclick="deleteSubmission(${submission.id})">Delete</button>
            </div>
        `;

        container.appendChild(card);
    });
}

function viewSubmission(id) {
    const submission = appState.submissions.find(s => s.id === id);
    if (!submission) return;

    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.id = `modal-${id}`;

    let imagesHTML = '';
    if (submission.images.length > 0) {
        imagesHTML = `
            <div class="detail-section">
                <h4>📷 Supporting Images</h4>
                <div class="modal-images">
                    ${submission.images.map(img => `
                        <div class="modal-image">
                            <img src="${img.dataUrl}" alt="${img.name}">
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    let notesHTML = '';
    if (submission.notes) {
        notesHTML = `
            <div class="detail-section">
                <h4>📌 Additional Notes</h4>
                <p>${escapeHTML(submission.notes)}</p>
            </div>
        `;
    }

    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${escapeHTML(submission.subject.toUpperCase())}</h3>
                <button class="close-modal" onclick="closeModal(${id})">×</button>
            </div>
            <div class="modal-details">
                <div class="detail-section">
                    <h4>❓ Question</h4>
                    <p>${escapeHTML(submission.question)}</p>
                </div>

                <div class="detail-section">
                    <h4>✅ Final Answer</h4>
                    <p>${escapeHTML(submission.finalAnswer)}</p>
                </div>

                <div class="detail-section">
                    <h4>📝 Your Working</h4>
                    ${submission.steps.map((step, index) => `
                        <div style="margin-bottom: 15px;">
                            <span class="step-label">Step ${index + 1}</span>
                            <p>${escapeHTML(step)}</p>
                        </div>
                    `).join('')}
                </div>

                ${imagesHTML}
                ${notesHTML}

                <div class="detail-section">
                    <h4>⏰ Submitted</h4>
                    <p>${submission.timestamp}</p>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(id);
        }
    });

    // Render LaTeX
    if (window.MathJax) {
        MathJax.typesetPromise([modal]).catch(err => console.log('MathJax error:', err));
    }
}

function closeModal(id) {
    const modal = document.getElementById(`modal-${id}`);
    if (modal) {
        modal.remove();
    }
}

function deleteSubmission(id) {
    if (confirm('Are you sure you want to delete this submission? This cannot be undone.')) {
        appState.submissions = appState.submissions.filter(s => s.id !== id);
        saveSubmissions();
        renderSubmissions();
        showSuccess('✅ Submission deleted successfully!');
    }
}

// ===== LOCAL STORAGE =====
function saveSubmissions() {
    try {
        localStorage.setItem('darasa_submissions', JSON.stringify(appState.submissions));
    } catch (e) {
        showError('Failed to save submissions. Storage quota may be exceeded.');
    }
}

function loadSubmissions() {
    try {
        const saved = localStorage.getItem('darasa_submissions');
        if (saved) {
            appState.submissions = JSON.parse(saved);
        }
    } catch (e) {
        console.error('Failed to load submissions:', e);
        appState.submissions = [];
    }
}

// ===== UTILITY FUNCTIONS =====
function showSuccess(message) {
    const form = document.getElementById('workingForm');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'success-message';
    messageDiv.textContent = message;
    form.parentElement.insertBefore(messageDiv, form);

    setTimeout(() => messageDiv.remove(), 3000);
}

function showError(message) {
    const form = document.getElementById('workingForm');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'error-message';
    messageDiv.textContent = message;
    form.parentElement.insertBefore(messageDiv, form);

    setTimeout(() => messageDiv.remove(), 4000);
}

function escapeHTML(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}
