import { createClient } from '@supabase/supabase-js';
import { validateEvent } from './domain.js';

const configuration = import.meta.env ?? {};
const url = configuration.VITE_SUPABASE_URL?.trim();
const key = configuration.VITE_SUPABASE_ANON_KEY?.trim();
export const backendConfigured = Boolean(url && key);
let liveInstance;

function normalizedSession(session) {
  if (!session?.user) return null;
  const metadataName = session.user.user_metadata?.name;
  const name = typeof metadataName === 'string' ? metadataName.trim() : '';
  const email = typeof session.user.email === 'string' ? session.user.email : '';
  return {
    user: {
      id: session.user.id,
      email,
      name: name.slice(0, 60) || email.split('@')[0] || 'Pessoa da comunidade',
    },
  };
}

function throwIfError(error) {
  if (!error) return;
  const messages = {
    invalid_credentials: 'E-mail ou senha incorretos. Confira e tente novamente.',
    email_not_confirmed: 'Confirme seu e-mail antes de entrar.',
    user_already_exists: 'Este e-mail já tem uma conta. Tente entrar.',
    weak_password: 'Escolha uma senha com pelo menos 8 caracteres.',
    over_email_send_rate_limit: 'Muitos e-mails enviados. Aguarde um pouco antes de tentar novamente.',
    over_request_rate_limit: 'Muitas tentativas. Aguarde um pouco e tente de novo.',
    signup_disabled: 'O cadastro está temporariamente indisponível.',
  };
  if (messages[error.code]) throw new Error(messages[error.code]);
  if (String(error.message).includes('Failed to fetch')) throw new Error('Não foi possível conectar. Confira sua conexão e tente de novo.');
  throw new Error(error.message || 'Não foi possível completar a operação. Tente de novo.');
}

function normalizeEvent(row) {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  const { profiles, ...event } = row;
  return { ...event, price: Number(event.price), author_name: profile?.name || 'Comunidade Agitta' };
}

export function liveBackend() {
  if (!backendConfigured) throw new Error('O login ainda não está conectado. Experimente o protótipo enquanto isso.');
  if (liveInstance) return liveInstance;
  const client = createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  });
  async function requireUser() {
    const { data, error } = await client.auth.getSession();
    throwIfError(error);
    if (!data.session?.user) throw new Error('Entre na sua conta para continuar.');
    return data.session.user;
  }
  async function getSavedIds() {
    const user = await requireUser();
    const { data, error } = await client.from('saved_events').select('event_id').eq('user_id', user.id);
    throwIfError(error);
    return data.map((row) => row.event_id);
  }
  liveInstance = {
    async getSession() {
      const { data, error } = await client.auth.getSession();
      throwIfError(error);
      return normalizedSession(data.session);
    },
    onAuthChange(callback) {
      const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
        callback(normalizedSession(session));
      });
      return () => subscription.unsubscribe();
    },
    async signIn(email, password) {
      const { data, error } = await client.auth.signInWithPassword({ email: email.trim(), password });
      throwIfError(error);
      return normalizedSession(data.session);
    },
    async signUp({ name, email, password }) {
      name = String(name ?? '').trim();
      if (name.length < 2 || name.length > 60) throw new Error('Seu nome deve ter entre 2 e 60 caracteres.');
      if (String(password).length < 8) throw new Error('Escolha uma senha com pelo menos 8 caracteres.');
      const { data, error } = await client.auth.signUp({
        email: email.trim(), password, options: { data: { name } },
      });
      throwIfError(error);
      return { session: normalizedSession(data.session), confirmationRequired: !data.session };
    },
    async signOut() {
      const { error } = await client.auth.signOut();
      throwIfError(error);
    },
    async listEvents() {
      const { data, error } = await client.from('events')
        .select('*, profiles!events_author_id_fkey(name)')
        .gte('starts_at', new Date().toISOString())
        .order('starts_at', { ascending: true }).limit(100);
      throwIfError(error);
      return data.map(normalizeEvent);
    },
    async createEvent(input) {
      const event = validateEvent(input);
      const user = await requireUser();
      const { data, error } = await client.from('events')
        .insert({ ...event, author_id: user.id })
        .select('*, profiles!events_author_id_fkey(name)').single();
      throwIfError(error);
      return normalizeEvent(data);
    },
    getSavedIds,
    async toggleSaved(eventId) {
      const user = await requireUser();
      const saved = await getSavedIds();
      const request = saved.includes(eventId)
        ? client.from('saved_events').delete().eq('user_id', user.id).eq('event_id', eventId)
        : client.from('saved_events').insert({ user_id: user.id, event_id: eventId });
      const { error } = await request;
      throwIfError(error);
      return saved.includes(eventId) ? saved.filter((id) => id !== eventId) : [...saved, eventId];
    },
  };
  return liveInstance;
}

const DEMO_KEY = 'agitta-demo-v1';
const demoUser = { id: 'demo-user', email: '', name: 'Você' };

