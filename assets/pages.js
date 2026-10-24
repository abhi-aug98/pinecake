/* Page logic + dataLayer events for Pinewake Exchange Tracking Lab */
(function () {
  'use strict';
  var L = window.LISTINGS, page = (window.PAGE || {}).pagename;
  function byId(id) { return L.filter(function (l) { return l.id === id; })[0]; }
  function title(l) { return l.year + ' ' + l.make + ' ' + l.model; }
  function lp(l, extra) { // common listing props (price omitted when none)
    var o = { listing_id: l.id, make: l.make, price: l.price === null ? undefined : l.price };
    Object.keys(extra || {}).forEach(function (k) { o[k] = extra[k]; });
    return o;
  }
  var saved = {};
  try { saved = JSON.parse(safeStore.get('pw_saved') || '{}'); } catch (e) { saved = {}; }

  function card(l, placement, pos) {
    return '<article class="card" data-id="' + l.id + '" data-placement="' + placement + '" data-pos="' + pos + '">' +
      '<a class="thumb ' + l.type + '" href="listing.html?id=' + l.id + '" data-listing-link aria-label="' + esc(title(l)) + '">' + (l.type === 'rv' ? '🚐' : '🚤') + '</a>' +
      '<div class="body"><h3><a href="listing.html?id=' + l.id + '" data-listing-link>' + esc(title(l)) + '</a></h3>' +
      '<p class="price">' + fmtPrice(l.price) + '</p><p class="loc">' + esc(l.city + ', ' + l.state) + ' · ' + l.condition + '</p>' +
      '<div class="actions"><button type="button" class="ghost save" aria-pressed="' + !!saved[l.id] + '">' + (saved[l.id] ? '♥ Saved' : '♡ Save') + '</button>' +
      '<button type="button" class="ghost reveal-phone" data-placement="' + placement + '">Show phone</button></div></div></article>';
  }

  /* shared delegated handlers for listing cards (search results + similar listings) */
  function wireCards(root) {
    root.addEventListener('click', function (e) {
      var c = e.target.closest('.card'); if (!c) return;
      var l = byId(c.dataset.id), placement = c.dataset.placement, pos = +c.dataset.pos;
      if (e.target.closest('[data-listing-link]')) track('listing_clicked', lp(l, { placement: placement, position: pos }));
      var s = e.target.closest('.save');
      if (s) {
        saved[l.id] = !saved[l.id]; if (!saved[l.id]) delete saved[l.id];
        safeStore.set('pw_saved', JSON.stringify(saved));
        s.textContent = saved[l.id] ? '♥ Saved' : '♡ Save'; s.setAttribute('aria-pressed', !!saved[l.id]);
        track(saved[l.id] ? 'listing_saved' : 'listing_unsaved', lp(l, { placement: placement }));
      }
      var r = e.target.closest('.reveal-phone');
      if (r && !r.disabled) { r.textContent = l.phone; r.disabled = true; track('phone_revealed', { listing_id: l.id, placement: placement }); }
    });
    if ('IntersectionObserver' in window) {
      var seen = {}, io = new IntersectionObserver(function (es) {
        es.forEach(function (en) {
          if (!en.isIntersecting) return;
          var c = en.target, key = c.dataset.placement + c.dataset.id; if (seen[key]) return; seen[key] = 1;
          track('listing_impression', lp(byId(c.dataset.id), { placement: c.dataset.placement, position: +c.dataset.pos }));
        });
      }, { threshold: 0.5 });
      root.querySelectorAll('.card').forEach(function (c) { io.observe(c); });
    }
  }

  /* ---------------- HOME ---------------- */
  function home() {
    document.getElementById('hero-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var q = document.getElementById('q').value.trim();
      track('search_submitted', { search_term: q || undefined, search_location: 'home', result_count: undefined });
      location.href = 'search.html?q=' + encodeURIComponent(q);
    });
    var f = document.getElementById('featured'), items = L.slice(0, 4);
    f.innerHTML = items.map(function (l, i) { return card(l, 'featured', i + 1); }).join('');
    wireCards(f);
  }

  /* ---------------- SEARCH ---------------- */
  var PER = 6;
  function search() {
    var q = (qs('q') || '').toLowerCase(), type = qs('type') || '', make = qs('make') || '', max = +qs('max') || 0, sort = qs('sort') || 'relevance', pg = +qs('page') || 1;
    var makes = Array.from(new Set(L.map(function (l) { return l.make; }))).sort();
    var $ = function (id) { return document.getElementById(id); };
    $('f-q').value = qs('q') || ''; $('f-type').value = type; $('f-max').value = max || '';
    $('f-make').innerHTML = '<option value="">Any make</option>' + makes.map(function (m) { return '<option' + (m === make ? ' selected' : '') + '>' + m + '</option>'; }).join('');
    $('sort').value = sort;
    var res = L.filter(function (l) {
      return (!q || (title(l) + ' ' + l.type).toLowerCase().indexOf(q) > -1) && (!type || l.type === type) && (!make || l.make === make) && (!max || (l.price !== null && l.price <= max));
    });
    if (sort === 'price_asc') res.sort(function (a, b) { return (a.price || 1e9) - (b.price || 1e9); });
    if (sort === 'price_desc') res.sort(function (a, b) { return (b.price || 0) - (a.price || 0); });
    if (sort === 'year_desc') res.sort(function (a, b) { return b.year - a.year; });
    var pages = Math.max(1, Math.ceil(res.length / PER)), slice = res.slice((pg - 1) * PER, pg * PER);
    $('count').textContent = res.length + ' result' + (res.length === 1 ? '' : 's');
    $('results').innerHTML = slice.length ? slice.map(function (l, i) { return card(l, 'search', (pg - 1) * PER + i + 1); }).join('') : '<p>No listings match. Try removing a filter.</p>';
    var pager = $('pager'); pager.innerHTML = '';
    for (var p = 1; p <= pages && pages > 1; p++) { var b = document.createElement('button'); b.type = 'button'; b.textContent = p; b.dataset.p = p; if (p === pg) b.setAttribute('aria-current', 'true'); pager.appendChild(b); }
    pager.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      track('pagination_clicked', { page_number: +b.dataset.p, search_term: q || undefined });
      var u = new URLSearchParams(location.search); u.set('page', b.dataset.p); location.search = u.toString();
    });
    wireCards($('results'));
    // search result events
    track('search_results_viewed', { search_term: q || undefined, result_count: res.length, filter_type: type || undefined, filter_make: make || undefined, filter_max_price: max || undefined, sort: sort, page_number: pg });
    if (!res.length) track('search_no_results', { search_term: q || undefined, filter_type: type || undefined, filter_make: make || undefined });
    $('filters').addEventListener('submit', function (e) {
      e.preventDefault();
      var fq = $('f-q').value.trim(), ft = $('f-type').value, fm = $('f-make').value, fx = $('f-max').value;
      var u = new URLSearchParams(); if (fq) u.set('q', fq); if (ft) u.set('type', ft); if (fm) u.set('make', fm); if (fx) u.set('max', fx); if (sort !== 'relevance') u.set('sort', sort);
      if (fq !== (qs('q') || '')) track('search_submitted', { search_term: fq || undefined, search_location: 'results' });
      if (ft !== type || fm !== make || (+fx || 0) !== max) track('filter_applied', { filter_type: ft || undefined, filter_make: fm || undefined, filter_max_price: +fx || undefined });
      location.search = u.toString();
    });
    $('sort').addEventListener('change', function () {
      track('sort_changed', { sort: this.value, previous_sort: sort });
      var u = new URLSearchParams(location.search); u.set('sort', this.value); u.delete('page'); location.search = u.toString();
    });
  }

  /* ---------------- LISTING (VDP) ---------------- */
  function listing() {
    var l = byId(qs('id') || 'L-1001') || L[0], $ = function (id) { return document.getElementById(id); };
    document.title = title(l) + ' | Pinewake Exchange (fictional test site)';
    $('title').textContent = title(l); $('price').textContent = fmtPrice(l.price);
    $('specs').innerHTML = [['Type', l.type === 'rv' ? 'RV' : 'Boat'], ['Make', l.make], ['Model', l.model], ['Year', l.year], ['Condition', l.condition], ['Location', l.city + ', ' + l.state], ['Listing ID', l.id]].map(function (r) { return '<tr><td>' + r[0] + '</td><td>' + esc(r[1]) + '</td></tr>'; }).join('');
    // gallery
    var imgs = ['Exterior', 'Interior', 'Kitchen / helm', 'Sleeping area', 'Rear'], idx = 0, g = $('gallery'); g.classList.add(l.type);
    function drawG() { $('g-emoji').textContent = l.type === 'rv' ? '🚐' : '🚤'; $('g-cap').textContent = imgs[idx] + ' (' + (idx + 1) + '/' + imgs.length + ')'; }
    drawG();
    g.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      idx = (idx + (b.classList.contains('next') ? 1 : -1) + imgs.length) % imgs.length; drawG();
      track('gallery_interaction', { listing_id: l.id, action: b.classList.contains('next') ? 'next' : 'prev', image_index: idx + 1, image_count: imgs.length });
    });
    // main phone reveal
    var pb = $('main-phone');
    pb.addEventListener('click', function () { pb.textContent = l.phone; pb.disabled = true; track('phone_revealed', { listing_id: l.id, placement: 'main' }); });
    // save / share
    var sv = $('save'); function drawS() { sv.textContent = saved[l.id] ? '♥ Saved' : '♡ Save'; }
    drawS();
    sv.addEventListener('click', function () { saved[l.id] = !saved[l.id]; if (!saved[l.id]) delete saved[l.id]; safeStore.set('pw_saved', JSON.stringify(saved)); drawS(); track(saved[l.id] ? 'listing_saved' : 'listing_unsaved', lp(l, { placement: 'main' })); });
    $('share').addEventListener('click', function () { track('share_clicked', { listing_id: l.id, method: 'copy_link' }); this.textContent = 'Link copied'; });
    // calculator (only meaningful with a price)
    if (l.price) {
      $('calc-price').textContent = fmtPrice(l.price);
      $('calc').addEventListener('submit', function (e) {
        e.preventDefault();
        var down = +$('down').value || 0, term = +$('term').value, apr = +$('apr').value, P0 = Math.max(l.price - down, 0), r = apr / 1200;
        var m = r ? P0 * r / (1 - Math.pow(1 + r, -term)) : P0 / term; m = Math.round(m * 100) / 100;
        $('calc-out').textContent = 'Estimated payment: $' + m.toLocaleString('en-US') + '/mo';
        track('payment_calculated', { listing_id: l.id, price: l.price, down_payment: down, term_months: term, apr: apr, monthly_payment: m });
      });
    } else { $('calc-panel').hidden = true; }
    // lead form
    var started = false, form = $('lead');
    form.addEventListener('focusin', function () { if (!started) { started = true; track('lead_form_started', { listing_id: l.id }); } });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = $('l-name').value.trim(), email = $('l-email').value.trim(), msg = $('l-msg'), out = $('lead-msg');
      track('lead_submit_clicked', { listing_id: l.id });          // click only; NOT a successful lead
      var bad = !name ? 'name' : !/^\S+@\S+\.\S+$/.test(email) ? 'email' : '';
      if (bad) { out.className = 'err'; out.textContent = 'Please enter a valid ' + bad + '.'; track('lead_failed', { listing_id: l.id, error_type: 'validation', error_field: bad }); return; }
      var btn = $('lead-btn'); btn.disabled = true; out.className = 'muted'; out.textContent = 'Sending…';
      setTimeout(function () {
        if (/@fail\.test$/i.test(email)) { // simulated server error
          out.className = 'err'; out.textContent = 'Something went wrong. Please try again.'; btn.disabled = false;
          track('lead_failed', { listing_id: l.id, error_type: 'server' }); return;
        }
        var ref = 'PW-' + Math.random().toString(36).slice(2, 8).toUpperCase();
        form.hidden = true; $('lead-ok').hidden = false; $('lead-ref').textContent = ref;
        track('lead_submitted', { listing_id: l.id, lead_ref: ref, make: l.make, price: l.price === null ? undefined : l.price });
      }, 600);
    });
    // similar listings
    var sim = L.filter(function (x) { return x.type === l.type && x.id !== l.id; }).slice(0, 3);
    $('similar').innerHTML = sim.map(function (x, i) { return card(x, 'similar', i + 1); }).join('');
    wireCards($('similar'));
    track('listing_viewed', lp(l, { condition: l.condition, year: l.year, listing_type: l.type }));
  }

  /* ---------------- SELL ---------------- */
  function sell() {
    var step = 1, started = false, $ = function (id) { return document.getElementById(id); }, names = ['vehicle', 'details', 'contact'], data = {};
    function show() { [1, 2, 3].forEach(function (n) { $('s' + n).hidden = n !== step; $('st' + n).className = n === step ? 'on' : ''; }); }
    $('sell-form').addEventListener('focusin', function () { if (!started) { started = true; track('sell_started', {}); } });
    document.querySelectorAll('[data-next]').forEach(function (b) {
      b.addEventListener('click', function () {
        var sec = $('s' + step), bad = Array.from(sec.querySelectorAll('[required]')).filter(function (i) { return !i.value.trim(); })[0];
        if (bad) { $('sell-err').textContent = 'Please complete: ' + bad.dataset.label; track('sell_step_failed', { step: step, step_name: names[step - 1], error_field: bad.id }); return; }
        $('sell-err').textContent = '';
        Array.from(sec.querySelectorAll('input,select')).forEach(function (i) { data[i.id] = i.value; });
        track('sell_step_completed', { step: step, step_name: names[step - 1], listing_type: data['a-type'] });
        step++; show();
      });
    });
    document.querySelectorAll('[data-back]').forEach(function (b) { b.addEventListener('click', function () { step--; show(); }); });
    $('sell-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var em = $('a-email').value.trim();
      if (!/^\S+@\S+\.\S+$/.test(em)) { $('sell-err').textContent = 'Enter a valid email.'; track('sell_step_failed', { step: 3, step_name: 'contact', error_field: 'a-email' }); return; }
      var ref = 'AD-' + Math.random().toString(36).slice(2, 8).toUpperCase(), price = +data['a-price'] || undefined;
      $('sell-form').hidden = true; $('sell-ok').hidden = false; $('ad-ref').textContent = ref;
      track('ad_submitted', { ad_ref: ref, listing_type: data['a-type'], make: data['a-make'], price: price });
    });
    show();
  }

  /* ---------------- LOGIN ---------------- */
  function login() {
    var mode = 'signin', $ = function (id) { return document.getElementById(id); };
    function draw() { $('mode-title').textContent = mode === 'signin' ? 'Log in' : 'Create account'; $('auth-btn').textContent = mode === 'signin' ? 'Log in' : 'Create account'; $('toggle').textContent = mode === 'signin' ? 'Create an account' : 'I already have an account'; $('auth-msg').textContent = ''; }
    $('toggle').addEventListener('click', function () { mode = mode === 'signin' ? 'signup' : 'signin'; draw(); track('auth_mode_toggled', { mode: mode }); });
    $('auth').addEventListener('submit', function (e) {
      e.preventDefault();
      var em = $('u-email').value.trim(), pw = $('u-pass').value, m = $('auth-msg'); m.className = 'err';
      if (!/^\S+@\S+\.\S+$/.test(em) || pw.length < 8) { m.textContent = 'Enter a valid email and a password of 8+ characters.'; track(mode === 'signin' ? 'login_failed' : 'account_failed', { error_type: 'validation' }); return; }
      if (mode === 'signin' && pw !== 'test1234') { m.textContent = 'Incorrect email or password. (Hint: test1234)'; track('login_failed', { error_type: 'credentials' }); return; }
      var uid = 'u_' + Array.from(em).reduce(function (h, c) { return (h * 31 + c.charCodeAt(0)) >>> 0; }, 7).toString(16);
      m.className = 'ok'; m.textContent = mode === 'signin' ? 'Logged in (simulated).' : 'Account created (simulated).';
      track(mode === 'signin' ? 'login_succeeded' : 'account_created', { user_id: uid, method: 'email' });
    });
    draw();
  }

  /* ---------------- HELP ---------------- */
  function help() {
    document.querySelectorAll('details[data-faq]').forEach(function (d) {
      d.addEventListener('toggle', function () { if (d.open) track('faq_expanded', { faq_id: d.dataset.faq, faq_question: d.querySelector('summary').textContent }); });
    });
  }

  var fn = { home: home, search: search, vdp: listing, sell: sell, login: login, help: help }[page];
  if (fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }
})();
