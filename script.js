
const state = {
  active: "arbeid",
  loggedIn: false,
  calculated: false,
  result: null
};

const contacts = {
  low: [
    {name:"Marieke Sloots", role:"OOV-coördinator", email:"m.sloots@emmen-demo.nl", phone:"06-1843 5521", advice:"Leg de bevindingen intern vast en bespreek of aanvullende duiding nodig is."},
    {name:"Daan Huizing", role:"Aandachtsfunctionaris mensenhandel", email:"d.huizing@emmen-demo.nl", phone:"06-2741 6638", advice:"Laat de casus toetsen op samenhang en monitor of nieuwe signalen ontstaan."}
  ],
  mid: [
    {name:"Marieke Sloots", role:"OOV-coördinator", email:"m.sloots@emmen-demo.nl", phone:"06-1843 5521", advice:"Bespreek de casus in intern overleg en bepaal of partneraanhaak noodzakelijk is."},
    {name:"Laura Meems", role:"Time2Connect / zorgregie", email:"l.meems@time2connect-demo.nl", phone:"06-5564 2097", advice:"Beoordeel de zorgkant, veiligheid en mogelijke bescherming of opvang."},
    {name:"Niek Kamps", role:"TMM-regie / casusdoorzetting", email:"n.kamps@tmm-demo.nl", phone:"06-6038 7715", advice:"Verrijk het beeld en bepaal of opschaling naar regionale partners nodig is."}
  ],
  high: [
    {name:"Iris van Praag", role:"TMM / directe doorzetting", email:"i.vanpraag@tmm-demo.nl", phone:"06-3819 4472", advice:"Zet de casus met voorrang door voor snelle multidisciplinaire beoordeling."},
    {name:"Samir El Azzouzi", role:"Time2Connect / zorg- en veiligheidskant", email:"s.elazzouzi@time2connect-demo.nl", phone:"06-4927 1184", advice:"Beoordeel direct of acute zorg, bescherming of veiligheidsinterventie nodig is."},
    {name:"Daan Huizing", role:"OOV / mensenhandel", email:"d.huizing@emmen-demo.nl", phone:"06-2741 6638", advice:"Leg regie vast en stem af welke ketenpartners direct moeten aanhaken."}
  ]
};

function selectedSignals() {
  return Array.from(document.querySelectorAll('.signal-check:checked')).map(el => ({
    text: el.value,
    bucket: el.dataset.bucket,
    category: el.dataset.category
  }));
}

function renderTabs() {
  const tabs = document.getElementById('tabs');
  tabs.innerHTML = '';
  Object.keys(window.APP_SIGNALS).forEach(key => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tab-btn' + (state.active === key ? ' active' : '');
    btn.textContent = window.APP_SIGNALS[key].title;
    btn.onclick = () => {
      state.active = key;
      highlightTile();
      renderTabs();
      renderSignals();
      syncKpis();
    };
    tabs.appendChild(btn);
  });
}

function renderSignals() {
  const mount = document.getElementById('signalsMount');
  const data = window.APP_SIGNALS[state.active];
  const sections = [
    ["Specifieke signalen", "specific", data.specific],
    ["Algemene signalen", "general", data.general],
    ["Omgevingssignalen / dossier", "environment", data.environment]
  ];

  mount.innerHTML = sections.map(([title, bucket, items]) => `
    <div class="signal-section">
      <div class="signal-title">${title}</div>
      <div class="signal-list">
        ${items.map(item => `
          <label class="signal-item">
            <input class="signal-check" type="checkbox" value="${escapeAttr(item)}" data-bucket="${bucket}" data-category="${data.title}">
            <div>
              <strong>${item}</strong>
              <div style="color:var(--muted)">${data.title} • ${title}</div>
            </div>
          </label>
        `).join('')}
      </div>
    </div>
  `).join('');

  document.querySelectorAll('.signal-check').forEach(cb => cb.addEventListener('change', syncKpis));
}

