// ==================== ОСНОВНАЯ ЛОГИКА ЧАТА ====================
// АВТОЗАПУСКАЮЩАЯСЯ ФУНКЦИЯ ДЛЯ ИЗОЛЯЦИИ КОДА
(function () {
  // ==================== ПОЛУЧЕНИЕ DOM ЭЛЕМЕНТОВ ====================
  const chatMessages = document.getElementById('chatMessages'); // КОНТЕЙНЕР СООБЩЕНИЙ
  const chatInput = document.getElementById('chatInput'); // ПОЛЕ ВВОДА ТЕКСТА
  const sendBtn = document.getElementById('sendChatBtn'); // КНОПКА ОТПРАВКИ
  const panicBtn = document.getElementById('panicBtn'); // КНОПКА "СТЕРЕТЬ ВСЕ"
  const chatStatusText = document.getElementById('chatStatusText'); // ТЕКСТ СТАТУСА (ПОДКЛЮЧЕНИЕ)
  const waitingMessage = document.getElementById('waitingMessage'); // СООБЩЕНИЕ О ПОИСКЕ ВОЛОНТЕРА

  // ==================== ПЕРЕМЕННЫЕ СОСТОЯНИЯ ====================
  let sessionId = null; // УНИКАЛЬНЫЙ ID СЕССИИ ЧАТА
  let isChatActive = false; // АКТИВЕН ЛИ ЧАТ
  let isWaitingForVolunteer = true; // ОЖИДАНИЕ ВОЛОНТЕРА
  let mockVolunteerTimer = null; // ТАЙМЕР ОТВЕТОВ МОК-ВОЛОНТЕРА
  let originalTitle = document.title; // ОРИГИНАЛЬНЫЙ ЗАГОЛОВОК ВКЛАДКИ
  let unreadCount = 0; // СЧЕТЧИК НЕПРОЧИТАННЫХ СООБЩЕНИЙ

  // ==================== БАЗА ОТВЕТОВ ВОЛОНТЕРА ====================
  const VOLUNTEER_REPLIES = [
    'Я здесь. Ты не один.',
    'Расскажи, что чувствуешь. Я слушаю внимательно.',
    'Это тяжело, но ты не один в этом. Я рядом.',
    'Можешь просто писать всё, что приходит в голову. Без фильтров.',
    'Спасибо, что делишься. Это действительно важно.',
    'Ты молодец, что говоришь об этом. Многие молчат.',
    'Я слышу тебя. Продолжай.',
    'Нет правильных или неправильных чувств. Твои чувства — важны.',
    'Иногда просто выговориться — уже легче. Я здесь, чтобы слушать.',
    'Ты справляешься. Даже если кажется, что нет — ты уже сделал шаг.',
  ];

  // ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

  // ГЕНЕРАЦИЯ СЛУЧАЙНОГО ЧИСЛА В ДИАПАЗОНЕ
  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // ФОРМАТИРОВАНИЕ ТЕКУЩЕГО ВРЕМЕНИ (ЧЧ:ММ)
  function formatTime() {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  }

  // ЗАЩИТА ОТ XSS АТАК (ЭСКЕЙП HTML СИМВОЛОВ)
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ПЛАВНАЯ ПРОКРУТКА ЧАТА ВНИЗ
  function smoothScrollToBottom() {
    setTimeout(() => {
      chatMessages.scrollTo({
        top: chatMessages.scrollHeight,
        behavior: 'smooth',
      });
    }, 50);
  }

  // ОБНОВЛЕНИЕ СТАТУСА В ХЕДЕРЕ ЧАТА
  function updateStatus(text, isError = false) {
    if (chatStatusText) {
      chatStatusText.textContent = text;
      if (isError) {
        chatStatusText.style.color = '#b88878';
      } else {
        chatStatusText.style.color = '';
      }
    }
  }

  // ==================== УВЕДОМЛЕНИЯ (СМЕНА ЗАГОЛОВКА ВКЛАДКИ) ====================
  function updateTitleNotification() {
    if (unreadCount > 0) {
      document.title = `💬 (${unreadCount}) ${originalTitle}`;
    } else {
      document.title = originalTitle;
    }
  }

  function resetTitleNotification() {
    unreadCount = 0;
    updateTitleNotification();
  }

  // ==================== ДОБАВЛЕНИЕ СООБЩЕНИЙ В ЧАТ ====================

  // СИСТЕМНОЕ СООБЩЕНИЕ (СЕРАЯ ПЛАШКА)
  function addSystemMessage(text, isError = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message-system';
    if (isError) {
      msgDiv.style.background = 'rgba(156, 106, 106, 0.15)';
    }
    msgDiv.innerHTML = `<span class="msg-icon">${isError ? '⚠️' : '🤝'}</span><span>${escapeHtml(text)}</span><span class="msg-time">${formatTime()}</span>`;
    chatMessages.appendChild(msgDiv);
    smoothScrollToBottom();
    return msgDiv;
  }

  // ИНДИКАТОР "ВОЛОНТЕР ПЕЧАТАЕТ..."
  function addTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message-system typing-indicator';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `
          <div class="typing-dots">
              <span></span><span></span><span></span>
          </div>
          <span>Волонтер печатает...</span>
      `;
    chatMessages.appendChild(typingDiv);
    smoothScrollToBottom();
    return typingDiv;
  }

  function removeTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) indicator.remove();
  }

  // СООБЩЕНИЕ ПОЛЬЗОВАТЕЛЯ (СПРАВА, С ХВОСТИКОМ)
  function addUserMessage(text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'user-message';
    msgDiv.innerHTML = `<div class="message-text">${escapeHtml(text)}</div><div class="message-time">${formatTime()}</div>`;
    chatMessages.appendChild(msgDiv);
    smoothScrollToBottom();
    resetTitleNotification(); // СБРАСЫВАЕМ УВЕДОМЛЕНИЕ ПРИ АКТИВНОСТИ
  }

  // СООБЩЕНИЕ ВОЛОНТЕРА (СЛЕВА, С ХВОСТИКОМ)
  function addVolunteerMessage(text, withDelay = false) {
    unreadCount++;
    updateTitleNotification();

    if (withDelay) {
      addTypingIndicator();
      setTimeout(() => {
        removeTypingIndicator();
        const msgDiv = document.createElement('div');
        msgDiv.className = 'volunteer-message';
        msgDiv.innerHTML = `<div class="message-text">${escapeHtml(text)}</div><div class="message-time">${formatTime()}</div>`;
        chatMessages.appendChild(msgDiv);
        smoothScrollToBottom();
      }, 800);
    } else {
      const msgDiv = document.createElement('div');
      msgDiv.className = 'volunteer-message';
      msgDiv.innerHTML = `<div class="message-text">${escapeHtml(text)}</div><div class="message-time">${formatTime()}</div>`;
      chatMessages.appendChild(msgDiv);
      smoothScrollToBottom();
    }
  }

  // ОЧИСТКА ВСЕХ СООБЩЕНИЙ В ЧАТЕ
  function clearChatMessages() {
    while (chatMessages.firstChild) {
      chatMessages.removeChild(chatMessages.firstChild);
    }
  }

  // ==================== УПРАВЛЕНИЕ ПОЛЕМ ВВОДА ====================
  function enableChatInput(enabled) {
    chatInput.disabled = !enabled;
    sendBtn.disabled = !enabled;
    if (enabled) {
      chatInput.focus();
      chatInput.placeholder = 'Напиши что-нибудь...';
    } else {
      chatInput.placeholder = isWaitingForVolunteer
        ? 'Ищем волонтера...'
        : 'Чат недоступен';
    }
  }

  // ==================== УПРАВЛЕНИЕ МОК-ВОЛОНТЕРОМ ====================
  function stopMockVolunteer() {
    if (mockVolunteerTimer) {
      clearTimeout(mockVolunteerTimer);
      mockVolunteerTimer = null;
    }
    removeTypingIndicator();
  }

  // ПЛАНИРОВЩИК СЛЕДУЮЩЕГО ОТВЕТА ВОЛОНТЕРА (РАНДОМНАЯ ЗАДЕРЖКА)
  function scheduleNextReply() {
    if (!isChatActive || isWaitingForVolunteer) return;
    stopMockVolunteer();
    const nextDelay = getRandomInt(7000, 18000);
    mockVolunteerTimer = setTimeout(() => {
      if (isChatActive && !isWaitingForVolunteer) {
        const randomReply =
          VOLUNTEER_REPLIES[
            Math.floor(Math.random() * VOLUNTEER_REPLIES.length)
          ];
        addVolunteerMessage(randomReply, true);
        mockVolunteerTimer = null;
        scheduleNextReply();
      }
    }, nextDelay);
  }

  function startMockVolunteer() {
    stopMockVolunteer();
    scheduleNextReply();
  }

  // ==================== РАБОТА С ХРАНИЛИЩЕМ СЕССИЙ ====================
  function saveSessionToStorage() {
    if (sessionId) {
      sessionStorage.setItem('chatSessionId', sessionId);
      sessionStorage.setItem('chatSessionTime', Date.now());
    }
  }

  function clearSessionFromStorage() {
    sessionStorage.removeItem('chatSessionId');
    sessionStorage.removeItem('chatSessionTime');
  }

  // ==================== ИМИТАЦИЯ ЗАПРОСОВ К БЭКЕНДУ ====================
  function simulateBackendRequest(endpoint, data, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error('Request timeout')),
        timeout,
      );
      setTimeout(
        () => {
          clearTimeout(timer);
          resolve({
            success: true,
            sessionId:
              'session_' +
              Date.now() +
              '_' +
              Math.random().toString(36).substr(2, 8),
          });
        },
        getRandomInt(800, 1500),
      );
    });
  }

  // ==================== ПОИСК ВОЛОНТЕРА ====================
  async function findVolunteer() {
    isWaitingForVolunteer = true;
    enableChatInput(false);
    updateStatus('Поиск волонтера...');

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts && isChatActive) {
      attempts++;
      try {
        const result = await simulateBackendRequest('/api/crisis/start', {
          timestamp: Date.now(),
        });
        if (result.success && isChatActive) {
          sessionId = result.sessionId;
          saveSessionToStorage();
          isWaitingForVolunteer = false;
          if (waitingMessage) waitingMessage.remove();
          addSystemMessage('✅ Волонтер рядом. Можешь писать.');
          updateStatus('Волонтер онлайн');
          enableChatInput(true);
          startMockVolunteer();
          return true;
        }
      } catch (error) {
        console.error('Volunteer search error:', error);
        if (attempts < maxAttempts) {
          addSystemMessage(
            `Повторная попытка (${attempts}/${maxAttempts})...`,
            true,
          );
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    }

    if (isChatActive) {
      addSystemMessage(
        'Не удалось найти волонтера. Попробуй позже или обнови страницу.',
        true,
      );
      updateStatus('Недоступно', true);
      enableChatInput(false);
    }
    return false;
  }

  // ==================== ИНИЦИАЛИЗАЦИЯ ЧАТА ====================
  async function initChat() {
    clearChatMessages();
    addSystemMessage(
      '🤝 Ты в безопасном пространстве. Волонтер не знает, кто ты.',
    );

    const waitingMsgDiv = document.createElement('div');
    waitingMsgDiv.className = 'message-system';
    waitingMsgDiv.id = 'waitingMessage';
    waitingMsgDiv.innerHTML = `
          <div class="typing-dots">
              <span></span><span></span><span></span>
          </div>
          <span>Ищем свободного волонтера...</span>
      `;
    chatMessages.appendChild(waitingMsgDiv);

    isChatActive = true;
    isWaitingForVolunteer = true;

    // ПРОВЕРКА НА ВОССТАНОВЛЕНИЕ СЕССИИ (ЕСЛИ СТРАНИЦА ОБНОВИЛАСЬ)
    const savedSession = sessionStorage.getItem('chatSessionId');
    const savedTime = sessionStorage.getItem('chatSessionTime');

    if (
      savedSession &&
      savedTime &&
      Date.now() - parseInt(savedTime) < 300000
    ) {
      addSystemMessage('🔄 Восстанавливаем предыдущую сессию...');
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    await findVolunteer();
  }

  // ==================== ЗАВЕРШЕНИЕ СЕССИИ ====================
  function endSession(redirectToHome = true) {
    isChatActive = false;
    isWaitingForVolunteer = false;
    stopMockVolunteer();
    clearSessionFromStorage();
    resetTitleNotification();

    if (redirectToHome) {
      window.location.href = 'index.html';
    }
  }

  // ==================== КНОПКА "СТЕРЕТЬ ВСЕ" ====================
  function panicDeleteSession() {
    if (!isChatActive) {
      window.location.href = 'index.html';
      return;
    }

    stopMockVolunteer();
    addSystemMessage(
      '🗑️ Переписка удалена. Ты вышел в любой момент — следов нет.',
    );
    enableChatInput(false);
    isChatActive = false;

    simulateBackendRequest('/api/session/delete', { sessionId }).catch((err) =>
      console.error('Delete error:', err),
    );

    setTimeout(() => {
      window.location.href = 'index.html';
    }, 2000);
  }

  // ==================== ОТПРАВКА СООБЩЕНИЯ ====================
  function sendMessage() {
    if (!isChatActive || isWaitingForVolunteer) return;

    const text = chatInput.value.trim();
    if (text === '') return;

    addUserMessage(text);
    chatInput.value = '';
    chatInput.style.height = 'auto';

    simulateBackendRequest('/api/message/send', {
      sessionId,
      message: text,
      timestamp: Date.now(),
    }).catch((err) => console.error('Send error:', err));

    // СБРАСЫВАЕМ ТАЙМЕР ВОЛОНТЕРА И ЗАПУСКАЕМ ЗАНОВО (ОТВЕТ БУДЕТ БЫСТРЕЕ)
    if (mockVolunteerTimer) {
      stopMockVolunteer();
      addTypingIndicator();
      setTimeout(
        () => {
          removeTypingIndicator();
          scheduleNextReply();
        },
        getRandomInt(1000, 3000),
      );
    }
  }

  // ==================== ОБРАБОТЧИКИ СОБЫТИЙ ====================
  function handleKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function autoResizeTextarea() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 100) + 'px';
  }

  function handleBeforeUnload(e) {
    if (isChatActive) {
      e.preventDefault();
      e.returnValue = '';
    }
  }

  // ВОССТАНОВЛЕНИЕ ЗАГОЛОВКА ПРИ ФОКУСЕ НА ВКЛАДКУ
  window.addEventListener('focus', resetTitleNotification);

  // НАВЕШИВАЕМ ОБРАБОТЧИКИ
  if (panicBtn) panicBtn.addEventListener('click', panicDeleteSession);
  if (sendBtn) sendBtn.addEventListener('click', sendMessage);
  if (chatInput) {
    chatInput.addEventListener('keypress', handleKeyPress);
    chatInput.addEventListener('input', autoResizeTextarea);
  }
  window.addEventListener('beforeunload', handleBeforeUnload);

  // ЗАПУСКАЕМ ЧАТ
  initChat();
})();

// ==================== ПЕРЕКЛЮЧЕНИЕ ТЕМЫ ДЛЯ СТРАНИЦЫ ЧАТА ====================
(function () {
  const themeToggle = document.getElementById('themeToggleChat');
  const themeIcon = themeToggle?.querySelector('.theme-icon');
  const themeText = themeToggle?.querySelector('.theme-text');

  // ПОЛУЧАЕМ СОХРАНЕННУЮ ТЕМУ ИЗ LOCALSTORAGE
  function getSavedTheme() {
    return localStorage.getItem('theme') || 'light';
  }

  // УСТАНАВЛИВАЕМ ТЕМУ (DARK ИЛИ LIGHT)
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

  // ПЕРЕКЛЮЧАТЕЛЬ МЕЖДУ ТЕМАМИ
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

// ==================== ЖАЛОБА НА ВОЛОНТЕРА (ИСПРАВЛЕННАЯ) ====================
(function () {
  const complainBtn = document.getElementById('complainBtn');

  // ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ СИСТЕМНЫХ СООБЩЕНИЙ В ЖАЛОБЕ
  function addSystemMessageForComplain(text, isError = false) {
    const chatMessagesContainer = document.getElementById('chatMessages');
    if (!chatMessagesContainer) return;

    const msgDiv = document.createElement('div');
    msgDiv.className = 'message-system';
    if (isError) {
      msgDiv.style.background = 'rgba(156, 106, 106, 0.15)';
    }
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    msgDiv.innerHTML = `<span class="msg-icon">${isError ? '⚠️' : '📢'}</span><span>${text}</span><span class="msg-time">${timeStr}</span>`;
    chatMessagesContainer.appendChild(msgDiv);

    setTimeout(() => {
      msgDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 50);
  }

  function openComplainModal() {
    const hasActiveChat = document.querySelector('.user-message') !== null;
    if (!hasActiveChat) {
      addSystemMessageForComplain(
        'Жалоба доступна только во время активного чата.',
        true,
      );
      return;
    }

    const modal = document.getElementById('complainModal');
    if (modal) {
      modal.classList.remove('hidden');
    }
  }

  if (complainBtn) {
    complainBtn.addEventListener('click', openComplainModal);
  }

  const closeComplainModal = document.getElementById('closeComplainModal');
  const cancelComplainBtn = document.getElementById('cancelComplainBtn');
  const submitComplainBtn = document.getElementById('submitComplainBtn');
  const complainDetails = document.getElementById('complainDetails');

  function closeModal() {
    const modal = document.getElementById('complainModal');
    if (modal) modal.classList.add('hidden');
    const radioInputs = document.querySelectorAll(
      'input[name="complainReason"]',
    );
    radioInputs.forEach((radio) => (radio.checked = false));
    if (complainDetails) complainDetails.value = '';
  }

  function submitComplain() {
    const radioInputs = document.querySelectorAll(
      'input[name="complainReason"]',
    );
    let reason = null;
    for (let radio of radioInputs) {
      if (radio.checked) {
        reason = radio.value;
        break;
      }
    }

    if (!reason) {
      alert('Пожалуйста, выберите причину жалобы.');
      return;
    }

    const details = complainDetails ? complainDetails.value.trim() : '';

    addSystemMessageForComplain(
      'Спасибо за жалобу. Мы рассмотрим её в течение 24 часов. Волонтер не узнает о ней.',
    );

    console.log('Complain submitted:', { reason, details });

    closeModal();
  }

  if (closeComplainModal)
    closeComplainModal.addEventListener('click', closeModal);
  if (cancelComplainBtn)
    cancelComplainBtn.addEventListener('click', closeModal);
  if (submitComplainBtn)
    submitComplainBtn.addEventListener('click', submitComplain);
})();

// ==================== ПОДТВЕРЖДЕНИЕ ВЫХОДА ====================
(function () {
  const exitModal = document.getElementById('exitModal');
  const exitCancelBtn = document.getElementById('exitCancelBtn');
  const exitConfirmBtn = document.getElementById('exitConfirmBtn');
  const backBtn = document.querySelector('.chat-back-btn');

  function openExitModal() {
    if (exitModal) exitModal.classList.remove('hidden');
  }

  function closeExitModal() {
    if (exitModal) exitModal.classList.add('hidden');
  }

  function confirmExit() {
    closeExitModal();
    // ВЫЗЫВАЕМ ФУНКЦИЮ ЗАВЕРШЕНИЯ СЕССИИ (ОБЪЯВЛЕНА В ОСНОВНОМ БЛОКЕ)
    if (typeof endSession === 'function') {
      endSession(true);
    } else {
      window.location.href = 'index.html';
    }
  }

  if (backBtn) {
    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      // ПРОВЕРЯЕМ АКТИВЕН ЛИ ЧАТ (ЕСТЬ ЛИ СООБЩЕНИЯ ПОЛЬЗОВАТЕЛЯ)
      const hasMessages = document.querySelector('.user-message') !== null;
      if (hasMessages) {
        openExitModal();
      } else {
        window.location.href = 'index.html';
      }
    });
  }

  if (exitCancelBtn) exitCancelBtn.addEventListener('click', closeExitModal);
  if (exitConfirmBtn) exitConfirmBtn.addEventListener('click', confirmExit);
})();
