import { backendConfigured, liveBackend, demoBackend } from './data.js';
import { CATEGORIES, escapeHTML as esc, filterEvents, formatDate, formatPrice } from './domain.js';
import { setupWebApp } from './web-app.js';

const icons = {
  bolt: '<path d="m13 2-9 12h7l-1 8 10-13h-7l1-7Z"/>',
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  save: '<path d="M6 3h12v18l-6-4-6 4Z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  music: '<path d="M9 18V5l12-2v13M9 9l12-2"/><ellipse cx="6" cy="18" rx="3" ry="3"/><ellipse cx="18" cy="16" rx="3" ry="3"/>',
  culture: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z"/>',
  food: '<path d="M4 3v6a3 3 0 0 0 6 0V3M7 3v18M20 21V3c-5 2-6 10 0 10"/>',
  sport: '<circle cx="12" cy="12" r="9"/><path d="m9 9 6 1 1 5-5 2-4-4Zm0 0L7 4m8 6 5-3m-4 8 3 4m-8-2-1 4m-3-8H3"/>',
  eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  logout: '<path d="M9 4H4v16h5m5-12 4 4-4 4m-6-4h13"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
};
const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.bolt}</svg>`;
const brand = () => `<a class="brand" href="#feed" aria-label="Agitta, início"><span class="brand-mark">${icon('bolt')}</span><span class="brand-word">agitta<span>®</span></span></a>`;
const root = document.querySelector('#app');
const state = { backend: null, demo: false, user: null, events: [], saved: [], category: 'all', query: '', loading: false, error: '', unsubscribe: null };
let toastTimer;
let loadGeneration = 0;
let authGeneration = 0;
let sessionGeneration = 0;
const route = () => location.hash.slice(1) || 'feed';
const initials = (name) => esc(name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase());
const avatar = (name, cls = '') => `<span class="avatar ${cls}" aria-hidden="true">${initials(name)}</span>`;
function storeMode(mode) {
  try {
    if (mode) localStorage.setItem('agitta-mode', mode);
    else localStorage.removeItem('agitta-mode');
  } catch { /* A storage restriction must never prevent logout or switching mode. */ }
}

function toast(message) {
  const element = document.querySelector('#toast');
  element.textContent = message;
  element.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove('show'), 4500);
}

function authPage(signup = false) {
  root.innerHTML = `<div class="auth-layout">
    <section class="auth-story">${brand()}<div class="auth-story-content"><span class="eyebrow">FEITO NO QUADRADINHO. PRA TODO MUNDO.</span><h1>Menos “não<br>fiquei sabendo”.<br><span class="accent">Mais “bora?”</span></h1><p>O próximo rolê de Brasília pode estar<br>bem mais perto do que você imagina.</p></div>
    <div class="auth-art" aria-hidden="true"><svg viewBox="0 0 600 280" fill="none"><circle cx="440" cy="100" r="64" fill="#d6f55c"/><path d="M0 250h600M30 230c60-5 90-80 120-170 20 75 60 165 115 170M340 230V110m42 120V110m-70 18h100M300 230h150" stroke="currentColor" stroke-width="5"/><path d="M130 230c50-100 150-100 200 0" stroke="currentColor" stroke-width="4"/><path d="m497 190 10-25 10 25 25 10-25 10-10 25-10-25-25-10Z" fill="#c5b3f8"/></svg></div><div class="auth-stat"><span>15°47′ S · 47°52′ W</span><span>BRASÍLIA, DF ${icon('pin')}</span></div></section>
    <main class="auth-panel"><div class="auth-panel-inner"><div class="auth-mobile-brand">${brand()}</div><span class="eyebrow">SEU ROLÊ COMEÇA AQUI</span><h2>${signup ? 'Chega mais. ✳' : 'Bom te ver por aqui. ✳'}</h2><p class="auth-subtitle">${signup ? 'Crie sua conta e faça parte do movimento.' : 'Entre na sua conta e descubra o que agitta a cidade.'}</p>
    <div class="auth-tabs"><a class="auth-tab ${!signup ? 'active' : ''}" href="#login">Entrar</a><a class="auth-tab ${signup ? 'active' : ''}" href="#signup">Criar conta</a></div>
    <form id="auth-form" class="auth-form" data-mode="${signup ? 'signup' : 'login'}">
    ${signup ? '<div class="form-field"><label for="name">Como podemos te chamar?</label><input id="name" name="name" autocomplete="nickname" placeholder="Seu nome" minlength="2" maxlength="60" required></div>' : ''}
    <div class="form-field"><label for="email">Seu e-mail</label><input id="email" name="email" type="email" autocomplete="email" placeholder="voce@exemplo.com" maxlength="254" required></div>
    <div class="form-field"><label for="password">Sua senha</label><div class="password-wrap"><input id="password" name="password" type="password" autocomplete="${signup ? 'new-password' : 'current-password'}" placeholder="${signup ? 'Pelo menos 8 caracteres' : 'Digite sua senha'}" ${signup ? 'minlength="8"' : ''} maxlength="128" required><button type="button" class="password-toggle icon-button" data-action="password" aria-label="Mostrar senha" aria-pressed="false">${icon('eye')}</button></div></div>
    <p class="form-error" id="auth-error" role="alert" hidden></p><p class="form-success" id="auth-success" role="status" hidden></p>
    <button class="button button-primary" type="submit">${signup ? 'Criar minha conta' : 'Entrar no Agitta'} ${icon('arrow')}</button></form>
    ${!backendConfigured ? '<p class="connection-note">As contas ainda não estão conectadas neste ambiente. Explore a demonstração abaixo.</p>' : ''}
    <div class="divider"><span>ou sinta o clima primeiro</span></div><button class="button button-secondary demo-link" data-action="demo">Explorar demonstração ${icon('arrow')}</button><p class="auth-footnote">Eventos fictícios, sem cadastro. Só pra conhecer o app.</p><div class="auth-footer">Da cidade. Pra cidade. <span>✳</span></div></div></main></div>`;
}

function navItem(path, label, name, current, extra = '') {
  return `<a class="nav-item ${current === path ? 'active' : ''} ${extra}" href="#${path}" ${current === path ? 'aria-current="page"' : ''}>${icon(name)}<span class="nav-label">${label}</span>${path === 'saved' && state.saved.length ? `<span class="nav-badge">${state.saved.length}</span>` : ''}</a>`;
}

function eventArt(event, detail = false) {
  const subtitles = { music: 'A CIDADE TEM SEU PRÓPRIO SOM.', culture: 'ARTE QUE ENCONTRA A RUA.', food: 'O SABOR DO NOSSO QUADRADINHO.', sport: 'A CIDADE É NOSSA PISTA.' };
  return `<div class="event-art art-${esc(event.category)} ${detail ? 'detail-art' : ''}" aria-hidden="true"><span class="art-label">AGITTA APRESENTA / ${esc(CATEGORIES[event.category]).toUpperCase()}</span><span class="art-title">${esc(subtitles[event.category])}</span><span class="art-orbit"></span>${icon(event.category)}<span class="art-caption">BSB ↗ ${state.demo ? 'CONCEITO VISUAL' : 'VEM COM A GENTE'}</span></div>`;
}

function eventCard(event) {
  const date = formatDate(event.starts_at);
  const saved = state.saved.includes(event.id);
  return `<article class="event-card" data-category="${esc(event.category)}"><div class="card-top"><div class="author">${avatar(event.author_name)}<div class="author-info"><strong>${esc(event.author_name)}</strong><small>${esc(event.region)} · ${state.demo ? 'Demonstração' : 'Comunidade'}</small></div></div><span class="event-category">${icon(event.category)} ${esc(CATEGORIES[event.category])}</span></div>
  <div class="event-copy"><h3><a href="#event/${encodeURIComponent(event.id)}">${esc(event.title)}</a></h3><p class="event-description">${esc(event.description)}</p></div>
  <a href="#event/${encodeURIComponent(event.id)}" class="art-link" aria-label="Ver detalhes: ${esc(event.title)}">${eventArt(event)}</a>
  <div class="event-meta"><span class="meta-item">${icon('clock')} ${date.day} ${date.month.toLowerCase()} · ${date.time}</span><span class="meta-item">${icon('pin')} ${esc(event.venue)}</span></div>
  <div class="card-footer"><div class="event-actions"><span class="price-tag ${Number(event.price) === 0 ? 'free' : ''}">${formatPrice(event.price)}</span><span class="age-tag">${event.age_rating === 'Livre' ? 'Livre' : `${esc(event.age_rating)}+`}</span></div><button class="save-button ${saved ? 'active' : ''}" data-save="${esc(event.id)}" aria-pressed="${saved}" aria-label="${saved ? 'Remover dos salvos' : 'Salvar evento'}: ${esc(event.title)}">${icon('save')} <span>${saved ? 'Salvo' : 'Salvar rolê'}</span></button></div></article>`;
}

function visibleEvents() {
  const events = route() === 'saved' ? state.events.filter((event) => state.saved.includes(event.id)) : state.events;
  return filterEvents(events, { query: state.query, category: state.category });
}

function renderEventList() {
  const list = document.querySelector('#event-list');
  if (!list) return;
  if (state.loading) { list.innerHTML = '<div class="empty-state" role="status">Buscando os próximos rolês…</div>'; return; }
  if (state.error) { list.innerHTML = `<div class="empty-state" role="alert"><h3>O feed deu uma pausa.</h3><p>${esc(state.error)}</p><button class="button button-secondary" data-action="retry">Tentar novamente</button></div>`; return; }
  const events = visibleEvents();
  list.innerHTML = events.map(eventCard).join('') || `<div class="empty-state">${icon('search')}<h3>${route() === 'saved' ? 'Seu próximo rolê merece um lugar aqui.' : 'Nenhum rolê por aqui. Ainda.'}</h3><p>${route() === 'saved' ? 'Toque em “Salvar rolê” no feed para guardar seus favoritos.' : 'Tente outra busca ou seja a primeira pessoa a publicar.'}</p><a class="button button-secondary" href="#${route() === 'saved' ? 'feed' : 'create'}">${route() === 'saved' ? 'Explorar eventos' : 'Publicar um evento'} ${icon('arrow')}</a></div>`;
  const count = document.querySelector('#results-count');
  if (count) count.textContent = `${events.length} ${events.length === 1 ? 'evento pra descobrir' : 'eventos pra descobrir'}`;
}

function sidePanel() {
  const regions = [...new Set(state.events.map((event) => event.region))].slice(0, 4);
  return `<aside class="discover-panel"><div class="panel-card"><div class="panel-title"><span class="eyebrow">PERTINHO DE VOCÊ</span>${icon('pin')}</div><h3>Cada canto, um rolê.</h3><div class="area-list">${regions.map((region, i) => `<button class="area-row" data-region="${esc(region)}"><span class="area-dot dot-${i}"></span><span>${esc(region)}</span><span class="area-count">${state.events.filter((event) => event.region === region).length} ↗</span></button>`).join('') || '<p class="muted">As regiões aparecem quando a comunidade publica.</p>'}</div></div>
    <div class="weekend-note"><span class="mini-label">UMA CIDADE, MIL POSSIBILIDADES</span><h3>Brasília vai<br>além do óbvio<span>✳</span></h3><p>Tem arte na rua, música na praça e gente fazendo acontecer.</p><div class="mini-art" aria-hidden="true"><span></span><span></span><span></span></div><span class="mini-label">SAIA DO FEED. VÁ VIVER.</span></div>
    <div class="tip-card">${icon('bolt')}<div><strong>Sabe de um rolê?</strong><p>Avisa a galera. O Agitta é feito por quem vive a cidade.</p><a href="#create" class="text-link">Publicar evento ↗</a></div></div><p class="rail-footer">Feito com energia de Brasília.<br>Agitta © ${new Date().getFullYear()}</p></aside>`;
}

function feedContent(saved) {
  return `<div class="page-heading"><div><span class="eyebrow">${saved ? 'SUA AGENDA, DO SEU JEITO' : 'O QUADRADINHO TÁ ON'}</span><h1>${saved ? 'Seus próximos rolês<span>.</span>' : 'O que agitta Brasília<span>?</span>'}</h1><p>${saved ? 'Aqueles que você não quer deixar passar.' : 'Descubra o que tá rolando. Compartilhe o que vale a pena.'}</p></div><span class="heading-stamp" aria-hidden="true">✳</span></div>
    ${!saved ? `<section class="hero"><div class="hero-content"><span class="hero-kicker"><span></span> A CIDADE É O NOSSO PONTO DE ENCONTRO</span><h2>Seu próximo<br>“bora?” tá aqui.</h2><p>Do rolê de graça ao show que você esperava.<br>Tem uma Brasília inteira pra descobrir.</p><a class="button button-dark" href="#create">Espalhar um rolê ${icon('arrow')}</a></div><div class="hero-art" aria-hidden="true"><span class="hero-sun"></span><svg viewBox="0 0 280 250" fill="none"><path d="M20 225c45-5 75-90 100-200 25 110 55 195 105 200M5 225h260" stroke="currentColor" stroke-width="5"/><path d="M90 225c35-65 90-65 125 0" stroke="currentColor" stroke-width="4"/><path d="m220 45 8 22 22 8-22 8-8 22-8-22-22-8 22-8Z" fill="currentColor"/></svg><span class="hero-coordinate">15°47′ S / 47°52′ W</span></div></section>` : ''}
    <div class="feed-toolbar"><div class="section-heading"><h2>${saved ? 'Na sua lista' : 'Pelo seu radar'}</h2><span class="muted" id="results-count"></span></div><label class="search-field">${icon('search')}<input id="search" type="search" placeholder="Buscar um rolê…" aria-label="Buscar eventos" value="${esc(state.query)}" maxlength="100"></label></div>
    <div class="categories" aria-label="Categorias de eventos">${[['all', 'Tudo junto', 'bolt'], ...Object.entries(CATEGORIES).map(([key, label]) => [key, label, key])].map(([key, label, name]) => `<button class="category ${state.category === key ? 'active' : ''}" data-category-filter="${key}" aria-pressed="${state.category === key}">${icon(name)} ${label}</button>`).join('')}</div><div id="event-list" class="event-list" aria-live="polite"></div>`;
}

function profileContent() {
  return `<div class="page-heading"><div><span class="eyebrow">QUEM FAZ A CIDADE ACONTECER</span><h1>Seu cantinho<span>.</span></h1><p>Uma cidade viva começa com gente como você.</p></div></div><section class="profile-card"><div class="profile-hero">${avatar(state.user.name)}<h2>${esc(state.user.name)}</h2><p>${state.demo ? 'Visitando o protótipo · sem conta real' : esc(state.user.email)}</p><span class="location-pill">${icon('pin')} Brasília, DF</span></div><div class="profile-stats"><div><strong>${state.events.filter((event) => event.author_id === state.user.id).length}</strong><span>Publicações no feed</span></div><div><strong>${state.saved.length}</strong><span>Rolês salvos</span></div></div><div class="profile-actions"><a class="button button-primary" href="#create">Publicar um rolê ${icon('plus')}</a><button class="button button-secondary" data-action="logout">${icon('logout')} ${state.demo ? 'Sair da demonstração' : 'Sair da conta'}</button></div></section>`;
}

function appPage() {
  const current = route();
  const page = current === 'saved' || current === 'profile' ? current : 'feed';
  root.innerHTML = `<div class="app-shell"><aside class="sidebar">${brand()}<span class="city-tag">BRASÍLIA É O NOSSO LUGAR ↗</span><nav aria-label="Navegação principal">${navItem('feed', 'Explorar', 'home', page)}${navItem('saved', 'Rolês salvos', 'save', page)}${navItem('profile', 'Meu perfil', 'user', page)}</nav><a class="button button-primary sidebar-publish" href="#create">${icon('plus')} Publicar rolê</a><div class="sidebar-bottom"><div class="sidebar-note">A cidade acontece.<br><strong>Você fica sabendo.</strong><span>✳</span></div><a href="#profile" class="profile-mini">${avatar(state.user.name)}<span><strong>${esc(state.user.name)}</strong><small>${state.demo ? 'Explorando a demo' : 'Meu perfil'}</small></span>${icon('arrow')}</a></div></aside>
    <main class="workspace"><header class="topbar"><span class="breadcrumb">${page === 'saved' ? 'Rolês salvos' : page === 'profile' ? 'Meu perfil' : 'Explorar'} <span>/</span> <strong>Brasília</strong></span><div class="topbar-actions"><span class="location-pill">${icon('pin')} Brasília, DF</span><a href="#profile" aria-label="Abrir meu perfil">${avatar(state.user.name)}</a></div></header>
    ${state.demo ? '<div class="demo-banner"><span>✳ <strong>Modo demonstração</strong> · Eventos fictícios, salvos só neste aparelho.</span><button data-action="logout">Sair da demo ↗</button></div>' : ''}
    <div class="main-grid"><section class="feed-column">${page === 'profile' ? profileContent() : feedContent(page === 'saved')}</section>${sidePanel()}</div></main>
    <nav class="mobile-nav" aria-label="Navegação mobile">${navItem('feed', 'Explorar', 'home', page)}${navItem('saved', 'Salvos', 'save', page)}${navItem('create', 'Publicar', 'plus', current, 'publish-nav')}${navItem('profile', 'Perfil', 'user', page)}</nav></div>`;
  renderEventList();
  if (current === 'create') showCreateDialog();
  if (current.startsWith('event/')) {
    try { showEventDialog(decodeURIComponent(current.slice(6))); }
    catch { location.hash = 'feed'; }
  }
}

function showDialog(title, contents, footer = '') {
  const dialog = document.createElement('dialog');
  dialog.className = 'modal';
  dialog.setAttribute('aria-labelledby', 'modal-title');
  dialog.innerHTML = `<div class="modal-header"><h2 id="modal-title">${title}</h2><button class="icon-button" data-action="close" aria-label="Fechar">${icon('close')}</button></div><div class="modal-body">${contents}</div>${footer}`;
  root.append(dialog);
  dialog.addEventListener('cancel', (event) => { event.preventDefault(); location.hash = 'feed'; });
  dialog.addEventListener('click', (event) => { if (event.target === dialog) location.hash = 'feed'; });
  dialog.showModal();
}

function showCreateDialog() {
  const minimum = new Date(Date.now() - 3 * 3600000).toISOString().slice(0, 16);
  showDialog('Bora espalhar esse rolê?', `<p class="muted">${state.demo ? 'Esta publicação ficará apenas na demonstração deste aparelho.' : 'Conte pra cidade. Informações claras fazem a diferença.'}</p><form id="event-form"><div class="form-grid">
    <div class="form-field wide"><label for="title">Qual é o rolê?</label><input id="title" name="title" placeholder="Um nome que dê vontade de ir" minlength="3" maxlength="100" required></div>
    <div class="form-field wide"><label for="description">Conta mais</label><textarea id="description" name="description" rows="3" placeholder="O que vai acontecer? O que a galera precisa saber?" minlength="10" maxlength="2000" required></textarea></div>
    <div class="form-field"><label for="category">Categoria</label><select id="category" name="category">${Object.entries(CATEGORIES).map(([key, label]) => `<option value="${key}">${label}</option>`).join('')}</select></div>
    <div class="form-field"><label for="starts_at">Data e hora · Brasília</label><input id="starts_at" name="starts_at" type="datetime-local" min="${minimum}" required></div>
    <div class="form-field"><label for="venue">Nome do local</label><input id="venue" name="venue" placeholder="Ex.: Parque da Cidade" minlength="2" maxlength="100" required></div>
    <div class="form-field"><label for="region">Região do DF</label><input id="region" name="region" list="regions" placeholder="Ex.: Asa Sul" minlength="2" maxlength="60" required><datalist id="regions">${['Asa Norte', 'Asa Sul', 'Águas Claras', 'Ceilândia', 'Taguatinga', 'Guará', 'Gama', 'Plano Piloto', 'Sobradinho', 'Planaltina', 'Cruzeiro'].map((region) => `<option value="${region}">`).join('')}</datalist></div>
    <div class="form-field wide"><label for="address">Endereço ou ponto de encontro</label><input id="address" name="address" placeholder="Quadra, rua, número ou referência" minlength="5" maxlength="240" required></div>
    <div class="form-field"><label for="price">Entrada · R$</label><input id="price" name="price" type="number" min="0" max="100000" step="0.01" value="0" required><small>Deixe 0 se a entrada for gratuita.</small></div>
    <div class="form-field"><label for="age_rating">Classificação indicativa</label><select id="age_rating" name="age_rating"><option value="Livre">Livre</option><option value="16">16 anos</option><option value="18">18 anos</option></select></div></div><p class="form-error" id="event-error" role="alert" hidden></p><div class="modal-footer"><button type="button" class="button button-secondary" data-action="close">Agora não</button><button class="button button-primary" type="submit">Publicar rolê ${icon('arrow')}</button></div></form>`);
}

function showEventDialog(id) {
  if (/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(id)) id = id.toLowerCase();
  const requestedRoute = route();
  const event = state.events.find((item) => item.id === id);
  if (!event) {
    if (state.loading) return;
    if (state.error) { showDialog('Não foi possível abrir esse rolê.', `<p>${esc(state.error)}</p><a class="button button-secondary" href="#feed">Voltar para o feed</a>`); return; }
    showDialog('Buscando esse rolê…', '<p role="status">Buscando as informações do evento.</p>');
    const backend = state.backend;
    const generation = sessionGeneration;
    backend.getEventsByIds([id]).then((events) => {
      if (generation !== sessionGeneration || backend !== state.backend || route() !== requestedRoute) return;
      root.querySelector('dialog')?.remove();
      if (events.length) { state.events.push(...events); showEventDialog(id); }
      else showDialog('Esse rolê não está no radar.', '<p>O evento pode ter passado ou não estar mais disponível.</p><a class="button button-secondary" href="#feed">Voltar para o feed</a>');
    }).catch((error) => {
      if (generation !== sessionGeneration || backend !== state.backend || route() !== requestedRoute) return;
      root.querySelector('dialog')?.remove();
      showDialog('Não foi possível abrir esse rolê.', `<p>${esc(error.message)}</p><a class="button button-secondary" href="#feed">Voltar para o feed</a>`);
    });
    return;
  }
  const saved = state.saved.includes(id);
  const date = formatDate(event.starts_at);
  showDialog('Tá no radar ↗', `${eventArt(event, true)}<span class="eyebrow">${esc(CATEGORIES[event.category])} · ${esc(event.region)}</span><h2 class="detail-title">${esc(event.title)}</h2><p class="detail-description">${esc(event.description)}</p><div class="detail-facts"><div class="fact">${icon('clock')}<div><strong>Quando?</strong><span>${date.full} · Brasília</span></div></div><div class="fact">${icon('pin')}<div><strong>${esc(event.venue)}</strong><span>${esc(event.address)}</span><a class="text-link" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address)}" target="_blank" rel="noopener noreferrer">Abrir no mapa ↗</a></div></div><div class="fact">${icon('bolt')}<div><strong>${formatPrice(event.price)}</strong><span>Classificação: ${event.age_rating === 'Livre' ? 'Livre' : `${esc(event.age_rating)} anos`}</span></div></div></div><div class="detail-author">${avatar(event.author_name)}<span>Publicado por <strong>${esc(event.author_name)}</strong></span></div><div class="modal-footer"><button class="button ${saved ? 'button-secondary' : 'button-primary'}" data-save="${esc(event.id)}" aria-pressed="${saved}">${icon('save')} ${saved ? 'Remover dos salvos' : 'Salvar esse rolê'}</button></div>`);
}

