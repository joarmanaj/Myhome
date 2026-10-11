// Commission Request Form Logic

(function() {
    'use strict';

    const API_URL = (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost')
        ? 'http://127.0.0.1:5000/commission'
        : 'https://signup-backend-hs67.onrender.com/commission';

    const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hello, I'd like to discuss a commission before filling the form.")}`;

    const state = {
        conversation: '',
        interested: '',
        type: '',
        selectedPiece: null
    };

    // ============ OPTION BUTTON HANDLERS ============
    document.querySelectorAll('.option-btn[data-q]').forEach(btn => {
        btn.addEventListener('click', function() {
            const q = this.getAttribute('data-q');
            const value = this.getAttribute('data-value');

            // Deselect siblings
            document.querySelectorAll(`.option-btn[data-q="${q}"]`).forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');

            if (q === 'conv') {
                state.conversation = value;
                handleConversation(value);
            } else if (q === 'comm') {
                state.interested = value;
                handleInterest(value);
            } else if (q === 'type') {
                state.type = value;
                handleType(value);
            }
        });
    });

    // ============ CONVERSATION HANDLING ============
    function handleConversation(value) {
        const whatsapp = document.getElementById('whatsapp-note');
        const q2 = document.getElementById('q2-wrap');

        if (value === 'Yes') {
            whatsapp.classList.remove('active');
            q2.classList.add('active');
        } else {
            whatsapp.classList.add('active');
            q2.classList.remove('active');
            document.getElementById('form-wrap').classList.remove('active');
            document.getElementById('whatsapp-link').href = WHATSAPP_LINK;
        }
    }

    // ============ COMMISSION INTEREST ============
    function handleInterest(value) {
        const form = document.getElementById('form-wrap');
        if (value === 'Yes') {
            form.classList.add('active');
        } else {
            form.classList.remove('active');
        }
    }

    // ============ PIECE TYPE ============
    function handleType(value) {
        const existing = document.getElementById('existing-wrap');
        const newPiece = document.getElementById('new-wrap');

        if (value === 'existing') {
            existing.classList.add('active');
            newPiece.classList.remove('active');
        } else {
            existing.classList.remove('active');
            newPiece.classList.add('active');
        }
    }

    // ============ BROWSE GALLERY ============
    document.getElementById('browse-btn').addEventListener('click', function() {
        const browse = document.getElementById('browse-wrap');
        browse.classList.toggle('active');
    });

    function loadGallery() {
        const grid = document.getElementById('browse-gallery');
        if (!grid) return;

        let allPieces = [];
        if (typeof artworks !== 'undefined') allPieces = allPieces.concat(artworks);
        if (typeof inksArtworks !== 'undefined') allPieces = allPieces.concat(inksArtworks);

        allPieces.forEach(art => {
            const item = document.createElement('div');
            item.className = 'gallery-item';
            item.innerHTML = `
                <img src="${art.image}" alt="${art.title}" loading="lazy">
                <div class="gallery-title">${art.title}</div>
            `;
            item.addEventListener('click', function() {
                document.querySelectorAll('.gallery-item').forEach(g => g.classList.remove('selected'));
                item.classList.add('selected');
                state.selectedPiece = art;
                document.getElementById('piece-name-input').value = art.title;
            });
            grid.appendChild(item);
        });
    }

    // ============ SUBMIT ============
    window.submitForm = function() {
        const statusEl = document.getElementById('form-status');
        const submitBtn = document.getElementById('submit-btn');

        statusEl.style.display = 'none';
        statusEl.className = 'form-status';

        document.querySelectorAll('.error-message').forEach(e => e.style.display = 'none');

        // Name
        const nameInput = document.getElementById('client-name');
        const name = nameInput.value.trim();
        if (name.length < 2) {
            showError('client-name-error', 'Please enter your full name.');
            return;
        }
        if (/\d/.test(name)) {
            showError('client-name-error', 'Name should not contain numbers.');
            return;
        }

        // Email
        const email = document.getElementById('client-email').value.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
        if (!emailRegex.test(email)) {
            showError('client-email-error', 'Please enter a valid email address.');
            return;
        }

        // reCAPTCHA
        let recaptchaResponse = '';
        try {
            recaptchaResponse = grecaptcha.getResponse();
        } catch (e) {
            recaptchaResponse = '';
        }
        if (!recaptchaResponse) {
            showError('captcha-error', 'Please complete the reCAPTCHA check.');
            return;
        }

        // Gather
        const pieceNameInput = document.getElementById('piece-name-input').value.trim();
        const data = {
            client_name: name,
            client_email: email,
            client_phone: document.getElementById('client-phone').value.trim(),
            country: document.getElementById('country').value.trim(),
            conversation_check: state.conversation,
            request_type: state.type,
            piece_slug: state.selectedPiece ? state.selectedPiece.slug : '',
            piece_title: state.selectedPiece ? state.selectedPiece.title : pieceNameInput,
            piece_image: state.selectedPiece ? state.selectedPiece.image : '',
            commission_type: document.getElementById('commission-type')?.value || '',
            new_vision: document.getElementById('new-vision')?.value.trim() || '',
            size_preference: document.getElementById('size-preference').value.trim(),
            deadline: document.getElementById('deadline').value,
            budget_range: document.getElementById('budget-range').value.trim(),
            recaptcha: recaptchaResponse,
            website: document.getElementById('website').value
        };

        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(res => res.json())
        .then(result => {
            if (result.success) {
                window.location.href = 'commission-thanks.html';
            } else {
                showStatus(result.message || 'Something went wrong.', 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit Request';
            }
        })
        .catch(() => {
            showStatus('Network error. Please try again.', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Request';
        });
    };

    function showError(id, message) {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = message;
            el.style.display = 'block';
        }
    }

    function showStatus(message, type) {
        const el = document.getElementById('form-status');
        el.textContent = message;
        el.className = 'form-status ' + type;
        el.style.display = 'block';
    }

    // ============ INIT ============
    loadGallery();

    const recaptchaWidget = document.getElementById('recaptcha-widget');
    const RECAPTCHA_SITE_KEY = window.RECAPTCHA_SITE_KEY || '6LcLz44tAAAAAJH55hQB_jn7YXIvsidfKBJCuclt';
    if (recaptchaWidget && RECAPTCHA_SITE_KEY) {
        recaptchaWidget.setAttribute('data-sitekey', RECAPTCHA_SITE_KEY);
    }

})();