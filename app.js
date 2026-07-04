// =================================================================
// 1. ניהול הסטייט של האפליקציה ושמירה ב-localStorage
// =================================================================
const state = {
    hasActiveCycle: localStorage.getItem('hasActiveCycle') === 'true',
    changeTitle: localStorage.getItem('changeTitle') || '',
    stepTitle: localStorage.getItem('stepTitle') || '',
    cycleDay: parseInt(localStorage.getItem('cycleDay')) || 1,
    
    todaySuccesses: parseInt(localStorage.getItem('todaySuccesses')) || 0,
    cycleSuccesses: parseInt(localStorage.getItem('cycleSuccesses')) || 0,
    totalSuccesses: parseInt(localStorage.getItem('totalSuccesses')) || 0,
    checkinDone: localStorage.getItem('checkinDone') === 'true',
    currentCheckinStep: 1,
    selectedEmoji: null
};

// מחסן האפשרויות המובנה (סעיף 7 באפיון)[cite: 1]
const repository = {
    steps: [
        "לבחור מראש את ימי השתייה",
        "לא לשתות יומיים ברצף",
        "לא לקבל החלטה על שתייה לפני ארוחת ערב",
        "להחזיק משקה חלופי בבית (סודה, תה קר)"
    ],
    difficulties: ["סוף שבוע", "מפגש משפחתי", "יציאה עם חברים", "עייפות", "לחץ", "שעמום"],
    strategies: [
        "כשיש מפגש משפחתי ➔ להחליט מראש אם זה אחד מימי השתייה",
        "כשאני עייפה ➔ לא לקבל החלטה לפני שאכלתי ארוחת ערב",
        "למזוג משקה חלופי לכוס יפה מיד כשמגיעים הביתה"
    ],
    recovery: [
        "לחזור לתוכנית בבחירה הבאה",
        "לא לבטל את שאר השבוע בגלל אירוע אחד",
        "לא לנסות לפצות בארוחה הבאה",
        "להזכיר לעצמי שהמחזור הוא ניסוי"
    ]
};

// נתונים זמניים שנאספים במהלך מילוי ה-Wizard (סעיפים 5, 6, 8 באפיון)[cite: 1]
let wizardData = {
    currentStep: 1,
    changeTitle: "",
    originStatus: "",
    nextStep: "",
    whyImportant: "",
    whatToLearn: "",
    duration: 21,
    selectedSteps: [],
    selectedDifficulties: [],
    selectedStrategies: [],
    recoveryPlan: ""
};

// =================================================================
// 2. עדכון הממשק הגרפי (UI) והניווט
// =================================================================
function updateUI() {
    const emptyStateEl = document.getElementById('empty-active-cycle');
    const activeContentEl = document.getElementById('active-cycle-content');
    const subtitleEl = document.getElementById('cycle-day-subtitle');
    const circleEl = document.getElementById('cycle-progress-circle');

    if (state.hasActiveCycle) {
        // הצגת תוכן התוכנית והסתרת הדף הריק
        if (emptyStateEl) emptyStateEl.style.display = 'none';
        if (activeContentEl) activeContentEl.style.display = 'block';
        
        // עדכון טקסטים במסך הבית
        if (subtitleEl) subtitleEl.innerText = `יום ${state.cycleDay} מתוך 21`;
        if (circleEl) {
            circleEl.innerText = `${state.cycleDay}/21`;
            circleEl.classList.add('active');
        }
        
        const displayChange = document.getElementById('display-change-title');
        const displayStep = document.getElementById('display-step-title');
        if (displayChange) displayChange.innerText = state.changeTitle;
        if (displayStep) displayStep.innerText = state.stepTitle;
        
        // עדכון מונים
        document.getElementById('count-today').innerText = state.todaySuccesses;
        document.getElementById('count-cycle').innerText = state.cycleSuccesses;
        document.getElementById('count-total').innerText = state.totalSuccesses;
        
        const statusEl = document.getElementById('status-checkin');
        if (statusEl) {
            if (state.checkinDone) {
                statusEl.innerText = "הושלם בהצלחה! ✨";
                statusEl.style.color = "var(--success)";
            } else {
                statusEl.innerText = "טרם בוצע";
                statusEl.style.color = "var(--text-muted)";
            }
        }
    } else {
        // הצגת דף ריק כאשר אין תוכנית (סעיף 2 באפיון)[cite: 1]
        if (emptyStateEl) emptyStateEl.style.display = 'block';
        if (activeContentEl) activeContentEl.style.display = 'none';
        
        if (subtitleEl) subtitleEl.innerText = "ברוכה הבאה לתהליך";
        if (circleEl) {
            circleEl.innerText = "- / -";
            circleEl.classList.remove('active');
        }
    }
}