function render() {
  if (!state.user) return authPage(route() === 'signup');
  if (['login', 'signup'].includes(route())) { location.hash = 'feed'; return; }
  appPage();
}

async function loadEvents() {
  const backend = state.backend;
  const userId = state.user?.id;
  const generation = ++loadGeneration;
  const isCurrent = () => backend === state.backend && userId === state.user?.id && generation === loadGeneration;
  state.loading = true;
  state.error = '';
  render();
  try {
    const [events, saved] = await Promise.all([backend.listEvents(), backend.getSavedIds()]);
    if (!isCurrent()) return;
    const missing = saved.filter((id) => !events.some((event) => event.id === id));
    if (missing.length) events.push(...await backend.getEventsByIds(missing));
    if (!isCurrent()) return;
    events.sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
    state.events = events;
    state.saved = saved;
  } catch (error) { if (isCurrent()) state.error = error.message; }
  finally {
    if (isCurrent()) {
      state.loading = false;
      // A background feed response must not replace a form the user is editing.
      if (route() !== 'create' || !root.querySelector('#event-form')) render();
    }
  }
}

async function enterDemo(preserveRoute = false) {
  ++sessionGeneration;
  ++authGeneration;
  state.unsubscribe?.();
  state.demo = true;
  state.backend = demoBackend();
  state.user = (await state.backend.getSession()).user;
  storeMode('demo');
  if (!preserveRoute) location.hash = 'feed';
  await loadEvents();
  if (!preserveRoute) window.scrollTo(0, 0);
}

