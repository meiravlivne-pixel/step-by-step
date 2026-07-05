/**
 * "התוכנית" - אפליקציה לבניית שינוי התנהגותי
 * קובץ לוגיקה ראשי (app.js)
 */

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. רישום SERVICE WORKER (PWA)
    // ==========================================
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('Service Worker רשום בהצלחה!', reg.scope))
            .catch(err => console.log('רישום Service Worker נכשל:', err));
    }

    // ==========================================
    // 2. ניהול הניווט הראשי (BOTTOM NAV)
    // ==========================================
    const navItems = document.querySelectorAll('.nav-item');
    const screens = document.querySelectorAll('.app-screen');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetScreenId = item.getAttribute('data-screen');

            // עדכון מצב פעיל בכפתורי הניווט
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // החלפת המסך המוצג
            screens.forEach(screen => {
                screen.classList.remove('active');
                if (screen.id === targetScreenId) {
                    screen.classList.add('active');
                }
            });
        });
    });

    // ==========================================
    // 3. משתנים ומצב ה-WIZARD לבניית מחזור
    // ==========================================
    let newCycleData = {
        title: '',
        startingPoint: '',
        nextStep: '',
        whyImportant: '',
        whatToLearn: '',
        durationDays: 21,
        startDate: null,
        endDate: null
    };

    let currentStep = 1;
    const totalSteps = 6;

    // אלמנטים ב-DOM של ה-Wizard
    const wizardOverlay = document.getElementById('wizard-overlay');
    const stepPages = document.querySelectorAll('.wizard-step-page');
    const dots = document.querySelectorAll('.wizard-progress-dots .dot');
    const nextBtn = document.getElementById('wizard-next-btn');
    const backBtn = document.getElementById('wizard-back-btn');
    const closeBtn = document.getElementById('wizard-close-btn');
    
    // שדות קלט ומוני תווים
    const changeTitleInput = document.getElementById('input-change-title');
    const titleCharCount = document.getElementById('title-char-count');
    const nextStepInput = document.getElementById('input-next-step');
    const stepCharCount = document.getElementById('step-char-count');
    const reviewDateDisplay = document.getElementById('review-date-display');

    // ==========================================
    // 4. פונקציות ה-WIZARD
    // ==========================================
    window.openWizard = function() {
        currentStep = 1;
        newCycleData.startDate = new Date();
        calculateEndDate();
        updateWizardUI();
        wizardOverlay.classList.add('active');
    };

    function calculateEndDate() {
        const end = new Date(newCycleData.startDate);
        end.setDate(end.getDate() + newCycleData.durationDays);
        newCycleData.endDate = end;
        
        // הצגת תאריך בפורמט ישראלי (למשל: 26.7.2026)
        reviewDateDisplay.textContent = `${end.getDate()}.${end.getMonth() + 1}.${end.getFullYear()}`;
    }

    function updateWizardUI() {
        // עדכון נראות דפי השלבים
        stepPages.forEach(page => {
            page.classList.remove('active');
            if (parseInt(page.getAttribute('data-step')) === currentStep) {
                page.classList.add('active');
            }
        });

        // עדכון נקודות ההתקדמות העליונות
        dots.forEach(dot => {
            dot.classList.remove('active');
            if (parseInt(dot.getAttribute('data-step')) === currentStep) {
                dot.classList.add('active');
            }
        });

        // ניהול נראות כפתור החזרה (מוסתר בשלב 1)
        if (currentStep === 1) {
            backBtn.style.visibility = 'hidden';
        } else {
            backBtn.style.visibility = 'visible';
        }

        // שינוי טקסט כפתור הפעולה הראשי בשלב האחרון
        if (currentStep === totalSteps) {
            nextBtn.textContent = 'אישור והתחלת המחזור';
        } else {
            nextBtn.textContent = 'המשך';
        }
    }

    // מאזינים לשינויי קלט ועדכון המונים בזמן אמת
    changeTitleInput.addEventListener('input', (e) => {
        titleCharCount.textContent = e.target.value.length;
        newCycleData.title = e.target.value;
    });

    nextStepInput.addEventListener('input', (e) => {
        stepCharCount.textContent = e.target.value.length;
        newCycleData.nextStep = e.target.value;
    });

    // ניווט קדימה / אישור ב-Wizard
    nextBtn.addEventListener('click', () => {
        if (currentStep < totalSteps) {
            // שמירת מידע משדות הטקסט של השלבים הנוכחיים לפני המעבר
            if (currentStep === 2) newCycleData.startingPoint = document.getElementById('input-starting-point').value;
            if (currentStep === 4) newCycleData.whyImportant = document.getElementById('input-why-important').value;
            if (currentStep === 5) newCycleData.whatToLearn = document.getElementById('input-what-to-learn').value;

            currentStep++;
            updateWizardUI();
        } else {
            // הגענו לשלב 6 ואושר - שומרים ומפעילים את המחזור
            saveCycleAndStart();
        }
    });

    // ניווט אחורה ב-Wizard
    backBtn.addEventListener('click', () => {
        if (currentStep > 1) {
            currentStep--;
            updateWizardUI();
        }
    });

    // סגירת ה-Wizard (ביטול)
    closeBtn.addEventListener('click', () => {
        if (confirm('האם את בטוחה שברצונך לצאת? השינויים לא יישמרו.')) {
            wizardOverlay.classList.remove('active');
        }
    });

    function saveCycleAndStart() {
        // שמירת האובייקט המלא ב-LocalStorage לשמירה על המידע ברענון
        localStorage.setItem('active_cycle', JSON.stringify(newCycleData));
        
        // סגירת ה-Wizard ועדכון מסך הבית
        wizardOverlay.classList.remove('active');
        window.loadActiveCycleOnHomeScreen();
        
        // איפוס שדות ה-Wizard לשימוש עתידי
        changeTitleInput.value = '';
        titleCharCount.textContent = '0';
        document.getElementById('input-starting-point').value = '';
        nextStepInput.value = '';
        stepCharCount.textContent = '0';
        document.getElementById('input-why-important').value = '';
        document.getElementById('input-what-to-learn').value = '';
    }

    // ==========================================
    // 5. טעינה ועדכון דינמי של מסך הבית ("היום")
    // ==========================================
    window.loadActiveCycleOnHomeScreen = function() {
        const activeCycle = localStorage.getItem('active_cycle');
        const activeView = document.getElementById('active-cycle-view');
        const emptyView = document.getElementById('empty-cycle-view');

        if (activeCycle) {
            const data = JSON.parse(activeCycle);
            
            // הצגת תצוגת מחזור פעיל והסתרת תצוגת מסך ריק
            activeView.style.display = 'flex';
            emptyView.style.display = 'none';

            // עדכון כותרת השינוי (לוקח את הכותרת, ואם ריק לוקח את הצעד הבא)
            document.getElementById('home-cycle-title').textContent = data.title || data.nextStep || 'מחזור שינוי חדש';

            // חישוב הימים שחלפו מאז תחילת המחזור
            const today = new Date();
            const start = new Date(data.startDate);
            
            // חישוב ההפרש בימים (מינימום יום 1)
            const diffTime = Math.abs(today - start);
            let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
            
            // הגבלה למקסימום ימי המחזור שנקבעו
            if (diffDays > data.durationDays) diffDays = data.durationDays;
            
            document.getElementById('home-cycle-days').textContent = `יום ${diffDays} מתוך ${data.durationDays}`;
            
            // עדכון רוחב מד ההתקדמות (אחוזים)
            const progressPercent = (diffDays / data.durationDays) * 100;
            document.getElementById('home-cycle-progress-bar').style.width = `${progressPercent}%`;

        } else {
            // אין מחזור פעיל בזיכרון - מציגים כרטיס ריק להרשמה
            activeView.style.display = 'none';
            emptyView.style.display = 'block';
        }
    };

    // ==========================================
    // 6. הפעלה ראשונית וקישור כפתורים
    // ==========================================
    
    // טעינת מצב מסך הבית מיד עם עליית האפליקציה
    window.loadActiveCycleOnHomeScreen();

    // קישור כפתור "הגדרת מחזור חדש" מהמסך הריק לפתיחת ה-Wizard
    const startWizardBtn = document.getElementById('home-start-wizard-btn');
    if (startWizardBtn) {
        startWizardBtn.addEventListener('click', () => {
            window.openWizard();
        });
    }

    // בדיקה אוטומטית: אם אין מחזור שמור בכלל, נפתח את ה-Wizard אוטומטית כדי להקל עלייך בהפעלה הראשונה
    const hasExistingCycle = localStorage.getItem('active_cycle');
    if (!hasExistingCycle) {
        setTimeout(() => {
            window.openWizard();
        }, 400); // השהייה קלה לחוויה חלקה בעין
    }
});
