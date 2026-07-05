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
