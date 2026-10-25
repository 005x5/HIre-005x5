
document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('hireForm');
    const discordNameInput = document.getElementById('discordName');
    const taskInput = document.getElementById('task');
    const amountInput = document.getElementById('amount');
    const submitBtn = document.getElementById('submitBtn');
    const clearBtn = document.getElementById('clearBtn');
    const statusMessage = document.getElementById('statusMessage');
    const statusCounter = document.getElementById('statusCounter');
    const btnText = document.querySelector('.btn-text');
    const spinner = document.querySelector('.spinner');

    const WEBHOOK_URL = 'https://discord.com/api/webhooks/1564000456143798374/Toz7u_3riFn69MbJGiVRLKxF81P4cKio6BaSenxScrMxifkzwUTYgR1461XbrlOezuZN';
    let requestCount = 0;
    let isSubmitting = false;

    /* ---------- Amount Formatierung ---------- */
    function formatAmount(raw) {
        // Nur Ziffern und einen Punkt zulassen
        let clean = raw.replace(/[^0-9.]/g, '');

        // Nur ein Punkt
        const dotIndex = clean.indexOf('.');
        if (dotIndex !== -1) {
            clean = clean.slice(0, dotIndex + 1) + clean.slice(dotIndex + 1).replace(/\./g, '');
        }

        // Wenn ein Punkt existiert: max 2 Dezimalstellen
        if (clean.includes('.')) {
            const [intPart, decPart = ''] = clean.split('.');
            return (intPart || '0') + '.' + decPart.slice(0, 2);
        }

        // Kein Punkt → Cent-Logik: letzte 2 Ziffern werden Dezimalen
        if (clean.length === 0) return '';
        if (clean.length === 1) return '0.0' + clean;
        if (clean.length === 2) return '0.' + clean;
        return clean.slice(0, -2) + '.' + clean.slice(-2);
    }

    amountInput.addEventListener('input', function () {
        const cursor = this.selectionStart;
        const oldLen = this.value.length;
        this.value = formatAmount(this.value);
        const diff = this.value.length - oldLen;
        const newPos = Math.max(0, cursor + diff);
        this.setSelectionRange(newPos, newPos);
    });

    amountInput.addEventListener('blur', function () {
        if (!this.value) return;
        const num = parseFloat(this.value);
        if (!isNaN(num)) {
            this.value = num.toFixed(2);
        }
    });

    function isValidNumber(value) {
        if (!value) return false;
        const num = parseFloat(value);
        return !isNaN(num) && num > 0 && /^\d+(\.\d{1,2})?$/.test(value);
    }

    /* ---------- Status Helper ---------- */
    function showStatus(message, type = 'info', autoHide = true) {
        statusMessage.textContent = message;
        statusMessage.className = 'status-message ' + type;
        statusMessage.style.display = 'block';

        if (autoHide && (type === 'success' || type === 'error')) {
            setTimeout(() => {
                statusMessage.style.display = 'none';
            }, 5000);
        }
    }

    function updateCounter() {
        statusCounter.textContent = `${requestCount} request${requestCount === 1 ? '' : 's'} sent`;
    }

    /* ---------- Clear ---------- */
    clearBtn.addEventListener('click', function (e) {
        e.preventDefault();
        form.reset();
        statusMessage.style.display = 'none';
        showStatus('Form cleared', 'info', false);
    });

    /* ---------- Submit ---------- */
    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        if (isSubmitting) return;

        const discordName = discordNameInput.value.trim();
        if (!discordName) {
            showStatus('Please enter your Discord name', 'error');
            discordNameInput.focus();
            return;
        }

        const task = taskInput.value.trim();
        if (!task) {
            showStatus('Please describe your task', 'error');
            taskInput.focus();
            return;
        }

        const amount = amountInput.value.trim();
        if (!amount || !isValidNumber(amount)) {
            showStatus('Please enter a valid amount (e.g. 10.50)', 'error');
            amountInput.focus();
            return;
        }

        const formattedAmount = parseFloat(amount).toFixed(2) + '$';

        isSubmitting = true;
        submitBtn.disabled = true;
        btnText.textContent = 'Sending...';
        spinner.style.display = 'inline-block';

        const embed = {
            title: 'New Hire Request - 005x5',
            color: 0x5865F2,
            fields: [
                { name: 'Discord Name', value: discordName, inline: false },
                { name: 'Task', value: task, inline: false },
                { name: 'Amount', value: formattedAmount, inline: false },
                { name: 'Timestamp', value: new Date().toLocaleString('en-US'), inline: false }
            ],
            footer: { text: 'Hire 005x5 System - He will send you a DM later' },
            timestamp: new Date().toISOString()
        };

        try {
            const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(WEBHOOK_URL);

            const response = await fetch(proxyUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ embeds: [embed] })
            });

            if (response.ok || response.status === 204) {
                requestCount++;
                updateCounter();
                showStatus('Request sent successfully! 005x5 will DM you soon.', 'success');
                form.reset();
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error('Webhook error:', response.status, errorData);
                showStatus('Error sending request. Please try again later.', 'error');
            }
        } catch (error) {
            console.error('Network error:', error);
            showStatus('Network error. Please check your internet connection.', 'error');
        } finally {
            isSubmitting = false;
            submitBtn.disabled = false;
            btnText.textContent = 'Send Request';
            spinner.style.display = 'none';
        }
    });

    /* ---------- Enter-Taste (ohne Doppel-Submit) ---------- */
    form.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            if (!isSubmitting) form.requestSubmit();
        }
    });

    updateCounter();
});
