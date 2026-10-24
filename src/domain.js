export const CATEGORIES = Object.freeze({
  music: 'Música',
  culture: 'Cultura',
  food: 'Gastronomia',
  sport: 'Esporte',
});

export const AGE_RATINGS = Object.freeze(['Livre', '16', '18']);

function textField(input, name, label, minimum, maximum) {
  const value = typeof input[name] === 'string' ? input[name].trim() : '';
  if (value.length < minimum || value.length > maximum) {
    throw new Error(`${label} deve ter entre ${minimum} e ${maximum} caracteres.`);
  }
  return value;
}

/** Interpret datetime-local in Brasília, independently of the device timezone. */
export function brasiliaDate(value) {
  if (typeof value !== 'string') throw new Error('Informe a data e o horário do evento.');
  const local = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(value);
  if (!local && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/.test(value)) {
    throw new Error('Informe uma data e um horário válidos para o evento.');
  }
  const [hours, minutes] = value.slice(11, 16).split(':').map(Number);
  if (hours > 23 || minutes > 59) throw new Error('Informe um horário válido para o evento.');
  const date = new Date(local ? `${value}-03:00` : value);
  if (!Number.isFinite(date.getTime())) throw new Error('Informe uma data válida para o evento.');
  // Date silently rolls February 30 to March. Reject that instead of publishing
  // a different day than the one typed by the user.
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  const calendarDay = new Date(Date.UTC(year, month - 1, day));
  if (calendarDay.getUTCFullYear() !== year || calendarDay.getUTCMonth() + 1 !== month || calendarDay.getUTCDate() !== day) {
    throw new Error('Informe uma data válida para o evento.');
  }
  return date;
}

export function validateEvent(input, now = Date.now()) {
  const title = textField(input, 'title', 'O título', 3, 100);
  const description = textField(input, 'description', 'A descrição', 10, 2000);
  const venue = textField(input, 'venue', 'O nome do local', 2, 100);
  const address = textField(input, 'address', 'O endereço', 5, 240);
  const region = textField(input, 'region', 'A região', 2, 60);
  if (!Object.hasOwn(CATEGORIES, input.category)) throw new Error('Escolha uma categoria válida.');
  const age_rating = String(input.age_rating ?? 'Livre');
  if (!AGE_RATINGS.includes(age_rating)) throw new Error('Escolha uma classificação indicativa válida.');
  const price = typeof input.price === 'string' && input.price.trim() === ''
    ? NaN
    : Number(input.price);
  if (!Number.isFinite(price) || price < 0 || price > 100000) {
    throw new Error('Informe um preço entre R$ 0 e R$ 100.000.');
  }
  const date = brasiliaDate(input.starts_at);
  if (date.getTime() <= Number(now)) throw new Error('Escolha uma data e um horário no futuro.');
  return {
    title, description, venue, address, region,
    category: input.category,
    price: Math.round((price + Number.EPSILON) * 100) / 100,
    age_rating,
    starts_at: date.toISOString(),
  };
}

export function escapeHTML(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function searchText(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
}

export function filterEvents(events, { query = '', category = 'all' } = {}) {
  const terms = searchText(query).trim().split(/\s+/).filter(Boolean);
  return events.filter((event) => {
    if (category && category !== 'all' && event.category !== category) return false;
    const haystack = searchText([event.title, event.description, event.venue, event.address, event.region].join(' '));
    return terms.every((term) => haystack.includes(term));
  });
}

export function formatDate(value) {
  const date = new Date(value);
  const format = (options) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', ...options }).format(date);
  return {
    day: format({ day: '2-digit' }),
    month: format({ month: 'short' }).replace('.', '').toUpperCase(),
    time: format({ hour: '2-digit', minute: '2-digit' }),
    full: format({ weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }),
  };
}

export function formatPrice(value) {
  return Number(value) === 0 ? 'Grátis' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));
}