function watchAuth() {
  const generation = ++authGeneration;
  const backend = state.backend;
  state.unsubscribe?.();
  state.unsubscribe = state.backend.onAuthChange((session) => {
    // Supabase auth callbacks must return before another auth API is called.
    setTimeout(() => {
      if (state.demo || generation !== authGeneration || backend !== state.backend) return;
      const changed = state.user?.id !== session?.user?.id;
      state.user = session?.user || null;
      if (changed) {
        state.events = []; state.saved = [];
        if (state.user) loadEvents();
        else render();
      }
    }, 0);
  });
}

root.addEventListener('click', async (event) => {
  const button = event.target.closest('button');
  if (!button || button.disabled) return;
  if (button.dataset.action === 'password') {
    const input = document.querySelector('#password');
    input.type = input.type === 'password' ? 'text' : 'password';
    button.setAttribute('aria-pressed', String(input.type === 'text'));
    button.setAttribute('aria-label', input.type === 'text' ? 'Ocultar senha' : 'Mostrar senha');
    return;
  }
  if (button.dataset.action === 'close') { location.hash = 'feed'; return; }
  if (button.dataset.categoryFilter) {
    state.category = button.dataset.categoryFilter;
    document.querySelectorAll('[data-category-filter]').forEach((item) => { const active = item === button; item.classList.toggle('active', active); item.setAttribute('aria-pressed', active); });
    renderEventList(); return;
  }
  if (button.dataset.region) {
    state.query = button.dataset.region;
    state.category = 'all';
    location.hash = 'feed';
    render(); return;
  }
  try {
    if (button.dataset.action === 'demo') { button.disabled = true; await enterDemo(); }
    if (button.dataset.action === 'retry') await loadEvents();
    if (button.dataset.action === 'logout') {
      button.disabled = true;
      const generation = sessionGeneration;
      await state.backend.signOut();
      if (generation !== sessionGeneration) return;
      ++sessionGeneration;
      ++authGeneration;
      state.unsubscribe?.();
      state.demo = false; state.user = null; state.events = []; state.saved = []; state.query = ''; state.category = 'all';
      storeMode(null);
      state.backend = backendConfigured ? liveBackend() : null;
      if (state.backend) watchAuth();
      location.hash = 'login'; render();
    }
    if (button.dataset.save) {
      button.disabled = true;
      const generation = sessionGeneration;
      const userId = state.user?.id;
      const saved = await state.backend.toggleSaved(button.dataset.save);
      if (generation !== sessionGeneration || userId !== state.user?.id) return;
      state.saved = saved;
      if (route() !== 'create' || !root.querySelector('#event-form')) render();
    }
  } catch (error) { toast(error.message); button.disabled = false; }
});