function seedEvents() {
  const startsAt = (days, hour) => {
    const date = new Date(Date.now() + days * 86400000);
    date.setUTCHours(hour + 3, 0, 0, 0);
    return date.toISOString();
  };
  return [
    {
      id: 'demo-eixo', title: 'O Eixão vai virar pista 🎧',
      description: 'Uma tarde de música, gente boa e céu de Brasília. Junta a galera e vem curtir sets de DJs locais no coração da cidade. Evento fictício para explorar o Agitta.',
      starts_at: startsAt(1, 16), venue: 'Eixão do Lazer', address: 'Eixão Norte, altura da 208 Norte, Brasília – DF',
      region: 'Asa Norte', category: 'music', price: 0, age_rating: 'Livre', author_id: 'demo-lia', author_name: 'Lia Costa',
    },
    {
      id: 'demo-cine', title: 'Cinema debaixo das estrelas ✨',
      description: 'Pega a canga e vem assistir a curtas de artistas do DF ao ar livre. Tem conversa depois da sessão e pipoca pra compartilhar. Evento fictício para explorar o Agitta.',
      starts_at: startsAt(2, 19), venue: 'Praça dos Cristais', address: 'Praça dos Cristais, Setor Militar Urbano, Brasília – DF',
      region: 'Plano Piloto', category: 'culture', price: 0, age_rating: 'Livre', author_id: 'demo-caio', author_name: 'Caio Menezes',
    },
    {
      id: 'demo-feira', title: 'Sabores do quadradinho 🍜',
      description: 'Comida de rua, pequenos produtores e muita coisa gostosa feita por gente daqui. Entrada grátis; cada barraca tem seu preço. Evento fictício para explorar o Agitta.',
      starts_at: startsAt(3, 11), venue: 'Parque da Cidade', address: 'Parque da Cidade Sarah Kubitschek, estacionamento 4, Brasília – DF',
      region: 'Asa Sul', category: 'food', price: 0, age_rating: 'Livre', author_id: 'demo-bia', author_name: 'Bia Almeida',
    },
    {
      id: 'demo-sol', title: 'Pôr do sol com som de Brasília 🌅',
      description: 'Um encontro de bandas independentes e um dos fins de tarde mais bonitos do DF. Chega cedo para aproveitar tudo. Evento fictício para explorar o Agitta.',
      starts_at: startsAt(4, 17), venue: 'Praça do Cruzeiro', address: 'Praça do Cruzeiro, Eixo Monumental, Brasília – DF',
      region: 'Cruzeiro', category: 'music', price: 25, age_rating: '16', author_id: 'demo-davi', author_name: 'Davi Santos',
    },
    {
      id: 'demo-skate', title: 'Bora ocupar a pista? 🛹',
      description: 'Encontro de skate para todos os níveis, com uma sessão de iniciação e troca de experiências. Traga seu equipamento. Evento fictício para explorar o Agitta.',
      starts_at: startsAt(5, 9), venue: 'Parque de Águas Claras', address: 'Parque Ecológico de Águas Claras, Águas Claras – DF',
      region: 'Águas Claras', category: 'sport', price: 0, age_rating: 'Livre', author_id: 'demo-nina', author_name: 'Nina Rodrigues',
    },
  ].map((event) => ({ ...event, created_at: new Date().toISOString() }));
}

export function demoBackend(storage = globalThis.localStorage) {
  function read() {
    let value;
    try { value = JSON.parse(storage?.getItem(DEMO_KEY) || 'null'); } catch { value = null; }
    if (!value || !Array.isArray(value.events) || !Array.isArray(value.saved)) {
      value = { events: seedEvents(), saved: [] };
      persist(value);
    }
    return value;
  }
  function persist(value) {
    try { storage?.setItem(DEMO_KEY, JSON.stringify(value)); }
    catch { throw new Error('Não foi possível salvar neste aparelho. Libere espaço ou permita o armazenamento local.'); }
  }
  return {
    async getSession() { return { user: { ...demoUser } }; },
    onAuthChange() { return () => {}; },
    async signIn() { throw new Error('O protótipo não autentica contas. Saia da demonstração para entrar.'); },
    async signUp() { throw new Error('O protótipo não cria contas reais. Saia da demonstração para se cadastrar.'); },
    async signOut() {},
    async listEvents() {
      return read().events.filter((event) => new Date(event.starts_at).getTime() > Date.now())
        .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
    },
    async createEvent(input) {
      const event = {
        ...validateEvent(input), id: crypto.randomUUID(), author_id: demoUser.id,
        author_name: demoUser.name, created_at: new Date().toISOString(),
      };
      const value = read();
      value.events.push(event);
      persist(value);
      return event;
    },
    async getSavedIds() { return [...read().saved]; },
    async toggleSaved(id) {
      const value = read();
      if (!value.events.some((event) => event.id === id)) throw new Error('Este evento não está mais disponível.');
      value.saved = value.saved.includes(id) ? value.saved.filter((item) => item !== id) : [...value.saved, id];
      persist(value);
      return [...value.saved];
    },
  };
}
