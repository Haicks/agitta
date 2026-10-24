import test from 'node:test';
import assert from 'node:assert/strict';
import { brasiliaDate, validateEvent, filterEvents, escapeHTML, formatDate, formatPrice } from '../src/domain.js';
import { demoBackend } from '../src/data.js';

const input = () => ({
  title: '  Festival do Eixão  ', description: 'Música e cultura no coração de Brasília.',
  starts_at: '2099-12-02T18:30', venue: 'Eixão', address: 'Quadra 208 Norte, Brasília',
  region: 'Asa Norte', category: 'music', price: '12.50', age_rating: 'Livre',
});

test('datetime-local means Brasília even when host is UTC', () => {
  assert.equal(brasiliaDate('2099-12-02T18:30').toISOString(), '2099-12-02T21:30:00.000Z');
  assert.equal(brasiliaDate('2099-12-02T21:30:00Z').toISOString(), '2099-12-02T21:30:00.000Z');
});

test('event validation normalizes input and rejects invalid publish requests', () => {
  const event = validateEvent(input());
  assert.equal(event.title, 'Festival do Eixão');
  assert.equal(event.price, 12.5);
  assert.equal(event.starts_at, '2099-12-02T21:30:00.000Z');
  for (const patch of [
    { title: 'a' }, { description: 'curta' }, { category: 'admin' }, { price: -1 },
    { price: '' }, { price: 'abc' }, { price: Infinity }, { age_rating: '99' },
    { price: null }, { price: true }, { price: [] },
    { starts_at: 'bad date' }, { starts_at: '2000-01-01T18:00' },
    { starts_at: '2099-02-30T18:00' }, { starts_at: '2099-12-02' },
    { starts_at: '2099-12-02T24:00' },
    { starts_at: '9999-12-31T23:59' },
  ]) assert.throws(() => validateEvent({ ...input(), ...patch }));
});

test('search handles accents and combines category and query', () => {
  const events = [{ ...validateEvent(input()), id: 'one' }, { ...validateEvent(input()), id: 'two', category: 'food' }];
  assert.equal(filterEvents(events, { query: 'eixao brasilia', category: 'music' }).length, 1);
  assert.equal(filterEvents(events, { query: 'inexistente' }).length, 0);
  assert.equal(filterEvents(events).length, 2);
});

test('render helpers escape HTML and format Brasília dates/currency', () => {
  assert.equal(escapeHTML('<script "x">&\'</script>'), '&lt;script &quot;x&quot;&gt;&amp;&#39;&lt;/script&gt;');
  assert.equal(formatDate('2099-12-02T21:30:00Z').time, '18:30');
  assert.equal(formatPrice(0), 'Grátis');
  assert.match(formatPrice(12.5), /12,50/);
});

function memoryStorage() {
  const data = new Map();
  return { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
}

test('demo publishes and saves persist across backend instances without real authentication', async () => {
  const storage = memoryStorage();
  const demo = demoBackend(storage);
  const events = await demo.listEvents();
  assert.equal(events.length, 5);
  assert.ok(events.every((event) => new Date(event.starts_at) > new Date()));
  await assert.rejects(() => demo.signIn('test@example.com', 'anypassword'), /não autentica/);
  await assert.rejects(() => demo.signUp({}), /não cria/);
  const created = await demo.createEvent(input());
  assert.equal(created.author_id, 'demo-user');
  assert.ok((await demo.toggleSaved(created.id)).includes(created.id));
  const restored = demoBackend(storage);
  assert.ok((await restored.listEvents()).some((event) => event.id === created.id));
  assert.ok((await restored.getSavedIds()).includes(created.id));
  assert.equal((await restored.toggleSaved(created.id)).length, 0);
  await assert.rejects(() => restored.toggleSaved('unknown'), /não está mais disponível/);
});

test('demo recovers corrupted local data and reports storage failures', async () => {
  const corrupted = { getItem: () => 'not JSON', setItem() {} };
  assert.equal((await demoBackend(corrupted).listEvents()).length, 5);
  const full = { getItem: () => null, setItem() { throw new Error('QuotaExceededError'); } };
  await assert.rejects(() => demoBackend(full).listEvents(), /Não foi possível salvar/);
});

test('demo repairs malformed records and renews expired samples without losing user posts', async () => {
  const storage = memoryStorage();
  const demo = demoBackend(storage);
  const created = await demo.createEvent(input());
  await demo.toggleSaved(created.id);
  const stored = JSON.parse(storage.getItem('agitta-demo-v1'));
  stored.events.push(null, {}, { title: 'broken' });
  stored.events.find((event) => event?.id === 'demo-eixo').starts_at = '2000-01-01T12:00:00Z';
  stored.saved.push(null, 'missing', created.id);
  storage.setItem('agitta-demo-v1', JSON.stringify(stored));
  const restored = demoBackend(storage);
  assert.equal((await restored.listEvents()).length, 6);
  assert.deepEqual(await restored.getSavedIds(), [created.id]);
  assert.equal((await restored.getEventsByIds([created.id]))[0].title, created.title);
  assert.ok((await restored.listEvents()).every((event) => new Date(event.starts_at) > new Date()));
});

test('demo explicitly reports unavailable storage rather than silently losing changes', async () => {
  await assert.rejects(() => demoBackend(null).listEvents(), /armazenamento local está indisponível/);
});