// ניווט בין הטאבים הראשיים
function switchView(viewId, targetBtn) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(`view-${viewId}`).classList.add('active');
    if (targetBtn) targetBtn.classList.add('active');

    // אם עברנו לטאב התוכנית, נרענן את ה-Wizard למצב העדכני שלו
    if (viewId === 'plan') {
        renderWizardStep();
    }
}

// =================================================================
// 3. לוגיקת ה-Wizard לבניית התוכנית (סעיפים 5, 6, 8 באפיון)[cite: 1]
// =================================================================
function renderWizardStep() {
    const card = document.getElementById('wizard-card-content');
    const indicator = document.getElementById('wizard-step-indicator');
    const bar = document.getElementById('wizard-progress-bar');
    const btnBack = document.getElementById('btn-wizard-back');
    const btnNext = document.getElementById('btn-wizard-next');
    
    if (!card) return; // הגנה למקרה שהאלמנטים טרם נטענו

    indicator.innerText = `שלב ${wizardData.currentStep}/11`;
    btnBack.style.visibility = wizardData.currentStep === 1 ? 'hidden' : 'visible';
    btnNext.innerText = wizardData.currentStep === 11 ? 'אישור והתחלת המחזור 🎉' : 'הבא';

    // עדכון סרגל שלבים ויזואלי (קוויות פרוגרס)
    bar.innerHTML = '';
    for(let i=1; i<=11; i++) {
        const dot = document.createElement('div');
        dot.style.flex = "1";
        dot.style.height = "6px";
        dot.style.borderRadius = "3px";
        dot.style.background = i <= wizardData.currentStep ? "var(--primary)" : "var(--border)";
        bar.appendChild(dot);
    }

    // הזרקת תוכן מותאם לכל שלב בנפרד
    switch(wizardData.currentStep) {
        case 1:
            document.getElementById('wizard-title').innerText = "מה אני רוצה לשנות?";
            card.innerHTML = `
                <p class="subtitle" style="margin-bottom:10px;">נסי למקד במשפט קצר את השינוי שאת רוצה ליצור כעת (סעיף 5):</p>
                <textarea id="w-changeTitle" style="width:100%; height:80px; padding:10px; border-radius:8px; border:1px solid var(--border);" placeholder="לדוגמה: להפחית את שתיית האלכוהול">${wizardData.changeTitle}</textarea>
            `;
            break;
        case 2:
            document.getElementById('wizard-title').innerText = "איפה אני נמצאת היום?";
            card.innerHTML = `
                <p class="subtitle" style="margin-bottom:10px;">הגדרת נקודת המוצא הנוכחית שלך:</p>
                <textarea id="w-origin" style="width:100%; height:80px; padding:10px; border-radius:8px; border:1px solid var(--border);" placeholder="לדוגמה: שותה כמעט כל ערב בסוף היום">${wizardData.originStatus}</textarea>
            `;
            break;
        case 3:
            document.getElementById('wizard-title').innerText = "מה הצעד הבא לניסוי?";
            card.innerHTML = `
                <p class="subtitle" style="margin-bottom:10px;">לא היעד הסופי, אלא צעד קטן ומעשי שאפשר לנסות כרגע:</p>
                <input type="text" id="w-nextStep" value="${wizardData.nextStep}" style="width:100%; padding:10px; border-radius:8px; border:1px solid var(--border);" placeholder="לדוגמה: יום כן - יום לא / עד פעמיים בשבוע">
            `;
            break;
        case 4:
            document.getElementById('wizard-title').innerText = "למה השינוי חשוב לי?";
            card.innerHTML = `
                <p class="subtitle" style="margin-bottom:10px;">טקסט אישי קצר שיזכיר לך את המנוע מאחורי הניסוי:</p>
                <textarea id="w-why" style="width:100%; height:80px; padding:10px; border-radius:8px; border:1px solid var(--border);">${wizardData.whyImportant}</textarea>
            `;
            break;
        case 5:
            document.getElementById('wizard-title').innerText = "מה אני רוצה ללמוד?";
            card.innerHTML = `
                <p class="subtitle" style="margin-bottom:10px;">מה את רוצה לגלות על עצמך במהלך 21 הימים האלו?</p>
                <textarea id="w-learn" style="width:100%; height:80px; padding:10px; border-radius:8px; border:1px solid var(--border);" placeholder="לדוגמה: באילו רגעים הצורך עולה והאם משקה חלופי באמת מספק אותי">${wizardData.whatToLearn}</textarea>
            `;
            break;
        case 6:
            document.getElementById('wizard-title').innerText = "תקופת הניסוי";
            card.innerHTML = `
                <p class="subtitle" style="margin-bottom:15px;">מחזור השינוי מוגדר כניסוי תחום בזמן כדי להוריד לחץ.</p>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span>משך הניסוי (ימים):</span>
                    <input type="number" id="w-duration" value="${wizardData.duration}" style="width:80px; padding:8px; text-align:center; border-radius:8px; border:1px solid var(--border);">
                </div>
                <p class="subtitle" style="margin-top:15px; font-size:12px;">ברירת המחדל המומלצת היא 21 יום.</p>
            `;
            break;
        case 7:
            document.getElementById('wizard-title').innerText = "הצעדים המעשיים שלי";
            card.innerHTML = `<p class="subtitle" style="margin-bottom:10px;">בחרי צעדים שיעזרו לך ליישם (סעיף 6):</p>` + 
                renderCheckboxList(repository.steps, wizardData.selectedSteps, 'selectedSteps') +
                `<input type="text" placeholder="+ הוספת צעד אישי משלך" onchange="addNewOptionToWizard(this, 'selectedSteps')" style="width:100%; padding:10px; margin-top:10px; border-radius:8px; border:1px dashed var(--primary);">`;
            break;
        case 8:
            document.getElementById('wizard-title').innerText = "מתי צפוי להיות קשה?";
            card.innerHTML = `<p class="subtitle" style="margin-bottom:10px;">זיהוי מראש של מצבים מאתגרים (אופציונלי):</p>` + 
                renderCheckboxList(repository.difficulties, wizardData.selectedDifficulties, 'selectedDifficulties') +
                `<input type="text" placeholder="+ הוספת מצב קשה אישי" onchange="addNewOptionToWizard(this, 'selectedDifficulties')" style="width:100%; padding:10px; margin-top:10px; border-radius:8px; border:1px dashed var(--primary);">`;
            break;
        case 9:
            document.getElementById('wizard-title').innerText = "מה יכול לעזור לי?";
            card.innerHTML = `<p class="subtitle" style="margin-bottom:10px;">אסטרטגיות למצבים הקשים שסימנת (אופציונלי):</p>` + 
                renderCheckboxList(repository.strategies, wizardData.selectedStrategies, 'selectedStrategies') +
                `<input type="text" placeholder="+ הוספת אסטרטגיה אישית" onchange="addNewOptionToWizard(this, 'selectedStrategies')" style="width:100%; padding:10px; margin-top:10px; border-radius:8px; border:1px dashed var(--primary);">`;
            break;
        case 10:
            document.getElementById('wizard-title').innerText = "תוכנית החזרה שלי";
            card.innerHTML = `<p class="subtitle" style="margin-bottom:10px;">מה יעזור לך להמשיך הלאה אם לא פעלת לפי התוכנית? (סעיף 6):</p>` +
                renderRadioList(repository.recovery, wizardData.recoveryPlan, 'recoveryPlan') +
                `<textarea id="w-customRecovery" style="width:100%; height:60px; margin-top:10px; padding:10px; border-radius:8px; border:1px solid var(--border);" placeholder="או כתבי תוכנית חזרה מותאמת אישית">${repository.recovery.includes(wizardData.recoveryPlan) ? '' : wizardData.recoveryPlan}</textarea>`;
            break;
        case 11:
            document.getElementById('wizard-title').innerText = "סיכום ואישור התוכנית";
            card.innerHTML = `
                <div style="font-size:14px; display:flex; flex-direction:column; gap:10px; line-height:1.5;">
                    <div><strong>השינוי שלי:</strong> ${wizardData.changeTitle || 'לא הוגדר'}</div>
                    <div><strong>נקודת מוצא:</strong> ${wizardData.originStatus || 'לא הוגדר'}</div>
                    <div><strong>הצעד הבא:</strong> ${wizardData.nextStep || 'לא הוגדר'}</div>
                    <div><strong>הצעדים שבחרתי:</strong> ${wizardData.selectedSteps.join(', ') || 'ללא'}</div>
                    <div><strong>מצבים מאתגרים:</strong> ${wizardData.selectedDifficulties.join(', ') || 'ללא'}</div>
                    <div><strong>אסטרטגיות:</strong> ${wizardData.selectedStrategies.join(', ') || 'ללא'}</div>
                    <div><strong>תוכנית החזרה:</strong> ${wizardData.recoveryPlan || 'חזרה בבחירה הבאה'}</div>
                    <div><strong>מה אלמד:</strong> ${wizardData.whatToLearn || 'לא הוגדר'}</div>
                    <div><strong>משך הניסוי:</strong> ${wizardData.duration} ימים</div>
                </div>
            `;
            break;
    }
}

