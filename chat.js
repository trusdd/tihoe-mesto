(function () {
  const chatMessages = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendChatBtn');
  const panicBtn = document.getElementById('panicBtn');
  const chatStatusText = document.getElementById('chatStatusText');
  const waitingMessage = document.getElementById('waitingMessage');

  let sessionId = null;
  let isChatActive = false;
  let isWaitingForVolunteer = true;
  let mockVolunteerTimer = null;
  let messageQueue = [];

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

  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function formatTime() {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function smoothScrollToBottom() {
    setTimeout(() => {
      chatMessages.scrollTo({
        top: chatMessages.scrollHeight,
        behavior: 'smooth',
      });
    }, 50);
  }

  function updateStatus(text, isError = false) {
    chatStatusText.textContent = text;
    if (isError) {
      chatStatusText.style.color = '#e08484';
    } else {
      chatStatusText.style.color = '';
    }
  }

  function addSystemMessage(text, isError = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message-system';
    if (isError) {
      msgDiv.style.background = 'rgba(224, 124, 44, 0.08)';
      msgDiv.style.borderLeft = '2px solid #e07c2c';
    }
    msgDiv.innerHTML = `<span class="msg-icon">${isError ? '⚠️' : '🤝'}</span><span>${escapeHtml(text)}</span><span class="msg-time">${formatTime()}</span>`;
    chatMessages.appendChild(msgDiv);
    smoothScrollToBottom();
    return msgDiv;
  }

  function addTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message-system typing-indicator';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `
          <div class="typing-dots">
              <span></span><span></span><span></span>
          </div>
          <span>Волонтёр печатает...</span>
      `;
    chatMessages.appendChild(typingDiv);
    smoothScrollToBottom();
    return typingDiv;
  }

  function removeTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) indicator.remove();
  }

  function addUserMessage(text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'user-message';
    msgDiv.innerHTML = `<div class="message-text">${escapeHtml(text)}</div><div class="message-time">${formatTime()}</div>`;
    chatMessages.appendChild(msgDiv);
    smoothScrollToBottom();
  }

  function addVolunteerMessage(text, withDelay = false) {
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

  function clearChatMessages() {
    while (chatMessages.firstChild) {
      chatMessages.removeChild(chatMessages.firstChild);
    }
  }

  function enableChatInput(enabled) {
    chatInput.disabled = !enabled;
    sendBtn.disabled = !enabled;
    if (enabled) {
      chatInput.focus();
      chatInput.placeholder = 'Напиши что-нибудь...';
    } else {
      chatInput.placeholder = isWaitingForVolunteer
        ? 'Ищем волонтёра...'
        : 'Чат недоступен';
    }
  }

  function stopMockVolunteer() {
    if (mockVolunteerTimer) {
      clearTimeout(mockVolunteerTimer);
      mockVolunteerTimer = null;
    }
    removeTypingIndicator();
  }

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

  async function findVolunteer() {
    isWaitingForVolunteer = true;
    enableChatInput(false);
    updateStatus('Поиск волонтёра...');

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
          addSystemMessage('✅ Волонтёр рядом. Можешь писать.');
          updateStatus('Волонтёр онлайн');
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
        'Не удалось найти волонтёра. Попробуй позже или обнови страницу.',
        true,
      );
      updateStatus('Недоступно', true);
      enableChatInput(false);
    }
    return false;
  }

  async function initChat() {
    clearChatMessages();
    addSystemMessage(
      '🤝 Ты в безопасном пространстве. Волонтёр не знает, кто ты.',
    );

    const waitingMsgDiv = document.createElement('div');
    waitingMsgDiv.className = 'message-system';
    waitingMsgDiv.id = 'waitingMessage';
    waitingMsgDiv.innerHTML = `
          <div class="typing-dots">
              <span></span><span></span><span></span>
          </div>
          <span>Ищем свободного волонтёра...</span>
      `;
    chatMessages.appendChild(waitingMsgDiv);

    isChatActive = true;
    isWaitingForVolunteer = true;

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

  function endSession(redirectToHome = true) {
    isChatActive = false;
    isWaitingForVolunteer = false;
    stopMockVolunteer();
    messageQueue = [];
    clearSessionFromStorage();

    if (redirectToHome) {
      window.location.href = 'index.html';
    }
  }

  function panicDeleteSession() {
    if (!isChatActive) {
      window.location.href = 'index.html';
      return;
    }

    stopMockVolunteer();
    messageQueue = [];
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

  panicBtn.addEventListener('click', panicDeleteSession);
  sendBtn.addEventListener('click', sendMessage);
  chatInput.addEventListener('keypress', handleKeyPress);
  chatInput.addEventListener('input', autoResizeTextarea);
  window.addEventListener('beforeunload', handleBeforeUnload);

  initChat();
})();
