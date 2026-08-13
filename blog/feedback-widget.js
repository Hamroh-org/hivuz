// Maqola oxiridagi 👍/👎 fikr-mulohaza vidjeti. Har bir sahifada
// <div id="hamroh-feedback"></div> mavjud bo'lsa o'zini o'sha yerga
// chizadi. content_feedback jadvaliga faqat submit_website_feedback
// RPC orqali yoziladi (anon key — client hech qachon to'g'ridan-to'g'ri
// insert qilmaydi).
(() => {
  const SUPABASE_URL = 'https://wwawjyfrpdjgnxvzhkbx.supabase.co';
  const ANON_KEY = 'sb_publishable_md7EGOzln1PoeKOu4-cGUA_hvyKvyEp';
  const REASONS = ['Termin', "Tushuntirish yetarli emas", "Ko'proq misol kerak", 'Manba', 'Boshqa'];

  function injectStyles() {
    if (document.getElementById('hfw-style')) return;
    const style = document.createElement('style');
    style.id = 'hfw-style';
    style.textContent = `
.hfw{max-width:800px;margin:0 auto;padding:0 2rem 3rem;font-family:'Syne',sans-serif;}
.hfw-card{background:#F3EDE6;border:1px solid rgba(45,42,38,0.07);border-radius:4px;padding:1.5rem;}
.hfw-q{font-size:14px;color:#2D2A26;font-weight:600;margin-bottom:1rem;}
.hfw-btns{display:flex;gap:10px;flex-wrap:wrap;}
.hfw-btn{display:flex;align-items:center;gap:8px;padding:10px 20px;border-radius:3px;border:1px solid rgba(45,42,38,0.1);background:#FFFFFF;cursor:pointer;font-family:'Syne',sans-serif;font-size:13px;color:rgba(45,42,38,0.6);transition:all .2s;}
.hfw-btn:hover{border-color:rgba(62,107,87,0.35);}
.hfw-btn.on{border-color:#3E6B57;background:rgba(62,107,87,0.08);color:#2D2A26;}
.hfw-extra{margin-top:1rem;}
.hfw-chips{display:flex;flex-wrap:wrap;gap:8px;}
.hfw-chip{padding:6px 14px;border-radius:100px;border:1px solid rgba(45,42,38,0.12);background:#FFFFFF;font-family:'DM Mono',monospace;font-size:11px;color:rgba(45,42,38,0.5);cursor:pointer;}
.hfw-chip.on{border-color:#E8896B;background:rgba(232,137,107,0.1);color:#C25638;}
.hfw-text{display:block;width:100%;margin-top:1rem;border:1px solid rgba(45,42,38,0.1);border-radius:3px;padding:10px 12px;font-family:'Syne',sans-serif;font-size:13px;color:#2D2A26;background:#FFFFFF;resize:vertical;min-height:56px;}
.hfw-submit{margin-top:1rem;background:#3E6B57;color:#FAF6F1;border:none;border-radius:3px;padding:10px 22px;font-family:'DM Mono',monospace;font-size:12px;letter-spacing:.05em;cursor:pointer;}
.hfw-submit:disabled{opacity:.5;cursor:default;}
.hfw-thanks{font-size:14px;color:#3E6B57;}
`;
    document.head.appendChild(style);
  }

  function submitFeedback(payload) {
    return fetch(`${SUPABASE_URL}/rest/v1/rpc/submit_website_feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify(payload),
    });
  }

  function render(container) {
    injectStyles();
    let rating = null;
    let reason = null;

    const wrap = document.createElement('div');
    wrap.className = 'hfw';
    wrap.innerHTML = `
<div class="hfw-card">
  <div class="hfw-q">Bu maqola sizga foydali bo'ldimi?</div>
  <div class="hfw-btns">
    <button type="button" class="hfw-btn" data-r="up">👍 Ha, foydali</button>
    <button type="button" class="hfw-btn" data-r="down">👎 Unchalik emas</button>
  </div>
  <div class="hfw-extra" style="display:none;">
    <div class="hfw-chips"></div>
    <textarea class="hfw-text" placeholder="Yana biror narsa qo'shmoqchimisiz? (ixtiyoriy)"></textarea>
    <button type="button" class="hfw-submit">Yuborish</button>
  </div>
</div>`;
    container.appendChild(wrap);

    const btns = wrap.querySelectorAll('.hfw-btn');
    const extra = wrap.querySelector('.hfw-extra');
    const chipsBox = wrap.querySelector('.hfw-chips');
    const textarea = wrap.querySelector('.hfw-text');
    const submitBtn = wrap.querySelector('.hfw-submit');

    REASONS.forEach(r => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'hfw-chip';
      chip.textContent = r;
      chip.onclick = () => {
        reason = reason === r ? null : r;
        chipsBox.querySelectorAll('.hfw-chip').forEach(c => c.classList.remove('on'));
        if (reason === r) chip.classList.add('on');
      };
      chipsBox.appendChild(chip);
    });

    function finish() {
      wrap.querySelector('.hfw-card').innerHTML =
        '<div class="hfw-thanks">Fikringiz uchun rahmat — shu bilan maqolalarni yaxshilaymiz. 🙏</div>';
    }

    function send() {
      submitBtn.disabled = true;
      submitFeedback({
        p_page_url: location.href,
        p_rating: rating,
        p_reason: reason,
        p_comment: textarea.value.trim() || null,
      })
        .then(finish)
        // Best-effort: tarmoq xatosi bo'lsa ham foydalanuvchiga rahmat aytamiz,
        // qayta urinishni majburlamaymiz.
        .catch(finish);
    }

    btns.forEach(btn => {
      btn.onclick = () => {
        rating = btn.getAttribute('data-r');
        btns.forEach(b => b.classList.toggle('on', b === btn));
        if (rating === 'up') {
          send();
        } else {
          extra.style.display = 'block';
        }
      };
    });

    submitBtn.onclick = send;
  }

  function init() {
    const el = document.getElementById('hamroh-feedback');
    if (!el) return;
    render(el);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