// פונקציות עזר לייצור רשימות בחירה ב-Wizard
function renderCheckboxList(items, selectedArray, propertyName) {
    return `<div class="checkbox-list">` + items.map(item => {
        const checked = selectedArray.includes(item) ? 'checked' : '';
        return `<label class="checkbox-item"><input type="checkbox" value="${item}" ${checked} onchange="toggleWizardCheckbox('${propertyName}', '${item}')"> <span>${item}</span></label>`;
    }).join('') + `</div>`;
}

function renderRadioList(items, selectedValue, propertyName) {
    return `<div class="checkbox-list">` + items.map(item => {
        const checked = selectedValue === item ? 'checked' : '';
        return `<label class="checkbox-item"><input type="radio" name="wizard-radio" value="${item}" ${checked} onchange="wizardData.recoveryPlan = '${item}'.trim()"> <span>${item}</span></label>`;
    }).join('') + `</div>`;
}

function toggleWizardCheckbox(property, value) {
    const idx = wizardData[property].indexOf(value);
    if(idx > -1) wizardData[property].splice(idx, 1);
    else wizardData[property].push(value);
}

function addNewOptionToWizard(inputElement, property) {
    const val = inputElement.value.trim();
    if (val) {
        wizardData[property].push(val);
        if (property === 'selectedSteps') repository.steps.push(val);
        if (property === 'selectedDifficulties') repository.difficulties.push(val);
        if (property === 'selectedStrategies') repository.strategies.push(val);
        renderWizardStep();
    }
}

