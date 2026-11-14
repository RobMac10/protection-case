(function () {
  var root = document.documentElement;
  root.classList.add('js');
  var KEY = 'batavia-case-v1';
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role=tab]'));
  var panels = {
    notebook: document.getElementById('notebook'),
    case: document.getElementById('case'),
    finding: document.getElementById('finding'),
    sleuth: document.getElementById('sleuth')
  };
  var aliases = {
    diary: 'notebook',
    thediary: 'notebook',
    'the-diary': 'notebook',
    letter: 'notebook',
    thenotebook: 'notebook',
    'the-notebook': 'notebook',
    opener: 'notebook',
    note: 'notebook',
    'the-note': 'notebook',
    brief: 'case',
    casefile: 'finding',
    supersleuths: 'sleuth',
    'super-sleuths': 'sleuth'
  };

  function show(name, focusTop) {
    name = aliases[name] || name;
    if (!panels[name]) name = 'notebook';
    Object.keys(panels).forEach(function (k) { panels[k].classList.toggle('active', k === name); });
    tabs.forEach(function (t) { t.setAttribute('aria-selected', String(t.dataset.tab === name)); });
    if (focusTop !== undefined && history.replaceState) history.replaceState(null, '', '#' + name);
    if (name === 'case' || name === 'finding' || name === 'sleuth') grow();
    if (focusTop) { var t = document.querySelector('.tabs'); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  }
  tabs.forEach(function (t) { t.addEventListener('click', function () { show(t.dataset.tab, true); }); });
  Array.prototype.forEach.call(document.querySelectorAll('[data-goto]'), function (b) {
    b.addEventListener('click', function () { show(b.dataset.goto, true); });
  });
  function fromHash() {
    var name = (location.hash || '').replace('#', '');
    name = aliases[name] || name;
    show(panels[name] ? name : 'notebook');
  }
  window.addEventListener('hashchange', fromHash);
  fromHash();

  var EASY_KEY = 'batavia-easy-read';
  var easy = document.getElementById('easy-read');
  function applyEasy(on) {
    document.body.classList.toggle('easy-read', !!on);
    if (easy) {
      easy.checked = !!on;
      easy.setAttribute('aria-checked', on ? 'true' : 'false');
      var st = document.querySelector('.easy-toggle .easy-state');
      if (st) st.textContent = on ? 'On' : 'Off';
    }
    try { localStorage.setItem(EASY_KEY, on ? '1' : '0'); } catch (e) {}
  }
  if (easy) {
    var savedEasy = false;
    try { savedEasy = localStorage.getItem(EASY_KEY) === '1'; } catch (e) {}
    applyEasy(savedEasy);
    easy.addEventListener('change', function () { applyEasy(easy.checked); });
  }

  var fields = Array.prototype.slice.call(document.querySelectorAll('textarea[data-key], input[type=text][data-key]'));
  var radios = Array.prototype.slice.call(document.querySelectorAll('input[type=radio][name]'));
  var data = {};
  try { data = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { data = {}; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {} }
  fields.forEach(function (f) {
    if (data[f.dataset.key]) f.value = data[f.dataset.key];
    f.addEventListener('input', function () { data[f.dataset.key] = f.value; save(); size(f); });
  });
  radios.forEach(function (r) {
    if (data[r.name] === r.value) r.checked = true;
    r.addEventListener('change', function () { data[r.name] = r.value; save(); });
  });
  function size(f) {
    if (f.tagName !== 'TEXTAREA') return;
    f.style.height = 'auto';
    f.style.height = (f.scrollHeight + 2) + 'px';
  }
  function grow() { if (fields) fields.forEach(size); }
  window.addEventListener('resize', grow);
  window.addEventListener('beforeprint', grow);
  setTimeout(grow, 50);

  function clearAnswers() {
    if (!window.confirm('Clear everything you have written on this device?')) return;
    data = {}; save();
    fields.forEach(function (f) { f.value = ''; size(f); });
    radios.forEach(function (r) { r.checked = false; });
  }
  ['clear', 'clear-sleuth'].forEach(function (id) {
    var b = document.getElementById(id);
    if (b) b.addEventListener('click', clearAnswers);
  });

  function doPrint(mode) {
    mode = aliases[mode] || mode;
    if (panels[mode]) show(mode);
    var opened = [];
    if (mode === 'sleuth') {
      document.querySelectorAll('#sleuth details').forEach(function (d) {
        if (!d.open) { d.open = true; opened.push(d); }
      });
    }
    document.body.setAttribute('data-print', mode);
    grow();
    var done = function () {
      document.body.removeAttribute('data-print');
      opened.forEach(function (d) { d.open = false; });
      window.removeEventListener('afterprint', done);
    };
    window.addEventListener('afterprint', done);
    setTimeout(function () { window.print(); }, 50);
  }
  Array.prototype.forEach.call(document.querySelectorAll('[data-print]'), function (b) {
    if (b.tagName === 'BUTTON') b.addEventListener('click', function () { doPrint(b.dataset.print); });
  });

  (function portraitLightbox() {
    var lb = document.getElementById('portrait-lightbox');
    if (!lb) return;
    var closeBtn = lb.querySelector('.lightbox-close');
    var stage = lb.querySelector('.lightbox-stage');
    var img = stage ? stage.querySelector('img') : null;
    var title = document.getElementById('portrait-lightbox-title');
    var lastFocus = null;
    function isOpen() { return !lb.hasAttribute('hidden'); }
    function open(src, alt) {
      if (!img) return;
      lastFocus = document.activeElement;
      img.src = src;
      img.alt = alt || '';
      if (title) title.textContent = alt || 'Magnified image';
      lb.removeAttribute('hidden');
      document.body.classList.add('lightbox-open');
      if (closeBtn) closeBtn.focus();
    }
    function close() {
      lb.setAttribute('hidden', '');
      document.body.classList.remove('lightbox-open');
      if (img) img.src = '';
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    Array.prototype.forEach.call(document.querySelectorAll('.portrait-zoom'), function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var pic = btn.querySelector('img');
        if (pic) open(pic.currentSrc || pic.src, pic.alt);
      });
    });
    if (closeBtn) closeBtn.addEventListener('click', function (e) { e.stopPropagation(); close(); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) close();
    });
  })();
})();
