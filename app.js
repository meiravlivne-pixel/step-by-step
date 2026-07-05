document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.nav-item');
    const screens = document.querySelectorAll('.app-screen');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetScreenId = item.getAttribute('data-screen');

            // 1. עדכון מצב פעיל בכפתורי הניווט
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // 2. החלפת המסך המוצג
            screens.forEach(screen => {
                screen.classList.remove('active');
                if (screen.id === targetScreenId) {
                    screen.classList.add('active');
                }
            });
        });
    });
});
// הוסיפי או שלבי לתוך ה-app.js הקיים שלך

document.addEventListener('DOMContentLoaded', () => {
    // אובייקט שישמור את המידע הזמני של המחזור הנבנה
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

    // אלמנטים ב-DOM
    const wizardOverlay = document.getElementById('wizard-overlay');
    const stepPages = document.querySelectorAll('.wizard-step-page');
    const dots = document.querySelectorAll('.wizard-progress-dots .dot');
    const nextBtn = document.getElementById('wizard-next-btn');
    const backBtn = document.getElementById('wizard-back-btn');
    const closeBtn = document.getElementById('wizard-close-btn');
    
    // מונים וקלט
    const changeTitleInput = document.getElementById('input-change-title');
    const titleCharCount = document.getElementById('title-char-count');
    const nextStepInput = document.getElementById('input-next-step');
    const stepCharCount = document.getElementById('step-char-count');
    const reviewDateDisplay = document.getElementById('review-date-display');

    // פונקציה זמנית להפעלת הויזארד אוטומטית לבדיקה (אפשר להסיר בהמשך)
    setTimeout(() => {
        openWizard();
    }, 500);

    function openWizard() {
        currentStep = 1;
        newCycleData.startDate = new Date();
        calculateEndDate();
        updateWizardUI();
        wizardOverlay.classList.add('active');
    }

    function calculateEndDate() {
        const end = new Date(newCycleData.startDate);
        end.setDate(end.getDate() + newCycleData.durationDays);
        newCycleData.endDate = end;
        
        // פורמט תאריך קריא בעברית (לדוגמה: 26.7.2026)
        reviewDateDisplay.textContent = `${end.getDate()}.${end.getMonth() + 1}.${end.getFullYear()}`;
    }

    function updateWizardUI() {
        // עדכון עמודים פעילים
        stepPages.forEach(page => {
            page.classList.remove('active');
            if (parseInt(page.getAttribute('data-step')) === currentStep) {
                page.classList.add('active');
            }
        });

        // עדכון נקודות התקדמות
        dots.forEach(dot => {
            dot.classList.remove('active');
            if (parseInt(dot.getAttribute('data-step')) === currentStep) {
                dot.classList.add('active');
            }
        });

        // עדכון נראות כפתור חזרה
        if (currentStep === 1) {
            backBtn.style.visibility = 'hidden';
        } else {
            backBtn.style.visibility = 'visible';
        }

        // שינוי טקסט כפתור בשלב האחרון
        if (currentStep === totalSteps) {
            nextBtn.textContent = 'אישור והתחלת המחזור';
        } else {
            nextBtn.textContent = 'המשך';
        }
    }

    // מאזינים לשינויי קלט ועדכון מונים
    changeTitleInput.addEventListener('input', (e) => {
        titleCharCount.textContent = e.target.value.length;
        newCycleData.title = e.target.value;
    });

    nextStepInput.addEventListener('input', (e) => {
        stepCharCount.textContent = e.target.value.length;
        newCycleData.nextStep = e.target.value;
    });

    // ניווט קדימה
    nextBtn.addEventListener('click', () => {
        if (currentStep < totalSteps) {
            // שמירת מידע משדות הטקסט הנוכחיים
            if (currentStep === 2) newCycleData.startingPoint = document.getElementById('input-starting-point').value;
            if (currentStep === 4) newCycleData.whyImportant = document.getElementById('input-why-important').value;
            if (currentStep === 5) newCycleData.whatToLearn = document.getElementById('input-what-to-learn').value;

            currentStep++;
            updateWizardUI();
        } else {
            // שלב סופי - שמירה ויציאה
            saveCycleAndStart();
        }
    });

    // ניווט אחורה
    backBtn.addEventListener('click', () => {
        if (currentStep > 1) {
            currentStep--;
            updateWizardUI();
        }
    });

    // סגירה ידנית
    closeBtn.addEventListener('click', () => {
        if (confirm('האם את בטוחה שברצונך לצאת? השינויים לא יישמרו.')) {
            wizardOverlay.classList.remove('active');
        }
    });

    function saveCycleAndStart() {
        // שומרים ב-LocalStorage כדי שהמידע יישמר גם ברענון מסך
        localStorage.setItem('active_cycle', JSON.stringify(newCycleData));
        alert('מחזור השינוי נוצר בהצלחה!');
        wizardOverlay.classList.remove('active');
        
        // כאן נקרא בהמשך לפונקציה שתעדכן את מסך הבית דינמית
        if (window.loadActiveCycleOnHomeScreen) {
            window.loadActiveCycleOnHomeScreen();
        }
    }
});
