/**
 * Hamroh Telegram Mini App (TMA) & Offline Controller
 * Integrates Telegram WebApp SDK, ServiceWorker offline caching, and life-saving quick actions.
 */

(function () {
  'use strict';

  // 1. Service Worker Registration
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        console.log('[TMA] Service Worker registered:', reg.scope);
      }).catch((err) => {
        console.warn('[TMA] Service Worker registration failed:', err);
      });
    });
  }

  // 2. Telegram WebApp Integration
  const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
  const isTMA = !!tg;

  if (isTMA) {
    try {
      tg.ready();
      tg.expand();

      // Auto-redirect from desktop landing page to Patient Cabinet inside Telegram
      const isRootPage = window.location.pathname === '/' || window.location.pathname.endsWith('index.html');
      if (isRootPage && !window.location.search.includes('noredirect=1')) {
        window.location.replace('/app.html' + window.location.hash);
        return;
      }

      // Adapt colors to Telegram theme
      const params = tg.themeParams;
      if (params) {
        if (params.bg_color) document.documentElement.style.setProperty('--tg-bg', params.bg_color);
        if (params.text_color) document.documentElement.style.setProperty('--tg-text', params.text_color);
        if (params.button_color) document.documentElement.style.setProperty('--tg-btn', params.button_color);
      }

      // Handle Telegram BackButton for sub-pages
      const isSubPage = window.location.pathname !== '/' && !window.location.pathname.endsWith('index.html');
      if (isSubPage && tg.BackButton) {
        tg.BackButton.show();
        tg.BackButton.onClick(() => {
          if (window.history.length > 1) {
            window.history.back();
          } else {
            window.location.href = '/index.html';
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
            <span style="color: #D4695A; font-size: 16px;">●</span> Oflayn rejim — keshdan ishlamoqda
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
              💊 Dori ichishni unutdingizmi?
            </div>
            <button onclick="window.closeMissedDoseModal()" style="
              background: #F3EDE6; border: none; border-radius: 50%;
              width: 32px; height: 32px; font-size: 16px; cursor: pointer;
            ">✕</button>
          </div>

          <p style="font-size:14px; color:#666; line-height:1.5; margin-bottom:16px;">
            ARVT davolanishida dori vaqtini o'tkazib yuborsangiz, vahimaga tushmang. Jahon Sog'liqni Saqlash Tashkiloti (JSST) ko'rsatmasiga amal qiling:
          </p>

          <div style="background:#F0FDF4; border:1px solid #BBF7D0; border-radius:14px; padding:14px; margin-bottom:12px;">
            <div style="font-weight:800; color:#15803D; font-size:14px; margin-bottom:4px;">
              ⏳ 12 soatdan KAM vaqt o'tgan bo'lsa:
            </div>
            <div style="font-size:13px; color:#166534; line-height:1.4;">
              👉 <b>Hozir darhol 1 dozani iching!</b> Keyingi dozani odatiy jadvalingiz bo'yicha davom ettiring.
            </div>
          </div>

          <div style="background:#FEF2F2; border:1px solid #FECACA; border-radius:14px; padding:14px; margin-bottom:12px;">
            <div style="font-weight:800; color:#B91C1C; font-size:14px; margin-bottom:4px;">
              ⏳ 12 soatdan KO'P vaqt o'tgan bo'lsa:
            </div>
            <div style="font-size:13px; color:#991B1B; line-height:1.4;">
              👉 <b>Bu dozani o'tkazib yuboring!</b> Keyingi dozani o'z vaqtida iching.<br>
              ⛔ <b>Aslo ikki barobar (2 ta) doza ichmang!</b>
            </div>
          </div>

          <div style="background:#FFFBEB; border:1px solid #FDE68A; border-radius:14px; padding:14px; margin-bottom:16px;">
            <div style="font-weight:800; color:#B45309; font-size:14px; margin-bottom:4px;">
              🤢 Qayt qilish (qusish) holati:
            </div>
            <div style="font-size:13px; color:#92400E; line-height:1.4;">
              • Dori ichgach <b>30 daqiqa ichida</b> qussangiz — yangi tabletka iching.<br>
              • <b>1 soatdan oshgan bo'lsa</b> — qayta ichish shart emas.
            </div>
          </div>

          <a href="tel:1003" style="
            display: flex; align-items: center; justify-content: center; gap: 8px;
            background: #D4695A; color: #FFFFFF; padding: 14px; border-radius: 12px;
            text-decoration: none; font-weight: 700; font-size: 15px; margin-bottom: 8px;
          ">
            📞 1003 — Bepul Ishonch Telefoni
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

  // 5. Inject Floating TMA Quick Nav Bar on mobile / TMA
  document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('tma-quick-bar')) {
      const bar = document.createElement('nav');
      bar.id = 'tma-quick-bar';
      bar.style.cssText = `
        position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%);
        background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(0,0,0,0.08); border-radius: 28px;
        padding: 6px 12px; display: flex; align-items: center; gap: 4px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.12); z-index: 9999;
        font-family: 'Nunito', -apple-system, sans-serif;
      `;
      bar.innerHTML = `
        <a href="/" onclick="window.tmaHaptic('light')" style="
          display:flex; flex-direction:column; align-items:center; padding:6px 8px;
          text-decoration:none; color:#2D2A26; font-size:11px; font-weight:700; gap:2px;
        ">
          <span style="font-size:16px;">📖</span> Qo'llanma
        </a>
        <button onclick="window.openMissedDoseModal()" style="
          display:flex; flex-direction:column; align-items:center; padding:6px 8px;
          background:none; border:none; color:#D4695A; font-size:11px; font-weight:800; gap:2px; cursor:pointer;
        ">
          <span style="font-size:16px;">⚠️</span> Unutdim
        </button>
        <a href="/risk.html" onclick="window.tmaHaptic('light')" style="
          display:flex; flex-direction:column; align-items:center; padding:6px 8px;
          text-decoration:none; color:#2D2A26; font-size:11px; font-weight:700; gap:2px;
        ">
          <span style="font-size:16px;">🧪</span> Test
        </a>
        <a href="/faq.html" onclick="window.tmaHaptic('light')" style="
          display:flex; flex-direction:column; align-items:center; padding:6px 8px;
          text-decoration:none; color:#2D2A26; font-size:11px; font-weight:700; gap:2px;
        ">
          <span style="font-size:16px;">❓</span> FAQ
        </a>
        <a href="tel:1003" onclick="window.tmaHaptic('medium')" style="
          display:flex; flex-direction:column; align-items:center; padding:6px 12px;
          background:#3E6B57; color:#FFFFFF; border-radius:20px; text-decoration:none;
          font-size:11px; font-weight:800; gap:2px;
        ">
          <span style="font-size:14px;">📞</span> 1003
        </a>
      `;
      document.body.appendChild(bar);
    }
  });
})();
