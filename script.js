// ==================== ЛЕНДИНГ - ПЛАВНЫЕ АНИМАЦИИ ПРИ СКРОЛЛЕ ====================
(function () {
  console.log('Тихое место — лендинг готов');

  const fadeElements = document.querySelectorAll(
    '.animate-fade-up, .animate-scale-in, .animate-fade-down',
  );

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -20px 0px' },
  );

  fadeElements.forEach((el) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition =
      'opacity 0.6s cubic-bezier(0.2, 0.9, 0.4, 1.1), transform 0.6s cubic-bezier(0.2, 0.9, 0.4, 1.1)';
    observer.observe(el);
  });
})();

// ==================== ПЕРЕКЛЮЧЕНИЕ ТЕМЫ (СВЕТЛАЯ / ТЕМНАЯ) ====================
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
        themeText.textContent = 'Темная';
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

// ==================== КНОПКА НАЧАТЬ ====================
(function () {
  const startBtn = document.getElementById('startChatBtn');
  if (startBtn) {
    startBtn.addEventListener('click', function (e) {
      sessionStorage.removeItem('chatSessionId');
      sessionStorage.removeItem('chatSessionTime');
      console.log('Переход в чат...');
    });
  }
})();

// ==================== ТЕЛЕФОН ДОВЕРИЯ ====================
(function () {
  const hotlineNumber = document.querySelector('.hotline-number');
  if (hotlineNumber) {
    hotlineNumber.setAttribute('href', 'tel:88002000122');
  }
})();

// ==================== ЭФФЕКТ ПРИ НАВЕДЕНИИ НА КАРТОЧКИ ====================
(function () {
  const cards = document.querySelectorAll('.trust-card, .how-card');
  cards.forEach((card) => {
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-4px)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)';
    });
  });
})();

// ==================== АНИМАЦИЯ ДЛЯ ШАГОВ HOW-IT-WORKS ====================
(function () {
  const steps = document.querySelectorAll('.step-circle');
  steps.forEach((step) => {
    step.addEventListener('mouseenter', () => {
      const pulse = step.querySelector('.step-pulse');
      if (pulse) {
        pulse.style.animation = 'pulse 0.8s ease-out';
        setTimeout(() => {
          pulse.style.animation = '';
        }, 800);
      }
    });
  });
})();

// ==================== ПРЕДУПРЕЖДЕНИЕ ПРИ УХОДЕ (ТОЛЬКО ЕСЛИ ЕСТЬ АКТИВНЫЙ ЧАТ) ====================
window.addEventListener('beforeunload', (e) => {
  const savedSession = sessionStorage.getItem('chatSessionId');
  const savedTime = sessionStorage.getItem('chatSessionTime');
  if (savedSession && savedTime && Date.now() - parseInt(savedTime) < 300000) {
    e.preventDefault();
    e.returnValue =
      'У вас есть активный чат. Вы уверены, что хотите покинуть страницу?';
  }
});
