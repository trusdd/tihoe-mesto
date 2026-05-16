(function () {
  const startBtn = document.getElementById('startChatBtn');
  const modal = document.getElementById('chatModal');
  const closeModalBtn = document.getElementById('closeChatModal');
  const panicBtn = document.getElementById('panicBtn');
  const chatMessages = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendChatBtn');
  const modalOverlay = document.querySelector('.modal-overlay');

  let sessionId = null;
  let isChatActive = false;
  let isWaitingForVolunteer = false;
  let mockVolunteerTimer = null;
  let typingTimeout = null;
  let reconnectAttempts = 0;
  let messageQueue = [];

  const VOLUNTEER_RESPONSE_DELAY = 2000;
  const VOLUNTEER_TYPING_DELAY = 800;
  const MAX_RECONNECT_ATTEMPTS = 3;

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

  const SYSTEM_MESSAGES = {
    welcome: '🤝 Ты в безопасном пространстве. Волонтёр не знает, кто ты.',
    searching: '⏳ Ищем свободного волонтёра...',
    found: '✅ Волонтёр рядом. Можешь писать.',
    timeout: '⏰ Волонтёр не отвечает. Перенаправляем запрос...',
    panic: '🗑️ Переписка удалена. Ты вышел в любой момент — следов нет.',
    error: '⚠️ Что-то пошло не так. Попробуй ещё раз.',
    reconnect: '🔄 Восстанавливаем соединение...',
    sessionEnded: '❌ Сессия завершена. Переписка удалена.',
  };

  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function formatTime() {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  }

  function addSystemMessage(text, isError = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message-system';
    if (isError) {
      msgDiv.style.background = 'rgba(224, 124, 44, 0.08)';
      msgDiv.style.borderLeft = '2px solid #e07c2c';
    }
    msgDiv.innerHTML = `<span class="msg-icon">${isError ? '⚠️' : '🤝'}</span><span>${text}</span><span class="msg-time">${formatTime()}</span>`;
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
      }, VOLUNTEER_TYPING_DELAY);
    } else {
      const msgDiv = document.createElement('div');
      msgDiv.className = 'volunteer-message';
      msgDiv.innerHTML = `<div class="message-text">${escapeHtml(text)}</div><div class="message-time">${formatTime()}</div>`;
      chatMessages.appendChild(msgDiv);
      smoothScrollToBottom();
    }
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
        : 'Чай недоступен';
    }
  }

  function stopMockVolunteer() {
    if (mockVolunteerTimer) {
      clearTimeout(mockVolunteerTimer);
      mockVolunteerTimer = null;
    }
    removeTypingIndicator();
  }

  function processMessageQueue() {
    if (!isChatActive || isWaitingForVolunteer) return;
    while (messageQueue.length > 0 && !mockVolunteerTimer) {
      const reply = messageQueue.shift();
      addVolunteerMessage(reply, true);
    }
    if (messageQueue.length === 0 && isChatActive && !isWaitingForVolunteer) {
      scheduleNextReply();
    }
  }

  function scheduleNextReply() {
    if (!isChatActive || isWaitingForVolunteer) return;
    stopMockVolunteer();
    const nextDelay = getRandomInt(8000, 20000);
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
      sessionStorage.setItem('lastSessionId', sessionId);
      sessionStorage.setItem('lastSessionTime', Date.now());
    }
  }

  function clearSessionFromStorage() {
    sessionStorage.removeItem('lastSessionId');
    sessionStorage.removeItem('lastSessionTime');
  }

  function checkForReconnect() {
    const lastSession = sessionStorage.getItem('lastSessionId');
    const lastTime = sessionStorage.getItem('lastSessionTime');
    if (lastSession && lastTime && Date.now() - parseInt(lastTime) < 300000) {
      return lastSession;
    }
    return null;
  }

  function endSession(hideModal = true, silent = false) {
    isChatActive = false;
    isWaitingForVolunteer = false;
    stopMockVolunteer();
    messageQueue = [];

    if (!silent && !hideModal) {
      addSystemMessage(SYSTEM_MESSAGES.sessionEnded);
      enableChatInput(false);
      setTimeout(() => {
        if (!isChatActive) {
          modal.classList.add('hidden');
          clearSessionFromStorage();
        }
      }, 2000);
    } else if (hideModal) {
      modal.classList.add('hidden');
      clearSessionFromStorage();
    }

    sessionId = null;
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
              'mock_' +
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
          addSystemMessage(SYSTEM_MESSAGES.found);
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
      addSystemMessage(SYSTEM_MESSAGES.error, true);
      endSession(true);
    }
    return false;
  }

  async function resetAndStartChat() {
    if (isChatActive) {
      endSession(true, true);
    }

    clearChatMessages();
    addSystemMessage(SYSTEM_MESSAGES.welcome);
    addSystemMessage(SYSTEM_MESSAGES.searching);

    modal.classList.remove('hidden');
    isChatActive = true;
    isWaitingForVolunteer = true;

    const reconnectId = checkForReconnect();
    if (reconnectId) {
      addSystemMessage(SYSTEM_MESSAGES.reconnect);
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    const found = await findVolunteer();
    if (!found && isChatActive) {
      addSystemMessage('Не удалось найти волонтёра. Попробуй позже.', true);
      setTimeout(() => endSession(true), 3000);
    }
  }

  function panicDeleteSession() {
    if (!isChatActive) {
      modal.classList.add('hidden');
      return;
    }

    stopMockVolunteer();
    messageQueue = [];
    addSystemMessage(SYSTEM_MESSAGES.panic);
    enableChatInput(false);
    isChatActive = false;
    isWaitingForVolunteer = false;

    simulateBackendRequest('/api/session/delete', { sessionId }).catch((err) =>
      console.error('Delete error:', err),
    );

    setTimeout(() => {
      modal.classList.add('hidden');
      sessionId = null;
      clearSessionFromStorage();
    }, 2000);
  }

  async function sendMessage() {
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

  function handleModalClose() {
    if (isChatActive) {
      if (
        confirm(
          'Завершить разговор? Переписка удалится. Ты можешь вернуться в любой момент.',
        )
      ) {
        endSession(true);
      }
    } else {
      modal.classList.add('hidden');
    }
  }

  function handleOverlayClick(e) {
    if (e.target === modalOverlay) {
      handleModalClose();
    }
  }

  function initEventListeners() {
    startBtn.addEventListener('click', resetAndStartChat);
    closeModalBtn.addEventListener('click', handleModalClose);
    panicBtn.addEventListener('click', panicDeleteSession);
    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', handleKeyPress);
    chatInput.addEventListener('input', autoResizeTextarea);
    modalOverlay.addEventListener('click', handleOverlayClick);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && isChatActive) {
        addSystemMessage(
          '🌙 Ты свернул окно. Мы здесь, вернешься — продолжим.',
        );
      }
    });

    window.addEventListener('beforeunload', (e) => {
      if (isChatActive) {
        e.preventDefault();
        e.returnValue = '';
      }
    });
  }

  function addCustomCssForMessages() {
    const style = document.createElement('style');
    style.textContent = `
          .message-time {
              font-size: 0.6rem;
              opacity: 0.6;
              margin-top: 4px;
              text-align: right;
          }
          .user-message .message-time {
              color: rgba(255, 255, 255, 0.7);
          }
          .volunteer-message .message-time {
              color: rgba(255, 255, 255, 0.5);
          }
          .message-system .msg-time {
              margin-left: auto;
              font-size: 0.6rem;
              opacity: 0.5;
          }
          .message-system {
              display: flex;
              align-items: center;
              gap: 0.5rem;
              flex-wrap: wrap;
          }
          .user-message, .volunteer-message {
              animation: fadeInMessage 0.3s ease-out;
          }
          @keyframes fadeInMessage {
              from {
                  opacity: 0;
                  transform: translateY(10px);
              }
              to {
                  opacity: 1;
                  transform: translateY(0);
              }
          }
          .typing-indicator {
              animation: pulseOpacity 1s infinite;
          }
          @keyframes pulseOpacity {
              0%, 100% { opacity: 0.6; }
              50% { opacity: 1; }
          }
      `;
    document.head.appendChild(style);
  }

  initEventListeners();
  addCustomCssForMessages();

  console.log('Тихое место — фронтенд готов. Ожидаю бэкенд на :3000');
})();
