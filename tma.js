/**
 * Hamroh Telegram Mini App (TMA) & Offline Controller
 * Integrates Telegram WebApp SDK, ServiceWorker offline caching, and life-saving quick actions.
 */

(function () {
  'use strict';

  // Til: yo'l prefiksi (/ru/, /kk/) bo'yicha; yo'q bo'lsa uz.
  const LANG_MATCH = window.location.pathname.match(/^\/(ru|kk)(\/|$)/);
  const LANG = LANG_MATCH ? LANG_MATCH[1] : 'uz';
  const LANG_PREFIX = LANG === 'uz' ? '' : '/' + LANG;
  const I18N = {
    uz: {
      offline: 'Oflayn rejim — keshdan ishlamoqda',
      mdTitle: 'Dori ichishni unutdingizmi?',
      mdIntro: "ARV davolanishida dori vaqtini o'tkazib yuborsangiz, vahimaga tushmang. Jahon Sog'liqni Saqlash Tashkiloti (JSST) ko'rsatmasiga amal qiling:",
      mdLess12: "12 soatdan KAM vaqt o'tgan bo'lsa:",
      mdLess12Do: "<b>Hozir darhol 1 dozani iching!</b> Keyingi dozani odatiy jadvalingiz bo'yicha davom ettiring.",
      mdMore12: "12 soatdan KO'P vaqt o'tgan bo'lsa:",
      mdMore12Do: "<b>Bu dozani o'tkazib yuboring!</b> Keyingi dozani o'z vaqtida iching.",
      mdNoDouble: "<b>Aslo ikki barobar (2 ta) doza ichmang!</b>",
      mdVomit: 'Qayt qilish (qusish) holati:',
      mdVomit30: "Dori ichgach <b>30 daqiqa ichida</b> qussangiz — yangi tabletka iching.",
      mdVomit60: "<b>1 soatdan oshgan bo'lsa</b> — qayta ichish shart emas.",
      mdCall: '1003 — Bepul Ishonch Telefoni'
    },
    ru: {
      offline: 'Офлайн-режим — работает из кеша',
      mdTitle: 'Забыли принять лекарство?',
      mdIntro: 'Если вы пропустили приём препарата при АРВ-терапии, не паникуйте. Следуйте рекомендациям Всемирной организации здравоохранения (ВОЗ):',
      mdLess12: 'Если прошло МЕНЬШЕ 12 часов:',
      mdLess12Do: '<b>Примите 1 дозу сразу же!</b> Следующую дозу принимайте по обычному графику.',
      mdMore12: 'Если прошло БОЛЬШЕ 12 часов:',
      mdMore12Do: '<b>Пропустите эту дозу!</b> Следующую дозу примите вовремя.',
      mdNoDouble: '<b>Ни в коем случае не принимайте двойную дозу (2 таблетки)!</b>',
      mdVomit: 'Если была рвота:',
      mdVomit30: 'Если рвота началась <b>в течение 30 минут</b> после приёма — примите новую таблетку.',
      mdVomit60: '<b>Если прошло больше 1 часа</b> — повторно принимать не нужно.',
      mdCall: '1003 — бесплатный телефон доверия'
    },
    kk: {
      offline: 'Офлайн режим — кештен жұмыс істеп тұр',
      mdTitle: 'Дәріні ішуді ұмыттыңыз ба?',
      mdIntro: 'АРВ-терапия кезінде дәріні ішуді ұмытып кетсеңіз, именбеңіз. Дүниежүзілік денсаулық сақтау ұйымының (ДДСҰ) нұсқауына сәйкес әрекет етіңіз:',
      mdLess12: '12 сағаттан АЗ уақыт өтсе:',
      mdLess12Do: '<b>Қазір бірден 1 дозаны ішіңіз!</b> Келесі дозаны әдеттегі кесте бойынша жалғастырыңыз.',
      mdMore12: '12 сағаттан КӨП уақыт өтсе:',
      mdMore12Do: '<b>Бұл дозаны өткізіп жіберіңіз!</b> Келесі дозаны уақытында ішіңіз.',
      mdNoDouble: '<b>Ешқашан қос доза (2 таблетка) ішпеңіз!</b>',
      mdVomit: 'Құсу жағдайы:',
      mdVomit30: 'Дәрі ішкеннен кейін <b>30 минут ішінде</b> құссаңыз — жаңа таблетка ішіңіз.',
      mdVomit60: '<b>1 сағаттан асып кетсе</b> — қайта ішудің қажеті жоқ.',
      mdCall: '1003 — тегін сенім телефоны'
    }
  };
  const T = I18N[LANG];

  // Purge legacy caches on startup
  if ('caches' in window) {
    caches.keys().then((names) => {
      names.forEach((name) => {
        if (name !== 'hamroh-tma-v2.1') {
          console.log('[TMA] Purging legacy cache:', name);
          caches.delete(name);
        }
      });
    });
  }

  // 1. Service Worker Registration & Auto-Reload on Update
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js?v=2.1').then((reg) => {
        console.log('[TMA] Service Worker registered:', reg.scope);
        reg.update();

        reg.addEventListener('updatefound', () => {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.addEventListener('statechange', () => {
              if (installingWorker.state === 'activated' && navigator.serviceWorker.controller) {
                console.log('[TMA] New SW activated, refreshing page...');
                window.location.reload();
              }
            });
          }
        });
      }).catch((err) => {
        console.warn('[TMA] Service Worker registration failed:', err);
      });
    });
  }

  // 2. Telegram WebApp Integration
  const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
  const isTMA = !!(tg && tg.initData && tg.initData.length > 0);

  if (isTMA) {
    try {
      tg.ready();
      tg.expand();

      // Adapt colors to Telegram theme
      const params = tg.themeParams;
      if (params) {
        if (params.bg_color) document.documentElement.style.setProperty('--tg-bg', params.bg_color);
        if (params.text_color) document.documentElement.style.setProperty('--tg-text', params.text_color);
        if (params.button_color) document.documentElement.style.setProperty('--tg-btn', params.button_color);
      }

      // Handle Telegram BackButton for sub-pages
      const basePath = window.location.pathname.replace(/^\/(ru|kk)(?=\/|$)/, '') || '/';
      const isSubPage = basePath !== '/' && !basePath.endsWith('index.html');
      if (isSubPage && tg.BackButton) {
        tg.BackButton.show();
        tg.BackButton.onClick(() => {
          if (window.history.length > 1) {
            window.history.back();
          } else {
            window.location.href = LANG_PREFIX + '/index.html';
          }
        });
      } else if (tg.BackButton) {
        tg.BackButton.hide();
      }
    } catch (e) {
      console.warn('[TMA] Error initializing WebApp:', e);
    }
  }

  // Helper for Haptic Feedback
  window.tmaHaptic = function (type = 'light') {
    if (tg && tg.HapticFeedback) {
      try {
        if (type === 'success' || type === 'warning' || type === 'error') {
          tg.HapticFeedback.notificationOccurred(type);
        } else {
          tg.HapticFeedback.impactOccurred(type);
        }
      } catch (e) {}
    }
  };

  // 3. Offline Status Banner
  function updateOnlineStatus() {
    let banner = document.getElementById('tma-offline-banner');
    if (!navigator.onLine) {
      if (!banner) {
        banner = document.createElement('div');
        banner.id = 'tma-offline-banner';
        banner.innerHTML = `
          <div style="
            position: fixed; top: 12px; left: 50%; transform: translateX(-50%);
            background: #2D2A26; color: #FFFFFF; padding: 8px 18px;
            border-radius: 30px; font-size: 13px; font-weight: 700;
            display: flex; align-items: center; gap: 8px; z-index: 99999;
            box-shadow: 0 4px 15px rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.15);
          ">
            <span style="color: #D4695A; font-size: 16px;">●</span> ${T.offline}
          </div>
        `;
        document.body.appendChild(banner);
      }
    } else {
      if (banner) banner.remove();
    }
  }

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  document.addEventListener('DOMContentLoaded', updateOnlineStatus);

  // 4. JSST Missed Dose Modal Helper
  window.openMissedDoseModal = function () {
    window.tmaHaptic('medium');
    let modal = document.getElementById('tma-missed-dose-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'tma-missed-dose-modal';
      modal.style.cssText = `
        position: fixed; inset: 0; background: rgba(0,0,0,0.65);
        backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px);
        display: flex; align-items: flex-end; justify-content: center;
        z-index: 100000; padding: 0;
      `;
      modal.innerHTML = `
        <div style="
          background: #FFFFFF; width: 100%; max-width: 500px;
          border-radius: 24px 24px 0 0; padding: 24px 20px 32px;
          box-shadow: 0 -4px 30px rgba(0,0,0,0.2);
          max-height: 85vh; overflow-y: auto; text-align: left;
          font-family: 'Nunito', -apple-system, sans-serif;
        ">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <div style="font-size:18px; font-weight:800; color:#2D2A26; display:flex; align-items:center; gap:8px;">
              💊 ${T.mdTitle}
            </div>
            <button onclick="window.closeMissedDoseModal()" style="
              background: #F3EDE6; border: none; border-radius: 50%;
              width: 32px; height: 32px; font-size: 16px; cursor: pointer;
            ">✕</button>
          </div>

          <p style="font-size:14px; color:#666; line-height:1.5; margin-bottom:16px;">
            ${T.mdIntro}
          </p>

          <div style="background:#F0FDF4; border:1px solid #BBF7D0; border-radius:14px; padding:14px; margin-bottom:12px;">
            <div style="font-weight:800; color:#15803D; font-size:14px; margin-bottom:4px;">
              ⏳ ${T.mdLess12}
            </div>
            <div style="font-size:13px; color:#166534; line-height:1.4;">
              👉 ${T.mdLess12Do}
            </div>
          </div>

          <div style="background:#FEF2F2; border:1px solid #FECACA; border-radius:14px; padding:14px; margin-bottom:12px;">
            <div style="font-weight:800; color:#B91C1C; font-size:14px; margin-bottom:4px;">
              ⏳ ${T.mdMore12}
            </div>
            <div style="font-size:13px; color:#991B1B; line-height:1.4;">
              👉 ${T.mdMore12Do}<br>
              ⛔ ${T.mdNoDouble}
            </div>
          </div>

          <div style="background:#FFFBEB; border:1px solid #FDE68A; border-radius:14px; padding:14px; margin-bottom:16px;">
            <div style="font-weight:800; color:#B45309; font-size:14px; margin-bottom:4px;">
              🤢 ${T.mdVomit}
            </div>
            <div style="font-size:13px; color:#92400E; line-height:1.4;">
              • ${T.mdVomit30}<br>
              • ${T.mdVomit60}
            </div>
          </div>

          <a href="tel:1003" style="
            display: flex; align-items: center; justify-content: center; gap: 8px;
            background: #D4695A; color: #FFFFFF; padding: 14px; border-radius: 12px;
            text-decoration: none; font-weight: 700; font-size: 15px; margin-bottom: 8px;
          ">
            📞 ${T.mdCall}
          </a>
        </div>
      `;
      document.body.appendChild(modal);
      modal.addEventListener('click', (e) => {
        if (e.target === modal) window.closeMissedDoseModal();
      });
    }
    modal.style.display = 'flex';
  };

  window.closeMissedDoseModal = function () {
    const modal = document.getElementById('tma-missed-dose-modal');
    if (modal) modal.style.display = 'none';
  };

  // 5. Clean up any legacy tma-quick-bar if present
  document.addEventListener('DOMContentLoaded', () => {
    const legacy = document.getElementById('tma-quick-bar');
    if (legacy) legacy.remove();
  });
})();
