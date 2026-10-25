/* =========================================================
   Hire 005x5 – script.js
   Technik übernommen aus dem Ban-Appeal-Skript:
   - direkter fetch an WEBHOOK_URL
   - Payload mit username + embeds
   - showStatus(message, type)
   ========================================================= */

const WEBHOOK_URL = 'https://discord.com/api/webhooks/1562877318278684683/NwG-CW9Dnig2pdcDK8I4KCguklry8P91BJroZRqZGdkSiq44wXJgWy3sVmywDKqUCRv5';

const form = document.getElementById('hireForm');
const discordNameInput = document.getElementById('discordName');
const taskInput = document.getElementById('task');
const amountInput = document.getElementById('amount');
const submitBtn = document.getElementById('submitBtn');
const clearBtn = document.getElementById('clearBtn');
const statusEl = document.getElementById('statusMessage');
const statusCounter = document.getElementById('statusCounter');
const btnText = document.querySelector('.btn-text');
const spinner = document.querySelector('.spinner');

let requestCount = 0;
let isSubmitting = false;

/* ---------- Betrag automatisch formatieren ---------- */
function formatAmount(raw) {
    let clean = raw.replace(/[^0-9.]/g, '');

    // Nur ein Punkt erlauben
    const dotIndex = clean.indexOf('.');
    if (dotIndex !== -1) {
        clean = clean.slice(0, dotIndex + 1) + clean.slice(dotIndex + 1).replace(/\./g, '');
    }

    // Punkt vorhanden → max 2 Dezimalstellen
    if (clean.includes('.')) {
        const [intPart, decPart = ''] = clean.split('.');
        return (intPart || '0') + '.' + decPart.slice(0, 2);
    }

    // Kein Punkt → letzte 2 Ziffern werden Dezimalen
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
    if (!isNaN(num)) this.value = num.toFixed(2);
});

function isValidNumber(value) {
    if (!value) return false;
    const num = parseFloat(value);
    return !isNaN(num) && num > 0 && /^\d+(\.\d{1,2})?$/.test(value);
}

/* ---------- Status-Anzeige (Technik aus Appeal-Skript) ---------- */
function showStatus(message, type) {
    statusEl.textContent = message;
    statusEl.className = 'status-message ' + (type || '');
    if (!message) statusEl.className = 'status-message';
}

function updateCounter() {
    statusCounter.textContent = `${requestCount} request${requestCount === 1 ? '' : 's'} sent`;
}

/* ---------- Clear ---------- */
clearBtn.addEventListener('click', function (e) {
    e.preventDefault();
    form.reset();
    showStatus('', '');
});

/* ---------- Submit ---------- */
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const discordName = discordNameInput.value.trim();
    const task = taskInput.value.trim();
    const amount = amountInput.value.trim();

    if (!discordName || !task || !amount) {
        showStatus('Please fill in all fields.', 'error');
        return;
    }

    if (!isValidNumber(amount)) {
        showStatus('Please enter a valid amount (e.g. 10.50)', 'error');
        amountInput.focus();
        return;
    }

    const formattedAmount = parseFloat(amount).toFixed(2) + '$';

    isSubmitting = true;
    submitBtn.disabled = true;
    if (btnText) btnText.textContent = 'Sending...';
    if (spinner) spinner.style.display = 'inline-block';
    showStatus('', '');

    const payload = {
        username: 'Hire 005x5 System',
        embeds: [
            {
                title: 'New Hire Request - 005x5',
                color: 0x5865F2,
                fields: [
                    { name: 'Discord Name', value: discordName, inline: false },
                    { name: 'Task', value: task, inline: false },
                    { name: 'Amount', value: formattedAmount, inline: false },
                    { name: 'Timestamp', value: new Date().toLocaleString('en-US'), inline: false }
                ],
                timestamp: new Date().toISOString(),
                footer: { text: 'Hire 005x5 System - He will send you a DM later' }
            }
        ]
    };

    try {
        const res = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            requestCount++;
            updateCounter();
            showStatus('Request sent successfully! 005x5 will DM you soon.', 'success');
            form.reset();
        } else {
            const errData = await res.json().catch(() => ({}));
            console.error('Webhook error:', res.status, errData);
            showStatus('Failed to submit. Please try again later.', 'error');
        }
    } catch (err) {
        console.error(err);
        showStatus('Network error. Please try again.', 'error');
    } finally {
        isSubmitting = false;
        submitBtn.disabled = false;
        if (btnText) btnText.textContent = 'Send Request';
        if (spinner) spinner.style.display = 'none';
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