// ניווט קדימה - קורא ערכים מהקלט רק ברגע הלחיצה כדי למנוע אובדן פוקוס מהמקלדת
function wizardNext() {
    if (wizardData.currentStep === 1 && document.getElementById('w-changeTitle')) wizardData.changeTitle = document.getElementById('w-changeTitle').value;
    if (wizardData.currentStep === 2 && document.getElementById('w-origin')) wizardData.originStatus = document.getElementById('w-origin').value;
    if (wizardData.currentStep === 3 && document.getElementById('w-nextStep')) wizardData.nextStep = document.getElementById('w-nextStep').value;
    if (wizardData.currentStep === 4 && document.getElementById('w-why')) wizardData.whyImportant = document.getElementById('w-why').value;
    if (wizardData.currentStep === 5 && document.getElementById('w-learn')) wizardData.whatToLearn = document.getElementById('w-learn').value;
    if (wizardData.currentStep === 6 && document.getElementById('w-duration')) wizardData.duration = parseInt(document.getElementById('w-duration').value) || 21;
    if (wizardData.currentStep === 10 && document.getElementById('w-customRecovery')) {
        const customRec = document.getElementById('w-customRecovery').value.trim();
        if(customRec) wizardData.recoveryPlan = customRec;
    }

    if (wizardData.currentStep < 11) {
        wizardData.currentStep++;
        renderWizardStep();
    } else {
        // שלב 11 - שמירה סופית והפעלת המחזור (סעיף 8 באפיון)[cite: 1]
        state.hasActiveCycle = true;
        state.changeTitle = wizardData.changeTitle || "שינוי אישי";
        state.stepTitle = wizardData.nextStep || "צעד ראשון";
        state.cycleDay = 1;
        state.checkinDone = false;
        state.todaySuccesses = 0;
        state.cycleSuccesses = 0;
        
        saveState();
        updateUI();
        
        // חזרה אוטומטית למסך הבית
        switchView('today', document.querySelector('.nav-item'));
        
        // איפוס ה-Wizard לפעם הבאה
        wizardData.currentStep = 1;
    }
}

