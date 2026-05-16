// ========== ЛЕНДИНГ ==========
(function () {
  console.log('Тихое место — лендинг готов');

  // Плавное появление элементов при скролле
  const fadeElements = document.querySelectorAll(
    '.animate-fade-up, .animate-scale-in',
  );

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    },
    { threshold: 0.1 },
  );

  fadeElements.forEach((el) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  });
})();

// ========== ПЕРЕКЛЮЧЕНИЕ ТЕМЫ ==========
(function () {
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = themeToggle?.querySelector('.theme-icon');
  const themeText = themeToggle?.querySelector('.theme-text');

  function getSavedTheme() {
    return localStorage.getItem('theme') || 'light';
  }

  function setTheme(theme) {
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.classList.add(`${theme}-theme`);
    localStorage.setItem('theme', theme);

    if (themeIcon && themeText) {
      if (theme === 'dark') {
        themeIcon.textContent = '☀️';
        themeText.textContent = 'Светлая';
      } else {
        themeIcon.textContent = '🌙';
        themeText.textContent = 'Тёмная';
      }
    }
  }

  function toggleTheme() {
    const currentTheme = document.body.classList.contains('dark-theme')
      ? 'dark'
      : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  }

  if (themeToggle) {
    const savedTheme = getSavedTheme();
    setTheme(savedTheme);
    themeToggle.addEventListener('click', toggleTheme);
  }
})();

// ========== КНОПКА НАЧАТЬ (дополнительная безопасность) ==========
(function () {
  const startBtn = document.getElementById('startChatBtn');
  if (startBtn) {
    startBtn.addEventListener('click', function (e) {
      // Просто переход на chat.html, ничего лишнего
      console.log('Переход в чат...');
    });
  }
})();

// ========== ТЕЛЕФОН ДОВЕРИЯ (динамическое обновление) ==========
(function () {
  const hotlineNumber = document.querySelector('.hotline-number');
  if (hotlineNumber) {
    // Гарантируем, что номер кликабельный
    hotlineNumber.setAttribute('href', 'tel:88002000122');
  }
})();
