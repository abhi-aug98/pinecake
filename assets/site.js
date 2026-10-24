/* Pinewake Exchange Tracking Lab - core: trk object, dataLayer, GTM loader, Fullstory simulator, shared chrome */
(function () {
  'use strict';
  var GTM_ID = 'GTM-M5HQ3Z9K';
  var P = window.PAGE || {};

  /* ---------- trk object (same shape as the original test site) ---------- */
  window.trk = {
    pagename: P.pagename || 'unknown',
    channel: P.channel || 'find',
    statename: 'ohio',
    statecode: 'oh',
    city: 'springfield',
    zipcode: '45501',
    dma: '542-dayton-oh',
    canary: 'Nuxt',
    sitetype: 'SM'
  };

  /* ---------- static dataLayer (no event pushes) ---------- */
  window.dataLayer = window.dataLayer || [];

  /* ---------- trk prefill: everything the page knows at load time lives on trk ---------- */
  var sp = new URLSearchParams(location.search), all = window.LISTINGS || [];
  function setIf(k, v) { if (v !== undefined && v !== null && v !== '') trk[k] = v; }
  if (P.pagename === 'vdp') {
    var cur = all.filter(function (l) { return l.id === (sp.get('id') || 'L-1001'); })[0] || all[0];
    setIf('listing_id', cur.id); setIf('make', cur.make); setIf('model', cur.model); setIf('year', cur.year);
    setIf('price', cur.price === null ? undefined : cur.price);   // omitted when no price
    setIf('condition', cur.condition); setIf('listing_type', cur.type);
  }
  if (P.pagename === 'search') {
    var found = window.searchListings({ q: sp.get('q'), type: sp.get('type'), make: sp.get('make'), max: sp.get('max'), sort: sp.get('sort') });
    setIf('search_term', sp.get('q')); trk.result_count = found.length; setIf('filter_type', sp.get('type')); setIf('filter_make', sp.get('make'));
    setIf('filter_max_price', +sp.get('max') || undefined); trk.sort = sp.get('sort') || 'relevance'; trk.page_number = +sp.get('page') || 1;
  }
  // track(): kept as a state setter only. It never pushes to the dataLayer. Only these results update trk.
  var STATE = { lead_submitted: ['lead_ref'], ad_submitted: ['ad_ref'], login_succeeded: ['user_id'], account_created: ['user_id'], payment_calculated: ['monthly_payment'] };
  window.track = function (event, props) {
    (STATE[event] || []).forEach(function (k) { if (props && props[k] !== undefined) trk[k] = props[k]; });
  };

  /* ---------- Fullstory simulator ---------- */
  // The log survives page loads (sessionStorage) so click events are still visible after navigation.
  var LOG_KEY = 'pw_fslog', KEEP_KEY = 'pw_fslog_keep', fsLog = [];
  function store(op, k, v) { try { return op === 'get' ? sessionStorage.getItem(k) : op === 'set' ? sessionStorage.setItem(k, v) : sessionStorage.removeItem(k); } catch (e) { return null; } }
  var keep = store('get', KEEP_KEY) !== '0';
  if (keep) { try { fsLog = JSON.parse(store('get', LOG_KEY) || '[]'); } catch (e) { fsLog = []; } } else { store('del', LOG_KEY); }
  function persist() { store('set', LOG_KEY, JSON.stringify(fsLog.slice(-500))); }
  window.__fsLog = fsLog;
  function fsRecord(method, payload) {
    var entry = { t: new Date().toISOString().slice(11, 23), page: location.pathname.split('/').pop() || 'index.html', method: method, payload: payload };
    fsLog.push(entry); persist();
    if (window.console && console.info) console.info('[FS sim]', method, payload);
    renderLogEntry(entry);
  }
  function FS(command, arg) {
    // Modern API: FS('trackEvent', {name, properties}), FS('setIdentity', {uid, properties}), FS('setProperties', {type, properties})
    fsRecord('FS("' + command + '")', arg);
  }
  FS.event = function (name, props) { fsRecord('FS.event', { name: name, properties: props }); };
  FS.identify = function (uid, props) { fsRecord('FS.identify', { uid: uid, properties: props }); };
  FS.setUserVars = function (props) { fsRecord('FS.setUserVars', props); };
  FS.setVars = function (type, props) { fsRecord('FS.setVars', { type: type, properties: props }); };
  FS.log = function () { fsRecord('FS.log', Array.prototype.slice.call(arguments)); };
  FS.getCurrentSessionURL = function () { return 'https://app.fullstory.com/ui/SIMULATED/session/sim'; };
  window.FS = FS;

  /* ---------- GTM loader ---------- */
  var loaded = {};
  function loadGTM(id) {
    if (loaded[id]) return false;
    loaded[id] = true;
    (function (w, d, s, l, i) {
      w[l] = w[l] || [];
      w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
      var f = d.getElementsByTagName(s)[0], j = d.createElement(s);
      j.async = true;
      j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i;
      f.parentNode.insertBefore(j, f);
    })(window, document, 'script', 'dataLayer', id);
    return true;
  }
  window.__loadGTM = loadGTM;
  loadGTM(GTM_ID);

  /* ---------- small utilities ---------- */
  window.fmtPrice = function (p) { return p ? '$' + p.toLocaleString('en-US') : 'Call for price'; };
  window.esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); };
  window.qs = function (k) { return new URLSearchParams(location.search).get(k); };
  window.safeStore = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
  };

  /* ---------- shared chrome: header, footer, harness panel ---------- */
  var NAV = [['Home', 'index.html', 'nav-home'], ['Search', 'search.html', 'nav-search'], ['Sell', 'sell.html', 'nav-sell'], ['Log in', 'login.html', 'nav-login']];
  function chrome() {
    var h = document.getElementById('site-header');
    if (h) {
      h.className = 'site-header';
      h.innerHTML = '<div class="wrap hdr"><a class="brand" href="index.html" data-track="logo">Pinewake <span>Exchange</span></a><nav>' +
        NAV.map(function (n) { return '<a href="' + n[1] + '" data-track="' + n[2] + '">' + n[0] + '</a>'; }).join('') + '</nav></div>';
    }
    var f = document.getElementById('site-footer');
    if (f) {
      f.className = 'site-footer';
      f.innerHTML = '<div class="wrap ftr"><div><a href="about.html" data-track="footer-about">About</a> · <a href="help.html" data-track="footer-help">Need help?</a> · ' +
        '<a href="https://example.org/partners" data-track="footer-partner-outbound" rel="noopener">Partner site</a></div>' +
        '<form id="newsletter" class="nl" novalidate><label for="nl-email">Deal alerts</label><input id="nl-email" type="email" placeholder="you@example.com" required><button type="submit">Subscribe</button><span id="nl-msg" role="status"></span></form>' +
        '<p class="fine">Fictional test site. Nothing is sent anywhere except your own GTM container / preview.</p></div>';
      document.getElementById('newsletter').addEventListener('submit', function (e) {
        e.preventDefault();
        var v = document.getElementById('nl-email').value.trim(), m = document.getElementById('nl-msg');
        if (!/^\S+@\S+\.\S+$/.test(v)) { m.textContent = 'Enter a valid email.'; track('newsletter_failed', { location: 'footer', error_type: 'validation' }); return; }
        m.textContent = 'Thanks, you are subscribed.';
        track('newsletter_submitted', { location: 'footer' });
      });
    }
    panel();
  }

  /* ---------- test-harness panel (GTM loader + Fullstory call log) ---------- */
  var logBody, logWrap, pill, gtmStatus, lastPage;
  function renderLogEntry(entry) {
    if (!logBody) return;
    var empty = logBody.querySelector('.empty'); if (empty) empty.remove();
    if (entry.page && entry.page !== lastPage) {
      var sep = document.createElement('div'); sep.className = 'sep'; sep.textContent = '\u2192 ' + entry.page; logBody.appendChild(sep); lastPage = entry.page;
    }
    var d = document.createElement('div'); d.className = 'entry';
    d.innerHTML = '<b>' + entry.t + '</b> <code>' + esc(entry.method) + '</code><pre>' + esc(JSON.stringify(entry.payload, null, 2)) + '</pre>';
    logBody.appendChild(d); logBody.scrollTop = logBody.scrollHeight;
  }
  function panel() {
    var box = document.createElement('aside'); box.id = 'harness'; box.setAttribute('aria-label', 'Test harness');
    box.innerHTML =
      '<div class="gtm"><strong>Test harness GTM:</strong> <span id="gtm-status">loaded (' + GTM_ID + ')</span>' +
      '<div class="row"><label for="gtm-id">Container ID</label><input id="gtm-id" value="' + GTM_ID + '" spellcheck="false"><button id="gtm-load" type="button">Load</button></div></div>' +
      '<div class="fs" id="fs-wrap"><div class="fs-head"><strong>Fullstory calls (simulated)</strong>' +
      '<span><label class="keep"><input type="checkbox" id="fs-keep"' + (keep ? ' checked' : '') + '> Preserve log</label><button type="button" id="fs-copy">Copy log</button><button type="button" id="fs-clear">Clear</button><button type="button" id="fs-hide">Hide</button><button type="button" id="fs-close">Close</button></span></div>' +
      '<div class="fs-body" id="fs-body"><div class="empty">No Fullstory calls yet</div></div></div>';
    document.body.appendChild(box);
    pill = document.createElement('button'); pill.id = 'fs-pill'; pill.type = 'button'; pill.textContent = 'Show harness'; pill.hidden = true; document.body.appendChild(pill);
    logBody = document.getElementById('fs-body'); logWrap = box; gtmStatus = document.getElementById('gtm-status');
    fsLog.forEach(renderLogEntry);
    document.getElementById('gtm-load').onclick = function () {
      var id = document.getElementById('gtm-id').value.trim().toUpperCase();
      if (!/^GTM-[A-Z0-9]{4,}$/.test(id)) { gtmStatus.textContent = 'invalid container ID'; return; }
      gtmStatus.textContent = loadGTM(id) ? 'loaded (' + id + ')' : 'already loaded (' + id + ')';
    };
    document.getElementById('fs-clear').onclick = function () { fsLog.length = 0; persist(); lastPage = undefined; logBody.innerHTML = '<div class="empty">No Fullstory calls yet</div>'; };
    document.getElementById('fs-keep').onchange = function () { store('set', KEEP_KEY, this.checked ? '1' : '0'); if (this.checked) persist(); };
    document.getElementById('fs-copy').onclick = function () {
      var txt = JSON.stringify(fsLog, null, 2);
      (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).catch(function () {
        var ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) { /* ignore */ } ta.remove();
      });
      this.textContent = 'Copied'; var b = this; setTimeout(function () { b.textContent = 'Copy log'; }, 1200);
    };
    document.getElementById('fs-hide').onclick = function () { logWrap.hidden = true; pill.hidden = false; };
    pill.onclick = function () { logWrap.hidden = false; pill.hidden = true; };
    document.getElementById('fs-close').onclick = function () { logWrap.remove(); pill.remove(); };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', chrome); else chrome();
})();
