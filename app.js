// ניהול הסטייט של האפליקציה עם שמירה ב-localStorage
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

// עדכון התצוגה של המסכים והמונים
function updateUI() {
    const emptyStateEl = document.getElementById('empty-active-cycle');
    const activeContentEl = document.getElementById('active-cycle-content');
    const subtitleEl = document.getElementById('cycle-day-subtitle');
    const circleEl = document.getElementById('cycle-progress-circle');

    if (state.hasActiveCycle) {
        // הצגת תוכן התוכנית והסתרת הדף הריק
        emptyStateEl.style.display = 'none';
        activeContentEl.style.display = 'block';
        
        // עדכון טקסטים
        subtitleEl.innerText = `יום ${state.cycleDay} מתוך 21`;
        circleEl.innerText = `${state.cycleDay}/21`;
        circleEl.classList.add('active');
        
        document.getElementById('display-change-title').innerText = state.changeTitle;
        document.getElementById('display-step-title').innerText = state.stepTitle;
        
        // עדכון מונים
        document.getElementById('count-today').innerText = state.todaySuccesses;
        document.getElementById('count-cycle').innerText = state.cycleSuccesses;
        document.getElementById('count-total').innerText = state.totalSuccesses;
        
        const statusEl = document.getElementById('status-checkin');
        if (state.checkinDone) {
            statusEl.innerText = "הושלם בהצלחה! ✨";
            statusEl.style.color = "var(--success)";
        } else {
            statusEl.innerText = "טרם בוצע";
            statusEl.style.color = "var(--text-muted)";
        }
    } else {
        // הצגת דף ריק כאשר אין תוכנית
        emptyStateEl.style.display = 'block';
        activeContentEl.style.display = 'none';
        
        subtitleEl.innerText = "ברוכה הבאה לתהליך";
        circleEl.innerText = "- / -";
        circleEl.classList.remove('active');
    }
}

// ניקוי או הזנת סימולציה של תוכנית (לצרכי בדיקה לפני בניית ה-Wizard המלא)
function simulateCreatePlan() {
    state.hasActiveCycle = true;
    state.changeTitle = "להפחית את שתיית האלכוהול";
    state.stepTitle = "עד פעמיים בשבוע";
    state.cycleDay = 1;
    state.checkinDone = false;
    state.todaySuccesses = 0;
    state.cycleSuccesses = 0;
    
    saveState();
    updateUI();
    switchView('today', document.querySelector('.nav-item'));
}

// ניווט בין הטאבים הראשיים
function switchView(viewId, targetBtn) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(`view-${viewId}`).classList.add('active');
    if (targetBtn) targetBtn.classList.add('active');
}

// הוספת הצלחה מהירה מחוץ ל-Check-in
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
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 2000);
}

// לוגיקת ה-Check-in היומי
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

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(err => console.log('SW registration failed:', err));
    });
}

// אתחול ראשוני בהרצה
updateUI();
