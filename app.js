
const CONDS = [
    "Diabetes",
    "Hypertension",
    "Asthma",
    "Heart Disease",
    "Epilepsy",
    "Thyroid"
];
const selected = new Set();

const chipsEl = document.getElementById('cond-chips');

CONDS.forEach(condition => {
    const btn = document.createElement('button');
    btn.className  = 'chip';
    btn.textContent = condition;

    btn.onclick = () => {
        if (selected.has(condition)) {
            selected.delete(condition);
        } else {
            selected.add(condition);
        }
        btn.classList.toggle('on');
    };

    chipsEl.appendChild(btn);
});



function goStep(stepNumber) {

    if (stepNumber === 1) {
        const name  = document.getElementById('name').value.trim();
        const blood = document.getElementById('blood').value;

        if (!name) {
            alert('Name bharo!');
            return;
        }
        if (!blood) {
            alert('Blood group select karo!');
            return;
        }
    }

    [0, 1, 2].forEach(i => {
        const stepEl = document.getElementById('step' + i);
        const dotEl  = document.getElementById('s' + i);

        stepEl.style.display = (i === stepNumber) ? 'block' : 'none';

        if (i === stepNumber) {
            dotEl.className = 'step active';
        } else if (i < stepNumber) {
            dotEl.className = 'step done';
        } else {
            dotEl.className = 'step';
        }
    });

    document.getElementById('qr-done').style.display = 'none';
    document.getElementById('steps').style.display   = 'flex';
}



/**
 * 
 * @param {string} id - The element ID
 * @returns {string}
 */
function getVal(id) {
    return document.getElementById(id).value.trim();
}

/**
 * Builds the plain text that will be encoded into the QR code.
 * Uses \r\n for proper line breaks on all phone scanners.
 * @returns {string}
 */
function buildText() {
    const lines = [];

    // Header
    lines.push('=== SOS EMERGENCY ===');

    // Personal Info
    lines.push('Name: '  + getVal('name'));
    if (getVal('age'))   lines.push('Age: '   + getVal('age'));
    if (getVal('blood')) lines.push('Blood: ' + getVal('blood'));

    lines.push('---');

    // Medical Info
    if (getVal('allergies')) lines.push('ALLERGIES: '  + getVal('allergies'));
    if (getVal('meds'))      lines.push('Meds: '       + getVal('meds'));
    if (selected.size)       lines.push('Conditions: ' + [...selected].join(', '));
    if (getVal('notes'))     lines.push('Notes: '      + getVal('notes'));

    lines.push('--- CONTACTS ---');

    // Emergency Contacts
    if (getVal('c1name'))  lines.push(getVal('c1name') + ': '  + getVal('c1phone'));
    if (getVal('c2name'))  lines.push(getVal('c2name') + ': '  + getVal('c2phone'));
    if (getVal('docname')) lines.push('Dr.' + getVal('docname') + ': ' + getVal('docphone'));

    // Join with \r\n — works correctly on Android, iPhone, and all QR scanners
    return lines.join('\r\n');
}



function generateQR() {
    const text = buildText();

    [0, 1, 2].forEach(i => {
        document.getElementById('step' + i).style.display = 'none';
    });
    document.getElementById('steps').style.display = 'none';

    document.getElementById('qr-done').style.display = 'block';

    const qrContainer = document.getElementById('qrcode');
    qrContainer.innerHTML = '';

    new QRCode(qrContainer, {
        text          : text,
        width         : 256,
        height        : 256,
        colorDark     : '#000000',
        colorLight    : '#ffffff',
        correctLevel  : QRCode.CorrectLevel.M
    });
}

function downloadQR() {
    const img = document.querySelector('#qrcode img');

    if (!img) {
        alert('QR generate karo pehle!');
        return;
    }

    const link      = document.createElement('a');
    link.href       = img.src;
    link.download   = 'MedAlert_QR.png';
    link.click();
}


const urlParams = new URLSearchParams(window.location.search);
const encodedData = urlParams.get('d');

if (encodedData) {
    try {
        const patient = JSON.parse(decodeURIComponent(escape(atob(encodedData))));

        document.getElementById('app').style.display       = 'none';
        document.getElementById('emergency').style.display = 'block';
        document.body.style.background = '#f5f5f5';
        document.body.style.padding    = '0';

        document.getElementById('e-name').textContent = patient.name || '—';

        const pillsContainer = document.getElementById('e-pills');
        if (patient.age)   pillsContainer.innerHTML += `<span class="pill">Age: ${patient.age}</span>`;
        if (patient.blood) pillsContainer.innerHTML += `<span class="pill red">🩸 ${patient.blood}</span>`;

        // Medical info rows
        const medContainer = document.getElementById('e-medical');
        if (patient.allergies)          medContainer.innerHTML += infoRow('#e64a19', '⚠️', 'ALLERGIES',   patient.allergies);
        if (patient.meds)               medContainer.innerHTML += infoRow('#1565c0', '💊', 'MEDICATIONS', patient.meds);
        if (patient.conditions?.length) medContainer.innerHTML += infoRow('#6a1b9a', '🏥', 'CONDITIONS',  patient.conditions.join(', '));
        if (patient.notes)              medContainer.innerHTML += infoRow('#2e7d32', '📝', 'NOTES',       patient.notes);

        // Emergency contact cards
        const contactsContainer = document.getElementById('e-contacts');
        if (patient.c1name)  contactsContainer.innerHTML += callCard(patient.c1name,                    patient.c1phone,  false);
        if (patient.c2name)  contactsContainer.innerHTML += callCard(patient.c2name,                    patient.c2phone,  false);
        if (patient.docname) contactsContainer.innerHTML += callCard('👨‍⚕️ Dr.' + patient.docname,  patient.docphone, true);

    } catch (error) {
        console.error('Emergency page decode error:', error);
    }
}



/**
 * 
 * @param {string} color  
 * @param {string} icon   
 * @param {string} label  
 * @param {string} value  
 * @returns {string}
 */
function infoRow(color, icon, label, value) {
    return `
        <div class="info-row" style="border-left: 4px solid ${color}">
            <div class="ilabel">${icon} ${label}</div>
            <div class="ival">${value}</div>
        </div>
    `;
}

/**
 * 
 * @param {string}  name   
 * @param {string}  phone  
 * @param {boolean} isDoc 
 * @returns {string} 
 */
function callCard(name, phone, isDoc) {
    const borderClass = isDoc ? 'green-border' : 'red-border';
    const btnClass    = isDoc ? 'green'        : 'red';
    const btnLabel    = isDoc ? 'CALL DOC'     : 'CALL NOW';

    return `
        <a href="tel:${phone}" class="call-card ${borderClass}">
            <div>
                <div class="cname">${name}</div>
                <div class="cphone">${phone}</div>
            </div>
            <div class="call-btn ${btnClass}">${btnLabel}</div>
        </a>
    `;
}