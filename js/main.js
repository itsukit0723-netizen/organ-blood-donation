/* =========================================================
   REPORT | 「意思」と「支え合い」臓器提供と献血
   スクロール連動アニメーション一式
   ========================================================= */
(function () {
  'use strict';

  var root = document.documentElement;

  /* ---------------------------------------------------------
     0. 動きの設定（OSの設定 → 保存された設定 の順で判定）
     --------------------------------------------------------- */
  var mq = window.matchMedia('(prefers-reduced-motion: reduce)');

  function readStored() {
    try { return localStorage.getItem('obd-motion'); } catch (e) { return null; }
  }
  function writeStored(v) {
    try { localStorage.setItem('obd-motion', v); } catch (e) { /* 保存できなくても動作する */ }
  }

  var stored = readStored();
  var motionOff = stored ? stored === 'off' : mq.matches;

  function applyMotion() {
    root.setAttribute('data-motion', motionOff ? 'off' : 'on');
    var btn = document.getElementById('motionToggle');
    if (btn) btn.setAttribute('aria-pressed', motionOff ? 'true' : 'false');
  }
  applyMotion();

  /* ---------------------------------------------------------
     1. イラストのパーツ分割
        1枚の線画を頭・腕・胴・脚などの領域に切り分け、
        画面に入るときにパーツごとにずらして登場させる。
        ずれた状態から元の位置へ戻るので、組み上がったあとは
        1枚の絵とぴったり重なる。

        idle（登場後もずっと動き続ける動き）は、
        となりのパーツと線がつながっていない「独立したパーツ」
        （ch02の波模様など）だけに付けている。
        胴と脚のように線がつながっている境目を動かすと、
        切れ目に背景の線が出てしまうため、
        そこはイラスト全体をゆっくり浮かせる動き（figFloat）で見せる。
     --------------------------------------------------------- */
  var SPLITS = {
    /* ヒーロー：ノートPCに向かう人 */
    hero: [
      { clip: 'inset(0 0 71.6% 0)',   from: 'translate(-26px,-22px) rotate(-6deg)', idle: 'i-tilt',  dur: '6.4s', del: '0s' },
      { clip: 'inset(27.6% 0 43.6% 0)', from: 'translate(-32px,16px) rotate(4deg)',   idle: 'i-bob',   dur: '5.2s', del: '.5s' },
      { clip: 'inset(55.6% 0 23.6% 0)', from: 'translate(24px,24px) rotate(-3deg)',   idle: 'i-bob',   dur: '5.9s', del: '1.1s' },
      { clip: 'inset(75.6% 0 0 0)',   from: 'translate(16px,34px) rotate(5deg)',    idle: 'i-swing', dur: '4.8s', del: '.3s' }
    ],
    /* 目次：絵筆を持って跳ねる人（左腕・胴・右腕・脚） */
    toc: [
      { clip: 'inset(0 72.6% 0 0)',    from: 'translate(-40px,10px) rotate(-9deg)', idle: 'i-swing', dur: '4.4s', del: '0s' },
      { clip: 'inset(0 41.6% 0 26.6%)',  from: 'translateY(30px) scale(.94)',         idle: 'i-bob',   dur: '5s',   del: '.4s' },
      { clip: 'inset(0 0 44.6% 57.6%)',  from: 'translate(40px,-14px) rotate(9deg)',  idle: 'i-swing', dur: '4.1s', del: '.8s' },
      { clip: 'inset(54.6% 0 0 57.6%)',  from: 'translate(28px,26px) rotate(6deg)',   idle: 'i-sway',  dur: '5.4s', del: '.2s' }
    ],
    /* 01：ペンで線を描く人（線は左から描かれる） */
    climb: [
      { clip: 'inset(0 0 63.6% 0)',   from: 'none',                                idle: 'i-drift', dur: '9s',   del: '0s', wipe: true },
      { clip: 'inset(35.6% 0 45.6% 0)', from: 'translate(-26px,20px) rotate(-5deg)', idle: 'i-tilt',  dur: '6.2s', del: '.4s' },
      { clip: 'inset(53.6% 0 23.6% 0)', from: 'translate(-18px,28px) rotate(4deg)',  idle: 'i-bob',   dur: '5.5s', del: '.9s' },
      { clip: 'inset(75.6% 0 0 0)',   from: 'translate(14px,34px) rotate(7deg)',   idle: 'i-swing', dur: '4.6s', del: '.2s' }
    ],
    /* 02：波模様と、寝ころんでスマホを見る人
       57%の行は完全に透明で、波模様と人物が離れている。
       そこで切っているので、波模様だけはずっと動かしても線が切れない。 */
    listen: [
      { clip: 'inset(0 0 43% 0)',      from: 'translate(34px,-26px) rotate(4deg)',  idle: 'i-drift', dur: '8.5s', del: '0s', free: true },
      { clip: 'inset(57% 54.6% 0 0)',  from: 'translate(-34px,26px) rotate(-6deg)' },
      { clip: 'inset(57% 0 0 44.6%)',  from: 'translate(26px,26px) rotate(3deg)' }
    ],
    /* 03：寝ころんで読む人＋きらめき */
    read: [
      { clip: 'inset(0 71.6% 0 0)',   from: 'translate(-38px,-18px) rotate(-8deg)', idle: 'i-swing', dur: '4.9s', del: '0s' },
      { clip: 'inset(0 37.6% 0 27.6%)', from: 'translateY(30px) scale(.95)',          idle: 'i-bob',   dur: '5.6s', del: '.5s' },
      { clip: 'inset(0 0 0 61.6%)',   from: 'translate(38px,20px) rotate(6deg)',    idle: 'i-sway',  dur: '6.3s', del: '.9s' }
    ],
    /* 04：ハートの吹き出しを浮かべる人 */
    heart: [
      { clip: 'inset(0 0 81.6% 69.6%)', from: 'translate(22px,-30px) scale(.4)',      idle: 'i-bob',   dur: '3.4s', del: '.2s' },
      { clip: 'polygon(0 0, 70% 0, 70% 18%, 100% 18%, 100% 28.4%, 0 28.4%)',
                                    from: 'translate(-18px,-22px) rotate(-5deg)', idle: 'i-tilt',  dur: '6.1s', del: '.5s' },
      { clip: 'inset(27.6% 0 41.6% 0)', from: 'translateY(28px) scale(.96)',          idle: 'i-bob',   dur: '5.3s', del: '.9s' },
      { clip: 'inset(57.6% 0 0 0)',   from: 'translate(18px,34px) rotate(5deg)',    idle: 'i-swing', dur: '4.7s', del: '.1s' }
    ],
    /* まとめ：両手を上げて跳ぶ人（左手・右手・胴・脚） */
    jump: [
      { clip: 'inset(0 49.6% 73.6% 0)', from: 'translate(-30px,-30px) rotate(-14deg)', idle: 'i-swing', dur: '3.6s', del: '0s' },
      { clip: 'inset(0 0 73.6% 49.6%)', from: 'translate(30px,-30px) rotate(14deg)',   idle: 'i-swing', dur: '3.9s', del: '.5s' },
      { clip: 'inset(25.6% 0 41.6% 0)', from: 'translateY(32px) scale(.94)',           idle: 'i-bob',   dur: '4.4s', del: '.2s' },
      { clip: 'inset(57.6% 0 0 0)',   from: 'translateY(40px) rotate(4deg)',         idle: 'i-sway',  dur: '5.1s', del: '.8s' }
    ],
    /* 汎用：立ち姿の3分割（頭・胴・脚） */
    stand3: [
      { clip: 'inset(0 0 63.6% 0)',   from: 'translate(-22px,-20px) rotate(-5deg)', idle: 'i-tilt',  dur: '5.8s', del: '0s' },
      { clip: 'inset(35.6% 0 31.6% 0)', from: 'translateY(28px) scale(.95)',          idle: 'i-bob',   dur: '5.1s', del: '.5s' },
      { clip: 'inset(67.6% 0 0 0)',   from: 'translate(18px,30px) rotate(5deg)',    idle: 'i-swing', dur: '4.5s', del: '.9s' }
    ],
    /* 大きな鉛筆を抱える人 */
    pencil: [
      { clip: 'inset(0 0 59.6% 0)',   from: 'translate(26px,-28px) rotate(10deg)', idle: 'i-tilt',  dur: '5.4s', del: '0s' },
      { clip: 'inset(39.6% 0 29.6% 0)', from: 'translateY(26px) scale(.95)',         idle: 'i-bob',   dur: '5.9s', del: '.5s' },
      { clip: 'inset(69.6% 0 0 0)',   from: 'translate(-20px,28px) rotate(-6deg)', idle: 'i-swing', dur: '4.7s', del: '.9s' }
    ],
    /* 書類を舞わせる人 */
    papers: [
      { clip: 'inset(0 61.6% 0 0)',   from: 'translate(-34px,-16px) rotate(-10deg)', idle: 'i-swing', dur: '4.2s', del: '0s' },
      { clip: 'inset(0 29.6% 0 37.6%)', from: 'translateY(28px) scale(.95)',           idle: 'i-bob',   dur: '5.5s', del: '.4s' },
      { clip: 'inset(0 0 0 69.6%)',   from: 'translate(34px,-20px) rotate(10deg)',   idle: 'i-swing', dur: '3.9s', del: '.8s' }
    ]
  };

  /* イラストごとに、ゆっくり浮かぶ動きの速さを少しずつ変える */
  var FLOAT = {
    hero:   ['7.5s', '0s'],   toc:    ['6.4s', '.6s'],
    climb:  ['8.2s', '.2s'],  listen: ['7.8s', '.9s'],
    read:   ['6.8s', '.4s'],  heart:  ['7.1s', '.7s'],
    jump:   ['5.6s', '.1s'],  stand3: ['7.2s', '.3s'],
    pencil: ['6.6s', '.8s'],  papers: ['6.1s', '.5s']
  };

  function buildSplit(img) {
    var key = img.getAttribute('data-split');
    var parts = SPLITS[key];
    var fig = img.parentElement;
    if (!parts || !fig) return;

    var frag = document.createDocumentFragment();
    parts.forEach(function (p, i) {
      var wrapEl = document.createElement('span');
      wrapEl.className = 'fig__p' + (p.wipe ? ' fig__p--wipe' : '');
      wrapEl.setAttribute('aria-hidden', 'true');
      wrapEl.style.setProperty('--from', p.from || 'none');
      wrapEl.style.setProperty('--pd', (i * 0.11) + 's');

      var pi = document.createElement('img');
      pi.className = 'fig__pi ' + (p.free && p.idle ? p.idle : 'i-none');
      pi.src = img.currentSrc || img.src;
      pi.alt = '';
      pi.setAttribute('aria-hidden', 'true');
      pi.style.setProperty('--clip', p.clip);
      pi.style.setProperty('--idur', p.dur || '5s');
      pi.style.setProperty('--idel', p.del || '0s');

      wrapEl.appendChild(pi);
      frag.appendChild(wrapEl);
    });
    fig.appendChild(frag);
    var fl = FLOAT[key] || ['7s', '0s'];
    fig.style.setProperty('--fdur', fl[0]);
    fig.style.setProperty('--fdel', fl[1]);
    fig.classList.add('is-split');
  }

  document.querySelectorAll('img[data-split]').forEach(buildSplit);

  /* ---------------------------------------------------------
     2. 画面に入ったら動かす（IntersectionObserver）
     --------------------------------------------------------- */
  var targets = document.querySelectorAll('[data-anim], .fig');

  function reveal(el) {
    el.classList.add('in');
    if (el.classList.contains('fig')) {
      window.setTimeout(function () { el.classList.add('is-idle'); }, motionOff ? 0 : 1400);
    }
  }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        reveal(e.target);
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });

    targets.forEach(function (el) { io.observe(el); });

    /* 初期表示で画面内にあるものは、下端の余白設定に関係なく必ず動かす */
    window.requestAnimationFrame(function () {
      targets.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) {
          reveal(el);
          io.unobserve(el);
        }
      });
    });
  } else {
    targets.forEach(function (el) { el.classList.add('in', 'is-idle'); });
  }

  /* ---------------------------------------------------------
     3. 数値のカウントアップ
     --------------------------------------------------------- */
  function format(n, comma) {
    return comma ? n.toLocaleString('ja-JP') : String(n);
  }

  function countUp(el) {
    var target = parseInt(el.getAttribute('data-count'), 10) || 0;
    var comma = el.hasAttribute('data-comma');
    if (motionOff) { el.textContent = format(target, comma); return; }

    var dur = 1500;
    var t0 = null;
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = format(Math.round(target * eased), comma);
      if (p < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  }

  var nums = document.querySelectorAll('.num[data-count]');
  if ('IntersectionObserver' in window) {
    var nio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        countUp(e.target);
        nio.unobserve(e.target);
      });
    }, { threshold: 0.6 });
    nums.forEach(function (el) { nio.observe(el); });
  } else {
    nums.forEach(function (el) {
      el.textContent = format(parseInt(el.getAttribute('data-count'), 10) || 0, el.hasAttribute('data-comma'));
    });
  }

  /* ---------------------------------------------------------
     4. 検索窓のタイピング演出（プレゼン最終ページの再現）
     --------------------------------------------------------- */
  var q = document.querySelector('.search__q');
  if (q) {
    var text = q.getAttribute('data-type') || '';
    var caret = document.querySelector('.search__caret');

    function type() {
      if (motionOff) {
        q.textContent = text;
        if (caret) caret.classList.add('is-done');
        return;
      }
      var i = 0;
      var timer = window.setInterval(function () {
        q.textContent = text.slice(0, ++i);
        if (i >= text.length) {
          window.clearInterval(timer);
          window.setTimeout(function () {
            if (caret) caret.classList.add('is-done');
          }, 1800);
        }
      }, 170);
    }

    if ('IntersectionObserver' in window) {
      var tio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          window.setTimeout(type, motionOff ? 0 : 700);
          tio.unobserve(e.target);
        });
      }, { threshold: 0.4 });
      tio.observe(q.closest('.search') || q);
    } else {
      q.textContent = text;
    }
  }

  /* ---------------------------------------------------------
     5. 進捗バーと章ドットナビ
     --------------------------------------------------------- */
  var bar = document.querySelector('.progress__bar');
  var dotLinks = Array.prototype.slice.call(document.querySelectorAll('.dots a[data-dot]'));
  var sections = dotLinks
    .map(function (a) { return document.getElementById(a.getAttribute('data-dot')); })
    .filter(Boolean);
  var ticking = false;

  function onScroll() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    var y = window.scrollY || doc.scrollTop || 0;
    if (bar) bar.style.width = (max > 0 ? Math.min(y / max, 1) * 100 : 0) + '%';

    var line = y + window.innerHeight * 0.4;
    var active = -1;
    sections.forEach(function (s, i) {
      if (s.offsetTop <= line) active = i;
    });
    dotLinks.forEach(function (a, i) {
      a.classList.toggle('is-active', i === active);
      if (i === active) { a.setAttribute('aria-current', 'true'); }
      else { a.removeAttribute('aria-current'); }
    });
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(onScroll);
  }, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();

  /* ---------------------------------------------------------
     6. 設定パネル（動きを減らす／先頭にもどる）
     --------------------------------------------------------- */
  var toolsBtn = document.querySelector('.tools__btn');
  var toolsPanel = document.getElementById('toolsPanel');
  var toolsWrap = document.querySelector('.tools');

  function closeTools() {
    if (!toolsPanel || toolsPanel.hidden) return;
    toolsPanel.hidden = true;
    toolsBtn.setAttribute('aria-expanded', 'false');
  }

  if (toolsBtn && toolsPanel) {
    toolsBtn.addEventListener('click', function () {
      var open = toolsPanel.hidden;
      toolsPanel.hidden = !open;
      toolsBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function (e) {
      if (toolsWrap && !toolsWrap.contains(e.target)) closeTools();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeTools();
    });
  }

  var motionBtn = document.getElementById('motionToggle');
  if (motionBtn) {
    motionBtn.addEventListener('click', function () {
      motionOff = !motionOff;
      writeStored(motionOff ? 'off' : 'on');
      applyMotion();
      if (motionOff) {
        document.querySelectorAll('.num[data-count]').forEach(function (el) {
          el.textContent = format(parseInt(el.getAttribute('data-count'), 10) || 0, el.hasAttribute('data-comma'));
        });
        if (q) q.textContent = q.getAttribute('data-type') || '';
        document.querySelectorAll('[data-anim], .fig').forEach(function (el) {
          el.classList.add('in', 'is-idle');
        });
      }
    });
  }
})();
