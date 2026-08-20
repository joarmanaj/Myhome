// ============================================
// VISION & LEAD — Sign-Up Form Guardrails
// ============================================

(function() {
    'use strict';

    // Environment variables injected by Netlify at build time
    const WHATSAPP_NUMBER = window.WHATSAPP_NUMBER || 'YOUR_WHATSAPP_NUMBER_PLACEHOLDER';
    const RECAPTCHA_SITE_KEY ='6LcLz44tAAAAAJH55hQB_jn7YXIvsidfKBJCuclt';

    // Set reCAPTCHA site key if available
    const recaptchaWidget = document.getElementById('recaptcha-widget');
    if (recaptchaWidget && RECAPTCHA_SITE_KEY) {
        recaptchaWidget.setAttribute('data-sitekey', RECAPTCHA_SITE_KEY);
    }

    const form = document.getElementById('signup-form');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const interestSelect = document.getElementById('interest');
    const honeypot = document.getElementById('website');
    const submitBtn = document.getElementById('submit-btn');
    const formStatus = document.getElementById('form-status');

    const nameError = document.getElementById('name-error');
    const emailError = document.getElementById('email-error');
    const interestError = document.getElementById('interest-error');
    const captchaError = document.getElementById('captcha-error');

    const tempEmailDomains = [
        'mailinator.com', 'tempmail.org', '10minutemail.com', 'guerrillamail.com',
        'sharklasers.com', 'throwawaymail.com', 'dispostable.com', 'maildrop.cc',
        'getnada.com', 'temp-mail.org', 'tempmail.net', 'fakeinbox.com',
        'mailcatch.com', 'trashmail.com', 'yopmail.com', 'emailondeck.com',
        'spamgourmet.com', 'mintemail.com', 'mailnesia.com', 'mailnull.com',
        'example.com', 'test.com', 'mytemp.email', 'tempinbox.com',
        'wegwerfmail.de', 'wegwerfmail.net', 'wegwerfmail.org',
        'trash-mail.com', 'opayq.com', 'mailinator.net', 'mailinator.org',
        'spamobox.com', 'binkmail.com', 'deadaddress.com', 'discardmail.com',
        'dodgeit.com', 'e4ward.com', 'gishpuppy.com', 'junkmail.com',
        'mailexpire.com', 'mailmetrash.com', 'mailslite.com', 'mypacks.net',
        'objectmail.com', 'proxymail.com', 'rcpt.at', 'shortmail.net',
        'sogetthis.com', 'tyldd.com', 'uggsrock.com', 'wuzup.net',
        'xs4all.nl', 'yopmail.fr', 'yopmail.net', 'cool.fr.nf',
        'jetable.fr.nf', 'nospammail.net', 'spambox.us', 'zybermail.com'
    ];

    function stripAllTags(input) {
        return input.replace(/<\/?[^>]+(>|$)/g, '').replace(/\s+/g, ' ').trim();
    }

    function validateName(name) {
        const cleaned = stripAllTags(name);
        if (cleaned.length < 2) return { valid: false, message: 'Name must be at least 2 characters.' };
        if (cleaned.length > 100) return { valid: false, message: 'Name is too long.' };
        if (/[<>{}[\]()=;:]/.test(cleaned)) return { valid: false, message: 'Name contains invalid characters.' };
        if (/\d/.test(cleaned)) return { valid: false, message: 'Name should not contain numbers.' };
        return { valid: true, cleaned: cleaned };
    }

    function validateEmail(email) {
        const cleaned = stripAllTags(email).toLowerCase();
        if (!cleaned) return { valid: false, message: 'Email is required.' };
        if (cleaned.length > 150) return { valid: false, message: 'Email is too long.' };
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
        if (!emailRegex.test(cleaned)) return { valid: false, message: 'Please enter a valid email address.' };
        const domain = cleaned.split('@')[1];
        if (tempEmailDomains.includes(domain)) return { valid: false, message: 'Please use a permanent email address.' };
        return { valid: true, cleaned: cleaned };
    }

    function validateInterest(interest) {
        if (!interest) return { valid: false, message: 'Please select an option.' };
        const allowed = ['Collector', 'Commission', 'Art Decks', 'AI Services', 'General'];
        if (!allowed.includes(interest)) return { valid: false, message: 'Invalid selection.' };
        return { valid: true };
    }

    function showError(element, message) {
        if (element) {
            element.textContent = message;
            element.style.display = 'block';
        }
    }

    function clearError(element) {
        if (element) {
            element.textContent = '';
            element.style.display = 'none';
        }
    }

    function showFormStatus(message, type) {
        formStatus.textContent = message;
        formStatus.className = 'form-status ' + type;
        formStatus.style.display = 'block';
    }

    function hideFormStatus() {
        formStatus.style.display = 'none';
        formStatus.textContent = '';
    }

    form.addEventListener('submit', function(event) {
        event.preventDefault();
        hideFormStatus();

        if (honeypot && honeypot.value) {
            showFormStatus('Thank you. Your submission has been received.', 'success');
            form.reset();
            return;
        }

        clearError(nameError);
        clearError(emailError);
        clearError(interestError);
        clearError(captchaError);

        const nameResult = validateName(nameInput.value);
        if (!nameResult.valid) {
            showError(nameError, nameResult.message);
            nameInput.focus();
            return;
        }

        const emailResult = validateEmail(emailInput.value);
        if (!emailResult.valid) {
            showError(emailError, emailResult.message);
            emailInput.focus();
            return;
        }

        const interestResult = validateInterest(interestSelect.value);
        if (!interestResult.valid) {
            showError(interestError, interestResult.message);
            interestSelect.focus();
            return;
        }

        let recaptchaResponse = '';
        try {
            recaptchaResponse = grecaptcha.getResponse();
        } catch (e) {
            recaptchaResponse = '';
        }

        if (!recaptchaResponse) {
            showError(captchaError, 'Please complete the reCAPTCHA check.');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        const formData = new FormData(form);

        fetch('https://signup-backend-hs67.onrender.com/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: nameResult.cleaned,
                email: emailResult.cleaned,
                interest: interestSelect.value,
                recaptcha: recaptchaResponse,
                website: honeypot ? honeypot.value : ''
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showFormStatus('Thank you. You are on the list.', 'success');
                form.reset();
                if (typeof grecaptcha !== 'undefined') grecaptcha.reset();
            } else {
                showFormStatus(data.message || 'Something went wrong. Please try again.', 'error');
            }
        })
        .catch(() => {
            showFormStatus('Something went wrong. Please try again.', 'error');
        })
        .finally(() => {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Subscribe';
        });
    });

    nameInput.addEventListener('input', function() {
        clearError(nameError);
        const result = validateName(this.value);
        if (result.valid) this.value = result.cleaned;
    });

    emailInput.addEventListener('input', function() {
        clearError(emailError);
        const result = validateEmail(this.value);
        if (result.valid) this.value = result.cleaned;
    });

    interestSelect.addEventListener('change', function() {
        clearError(interestError);
    });

})();