function escapeAttr(text) {
  return String(text).replace(/"/g, '&quot;');
}


function signalWeight(text, bucket) {
  const t = String(text || '').toLowerCase();
  if (/minderjarig|minderjarigheid/.test(t)) return 4;
  if (/geweld|mishandeling|bedreig|gechanteerd|dwang/.test(t)) return 4;
  if (/geen vrijheid|niet vrij|niet zelf kunnen bepalen|onder controle/.test(t)) return 4;
  if (/paspoort|identiteitsbewijs|documenten/.test(t)) return 3;
  if (/schuld|afdragen|opbrengst.*afgeven|afhankelijk/.test(t)) return 3;
  if (/gedwongen|exploitant|prostitutie|strafbare taken|geldezel/.test(t)) return 3;
  if (/koeriersbewegingen|risicolocaties|aangestuurd/.test(t)) return 3;
  if (bucket === 'specific') return 3;
  if (bucket === 'general') return 2;
  if (bucket === 'environment') return 2;
  return 2;
}

function isCriticalSignal(text) {
  const t = String(text || '').toLowerCase();
  return /minderjarig|minderjarigheid|dwang|geweld|mishandeling|bedreig|gechanteerd|geen vrijheid|niet vrij|onder controle/.test(t);
}

function calcResult() {
  const selected = selectedSignals();
  const all = window.APP_SIGNALS[state.active];
  const allSignals = [
    ...all.specific.map(text => ({ text, bucket: 'specific' })),
    ...all.general.map(text => ({ text, bucket: 'general' })),
    ...all.environment.map(text => ({ text, bucket: 'environment' }))
  ];

  let S = 0;
  let maxPossible = 0;
  let critical = false;

  selected.forEach(item => {
    S += signalWeight(item.text, item.bucket);
    if (isCriticalSignal(item.text)) critical = true;
  });

  allSignals.forEach(() => { maxPossible += 4; });

  const Snorm = maxPossible > 0 ? (S / maxPossible) : 0;
  const K = 0.1 + 9.9 * Math.pow(Snorm, 2);

  let B = 0.5;
  if (selected.length >= 9) B = 10;
  else if (selected.length >= 7) B = 6;
  else if (selected.length >= 5) B = 3;
  else if (selected.length >= 3) B = 2;
  else if (selected.length >= 1) B = 1;

  let G = 1;
  if (critical && selected.length >= 7) G = 40;
  else if (critical) G = 10;
  else if (selected.length >= 6) G = 10;
  else if (selected.length >= 3) G = 3;
  else G = 1;

  const R = K * G * B;

  let level = 'low';
  let badge = 'Laag risico';
  let needle = -70;
  if (R >= 400) { level = 'high'; badge = 'Zeer hoog risico'; needle = 70; }
  else if (R >= 180) { level = 'high'; badge = 'Hoog risico'; needle = 50; }
  else if (R >= 50) { level = 'mid'; badge = 'Middel risico'; needle = 0; }
  else if (R >= 10) { level = 'mid'; badge = 'Verhoogd risico'; needle = -20; }

  state.calculated = true;
  state.result = {R, K, G, B, S, Snorm, level, badge, selected, critical};

  document.getElementById('scoreValue').textContent = R.toFixed(1);
  const badgeEl = document.getElementById('scoreBadge');
  badgeEl.className = 'badge ' + (R >= 180 ? 'badge-high' : R >= 10 ? 'badge-mid' : 'badge-low');
  badgeEl.textContent = badge;
  document.getElementById('gaugeNeedle').style.transform = `translateX(-50%) rotate(${needle}deg)`;
  document.getElementById('scoreList').innerHTML = `
    <li>Hoofdvorm: ${window.APP_SIGNALS[state.active].title}</li>
    <li>Aantal geselecteerde signalen: ${selected.length}</li>
    <li>Gewogen signaalscore: ${S}</li>
    <li>Risiconiveau: ${badge}</li>
    ${critical ? '<li>Kritisch signaal aanwezig: directe alertheid en mogelijke opschaling noodzakelijk.</li>' : ''}
  `;

  renderAdvice();
  buildReport();
  syncKpis();
}

function renderAdvice() {
  const wrap = document.getElementById('adviceWrap');
  if (!state.calculated || !state.result) {
    wrap.innerHTML = '<ul class="list"><li>Na berekening verschijnt hier het vervolgadvies.</li></ul>';
    return;
  }
  const list = contacts[state.result.level];
  const intro = state.result.critical
    ? 'Er is minimaal één kritisch signaal aanwezig. Directe alertheid en afstemming zijn noodzakelijk.'
    : state.result.level === 'high'
    ? 'Opschaling en snelle afstemming liggen voor de hand.'
    : state.result.level === 'mid'
    ? 'Verrijk het beeld en stem af met relevante partners.'
    : 'Intern bespreken, monitoren en zorgvuldig vastleggen.';

  wrap.innerHTML = `
    <div class="contact-card"><strong>Direct handelingsadvies</strong><div style="margin-top:6px;color:var(--muted)">${intro}</div></div>
    ${list.map(c => `
      <div class="contact-card">
        <div><strong>${c.name}</strong></div>
        <div><strong>Rol:</strong> ${c.role}</div>
        <div><strong>E-mail:</strong> ${c.email}</div>
        <div><strong>Telefoon:</strong> ${state.loggedIn ? c.phone : 'Alleen zichtbaar na login'}</div>
        <div style="margin-top:8px"><strong>Advies:</strong> ${c.advice}</div>
      </div>
    `).join('')}
  `;
}

function getField(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.innerText = String(text ?? '');
  return div.innerHTML;
}

function buildReport() {
  const selected = state.result ? state.result.selected : [];
  const preview = document.getElementById('reportPreview');
  const now = new Date();
  const date = now.toLocaleDateString('nl-NL');
  const time = now.toLocaleTimeString('nl-NL', {hour:'2-digit', minute:'2-digit'});
  preview.innerHTML = `
    <div class="report-block">
      <h4>Samenvatting</h4>
      <p>${state.calculated ? `Op ${date} om ${time} is voor ${window.APP_SIGNALS[state.active].title.toLowerCase()} een ${state.result.badge.toLowerCase()} vastgesteld.` : 'Nog niet opgesteld.'}</p>
    </div>
    <div class="report-block">
      <h4>Controlegegevens</h4>
      <p><strong>Locatie:</strong> ${escapeHtml(getField('locatie') || '-')}<br>
      <strong>Type controle:</strong> ${escapeHtml(getField('typeControle') || '-')}<br>
      <strong>Type locatie:</strong> ${escapeHtml(getField('typeLocatie') || '-')}</p>
    </div>
    <div class="report-block">
      <h4>Bevindingen</h4>
      <p>${escapeHtml(getField('bevindingen') || '-').replace(/\n/g,'<br>')}</p>
    </div>
    <div class="report-block">
      <h4>Observaties</h4>
      <p>${escapeHtml(getField('observaties') || '-').replace(/\n/g,'<br>')}</p>
    </div>
    <div class="report-block">
      <h4>Geselecteerde signalen</h4>
      ${selected.length ? `<ul class="list">${selected.map(s => `<li><strong>${escapeHtml(s.category)}:</strong> ${escapeHtml(s.text)}</li>`).join('')}</ul>` : '<p>Nog geen signalen geselecteerd.</p>'}
    </div>
    <div class="report-block">
      <h4>Risicoscore</h4>
      <p>${state.calculated ? `${state.result.R.toFixed(1)} • ${state.result.badge}` : 'Nog niet berekend'}</p>
    </div>
    <div class="report-block">
      <h4>Doorzetadvies</h4>
      ${document.getElementById('adviceWrap').innerHTML}
    </div>
  `;
}

function downloadPdf() {
  buildReport();
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert('PDF-bibliotheek kon niet worden geladen.');
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = 15;

  if (window.LOGO_URI) {
    try {
      doc.addImage(window.LOGO_URI, 'PNG', 10, 8, 45, 14);
      y = 28;
    } catch(e) {}
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('Rapportage Signalencheck Mensenhandel', 10, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const lines = [
    `Datum: ${new Date().toLocaleString('nl-NL')}`,
    `Hoofdvorm: ${window.APP_SIGNALS[state.active].title}`,
    `Locatie: ${getField('locatie') || '-'}`,
    `Type controle: ${getField('typeControle') || '-'}`,
    `Type locatie: ${getField('typeLocatie') || '-'}`,
    `Risicoscore: ${state.calculated ? state.result.R.toFixed(1) + ' (' + state.result.badge + ')' : 'Nog niet berekend'}`
  ];
  lines.forEach(line => { doc.text(line, 10, y); y += 6; });

  y += 2;
  doc.setFont('helvetica', 'bold');
  doc.text('Bevindingen', 10, y); y += 6;
  doc.setFont('helvetica', 'normal');
  let split = doc.splitTextToSize(getField('bevindingen') || '-', 180);
  doc.text(split, 10, y); y += split.length * 5 + 4;

  doc.setFont('helvetica', 'bold');
  doc.text('Observaties', 10, y); y += 6;
  doc.setFont('helvetica', 'normal');
  split = doc.splitTextToSize(getField('observaties') || '-', 180);
  doc.text(split, 10, y); y += split.length * 5 + 4;

  doc.setFont('helvetica', 'bold');
  doc.text('Geselecteerde signalen', 10, y); y += 6;
  doc.setFont('helvetica', 'normal');
  const selected = state.result ? state.result.selected : [];
  if (selected.length) {
    selected.forEach(s => {
      const t = `- ${s.category}: ${s.text}`;
      const lines2 = doc.splitTextToSize(t, 180);
      doc.text(lines2, 10, y);
      y += lines2.length * 5;
      if (y > 270) { doc.addPage(); y = 15; }
    });
  } else {
    doc.text('-', 10, y); y += 6;
  }

  y += 4;
  if (y > 260) { doc.addPage(); y = 15; }
  doc.setFont('helvetica', 'bold');
  doc.text('Advies en fictieve contactpersonen', 10, y); y += 6;
  doc.setFont('helvetica', 'normal');

  const advice = state.calculated ? contacts[state.result.level] : [];
  advice.forEach(c => {
    const block = [
      `${c.name} – ${c.role}`,
      `E-mail: ${c.email}`,
      `Telefoon: ${state.loggedIn ? c.phone : 'Alleen zichtbaar na login'}`,
      `Advies: ${c.advice}`
    ];
    block.forEach(line => {
      const l = doc.splitTextToSize(line, 180);
      doc.text(l, 10, y);
      y += l.length * 5;
      if (y > 270) { doc.addPage(); y = 15; }
    });
    y += 3;
  });

  const stamp = new Date().toISOString().slice(0,16).replace(/[:T]/g,'-');
  doc.save(`rapportage_signalencheck_${stamp}.pdf`);
}

function syncKpis() {
  document.getElementById('kpiStatus').textContent = state.calculated ? 'Berekenend' : 'Nieuw';
  document.getElementById('kpiFocus').textContent = window.APP_SIGNALS[state.active].title;
  document.getElementById('kpiScore').textContent = state.calculated ? state.result.R.toFixed(1) : '-';
  document.getElementById('kpiLogin').textContent = state.loggedIn ? 'Ja' : 'Nee';
}

function highlightTile() {
  document.querySelectorAll('.tile').forEach(tile => {
    tile.classList.toggle('active', tile.dataset.tile === state.active);
  });
}

function resetCheck() {
  document.querySelectorAll('.signal-check').forEach(cb => cb.checked = false);
  ['locatie','bevindingen','observaties'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  state.calculated = false;
  state.result = null;
  document.getElementById('scoreValue').textContent = 'Nog niet berekend';
  document.getElementById('scoreBadge').className = 'badge badge-low';
  document.getElementById('scoreBadge').textContent = 'Nog niet berekend';
  document.getElementById('scoreList').innerHTML = '<li>Klik op “Bereken uitkomst” om de risico-inschatting te tonen.</li>';
  document.getElementById('adviceWrap').innerHTML = '<ul class="list"><li>Na berekening verschijnt hier het vervolgadvies.</li></ul>';
  document.getElementById('reportPreview').innerHTML = '<div class="report-block"><h4>Samenvatting</h4><p>Nog niet opgesteld.</p></div>';
  document.getElementById('gaugeNeedle').style.transform = 'translateX(-50%) rotate(-90deg)';
  syncKpis();
}

function setupMenu() {
  const btn = document.getElementById('menuBtn');
  const panel = document.getElementById('menuPanel');
  if (!btn || !panel) return;
  document.addEventListener('click', e => {
    if (!panel.contains(e.target) && e.target !== btn) panel.classList.remove('open');
  });
}

function setupLogin() {
  const overlay = document.getElementById('loginOverlay');
  document.getElementById('closeLoginBtn').onclick = () => overlay.classList.remove('show');
  overlay.classList.add('show');
  document.getElementById('submitLoginBtn').onclick = () => {
    const u = document.getElementById('loginUser').value.trim();
    const p = document.getElementById('loginPass').value.trim();
    const msg = document.getElementById('loginMsg');
    if (u === 'SDEV1' && p === '12345') {
      state.loggedIn = true;
      msg.textContent = 'Inloggen gelukt. Aanvullende contactgegevens zijn actief.';
      overlay.classList.remove('show');
      renderAdvice();
      buildReport();
      syncKpis();
    } else {
      msg.textContent = 'Onjuiste inloggegevens. Gebruik voor deze demo: SDEV1 / 12345.';
    }
  };
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-tile]').forEach(tile => {
    tile.addEventListener('click', () => {
      state.active = tile.dataset.tile;
      highlightTile();
      renderTabs();
      renderSignals();
      syncKpis();
      document.getElementById('check').scrollIntoView({behavior:'smooth'});
    });
  });

  renderTabs();
  renderSignals();
  highlightTile();
  syncKpis();
  setupMenu();
  setupLogin();

  document.getElementById('calcBtn').onclick = calcResult;
});