root.addEventListener('input', (event) => {
  if (event.target.id === 'search') { state.query = event.target.value; renderEventList(); }
});

root.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.target;
  if (!['auth-form', 'event-form'].includes(form.id)) return;
  const button = form.querySelector('[type="submit"]');
  if (button.disabled) return;
  const errorBox = form.querySelector('.form-error');
  errorBox.hidden = true;
  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  const values = Object.create(null);
  new FormData(form).forEach((value, key) => { values[key] = value; });
  try {
    if (form.id === 'auth-form') {
      if (!backendConfigured) throw new Error('As contas ainda não estão conectadas. Use “Explorar demonstração” para conhecer o app.');
      const generation = ++sessionGeneration;
      state.demo = false;
      state.backend = liveBackend();
      const backend = state.backend;
      const isCurrent = () => generation === sessionGeneration && backend === state.backend && !state.demo;
      storeMode(null);
      let session;
      if (form.dataset.mode === 'signup') {
        const result = await backend.signUp(values);
        if (!isCurrent()) return;
        if (result.confirmationRequired) {
          const success = form.querySelector('.form-success');
          success.textContent = 'Confira sua caixa de entrada e confirme o e-mail. Depois volte aqui para entrar.';
          success.hidden = false;
          return;
        }
        session = result.session;
      } else session = await backend.signIn(values.email, values.password);
      if (!isCurrent()) return;
      state.user = session.user;
      watchAuth();
      location.hash = 'feed';
      await loadEvents();
      window.scrollTo(0, 0);
      toast('Chegou! Bora descobrir Brasília.');
    } else {
      const generation = sessionGeneration;
      const userId = state.user?.id;
      const created = await state.backend.createEvent(values);
      if (generation !== sessionGeneration || userId !== state.user?.id) return;
      state.events.push(created);
      state.events.sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
      state.query = ''; state.category = 'all';
      location.hash = `event/${encodeURIComponent(created.id)}`;
      render();
      toast(state.demo ? 'Rolê publicado na demonstração deste aparelho.' : 'Rolê publicado. Agora é com a cidade!');
    }
  } catch (error) { errorBox.textContent = error.message; errorBox.hidden = false; }
  finally { button.disabled = false; button.removeAttribute('aria-busy'); }
});

window.addEventListener('hashchange', render);

async function init() {
  render();
  let demo = false;
  try { demo = localStorage.getItem('agitta-mode') === 'demo'; } catch { /* UI is still usable without storage. */ }
  if (demo) { await enterDemo(true); return; }
  if (!backendConfigured) return;
  const generation = sessionGeneration;
  try {
    state.backend = liveBackend();
    const backend = state.backend;
    const session = await backend.getSession();
    if (generation !== sessionGeneration || state.demo || backend !== state.backend) return;
    state.user = session?.user || null;
    watchAuth();
    if (state.user) await loadEvents();
    else render();
  } catch (error) { if (generation === sessionGeneration) { toast(error.message); render(); } }
}

setupWebApp();
init().catch((error) => window.agittaShowStartupError?.(error.message));