// ניווט אחורה - שומר את הטקסט לפני החזרה שלב
function wizardBack() {
    if (wizardData.currentStep === 1 && document.getElementById('w-changeTitle')) wizardData.changeTitle = document.getElementById('w-changeTitle').value;
    if (wizardData.currentStep === 2 && document.getElementById('w-origin')) wizardData.originStatus = document.getElementById('w-origin').value;
    if (wizardData.currentStep === 3 && document.getElementById('w-nextStep')) wizardData.nextStep = document.getElementById('w-nextStep').value;
    if (wizardData.currentStep === 4 && document.getElementById('w-why')) wizardData.whyImportant = document.getElementById('w-why').value;
    if (wizardData.currentStep === 5 && document.getElementById('w-learn')) wizardData.whatToLearn = document.getElementById('w-learn').value;
    if (wizardData.currentStep === 6 && document.getElementById('w-duration')) wizardData.duration = parseInt(document.getElementById('w-duration').value) || 21;

    if (wizardData.currentStep > 1) {
        wizardData.currentStep--;
        renderWizardStep();
    }
}

// =================================================================
// 4. לוגיקת ה-Check-in היומי (סעיפים 9, 10, 11, 12 באפיון)[cite: 1]
// =================================================================
function openCheckin() {
    state.currentCheckinStep = 1;
    state.selectedEmoji = null;
    document.getElementById('checkin-step2').style.display = 'none';
    document.getElementById('btn-next-checkin').innerText = 'הבא';
    document.getElementById('btn-next-checkin').disabled = true;
    document.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('selected'));
    
    document.querySelectorAll('#checkin-step2 input').forEach(i => i.checked = false);
    switchView('checkin', null);
}

function selectEmoji(type, element) {
    document.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('selected'));
    element.classList.add('selected');
    state.selectedEmoji = type;
    document.getElementById('btn-next-checkin').disabled = false;
}

function nextCheckinStep() {
    if (state.currentCheckinStep === 1) {
        state.currentCheckinStep = 2;
        document.getElementById('checkin-step2').style.display = 'block';
        document.getElementById('btn-next-checkin').innerText = 'סיום שמירה';
    } else if (state.currentCheckinStep === 2) {
        const checkedBoxes = document.querySelectorAll('#checkin-step2 input:checked').length;
        
        state.todaySuccesses += checkedBoxes;
        state.cycleSuccesses += checkedBoxes;
        state.totalSuccesses += checkedBoxes;
        state.checkinDone = true;
        
        saveState();
        updateUI();
        switchView('today', document.querySelector('.nav-item'));
    }
}

// הוספת הצלחה מהירה ממסך הבית (סעיף 13 באפיון)[cite: 1]
function quickAddSuccess() {
    state.todaySuccesses += 1;
    state.cycleSuccesses += 1;
    state.totalSuccesses += 1;
    saveState();
    updateUI();
    showToast();
}

function showToast() {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.style.display = 'block';
        setTimeout(() => { toast.style.display = 'none'; }, 2000);
    }
}

function saveState() {
    localStorage.setItem('hasActiveCycle', state.hasActiveCycle);
    localStorage.setItem('changeTitle', state.changeTitle);
    localStorage.setItem('stepTitle', state.stepTitle);
    localStorage.setItem('cycleDay', state.cycleDay);
    localStorage.setItem('todaySuccesses', state.todaySuccesses);
    localStorage.setItem('cycleSuccesses', state.cycleSuccesses);
    localStorage.setItem('totalSuccesses', state.totalSuccesses);
    localStorage.setItem('checkinDone', state.checkinDone);
}

// רישום ה-Service Worker לעבודה אופליין
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(err => console.log('SW registration failed:', err));
    });
}

// אתחול האפליקציה בטעינה הראשונה
updateUI();