function toggleMainMenu(e){
  if (e) { e.preventDefault(); e.stopPropagation(); }
  const panel = document.getElementById('menuPanel');
  if (panel) panel.classList.toggle('open');
}
function handleResetAndCloseMenu(e){
  if (e) { e.preventDefault(); e.stopPropagation(); }
  resetCheck();
  const panel = document.getElementById('menuPanel');
  if (panel) panel.classList.remove('open');
}
function openLoginOverlay(e){
  if (e) { e.preventDefault(); e.stopPropagation(); }
  const overlay = document.getElementById('loginOverlay');
  if (overlay) overlay.classList.add('show');
}
function handleBuildReport(e){
  if (e) { e.preventDefault(); e.stopPropagation(); }
  buildReport();
  const report = document.getElementById('rapportage');
  if (report) report.scrollIntoView({behavior:'smooth'});
}
function handleDownloadPdf(e){
  if (e) { e.preventDefault(); e.stopPropagation(); }
  if (!state.calculated) calcResult();
  buildReport();
  downloadPdf();
}
function handlePrint(e){
  if (e) { e.preventDefault(); e.stopPropagation(); }
  window.print();
}
function openSourcesOverlay(e){
  if (e) { e.preventDefault(); e.stopPropagation(); }
  const ov = document.getElementById('sourcesOverlay');
  if (ov) ov.classList.add('show');
  const panel = document.getElementById('menuPanel');
  if (panel) panel.classList.remove('open');
}
function closeSourcesOverlay(e){
  if (e) { e.preventDefault(); e.stopPropagation(); }
  const ov = document.getElementById('sourcesOverlay');
  if (ov) ov.classList.remove('show');
}
