import { test, expect } from '@playwright/test';

async function enterDemo(page) {
  await page.goto('/');
  await page.getByRole('button', { name: /Explorar demonstração/ }).click();
  await expect(page.getByRole('heading', { name: 'O que agitta Brasília?' })).toBeVisible();
  await expect(page.locator('.event-card')).toHaveCount(5);
}

async function expectNoHorizontalOverflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

async function expectStylesApplied(page) {
  const styles = await page.evaluate(() => ({
    background: getComputedStyle(document.documentElement).backgroundColor,
    iconWidth: document.querySelector('.icon')?.getBoundingClientRect().width,
  }));
  expect(styles.background).toBe('rgb(248, 247, 243)');
  expect(styles.iconWidth).toBeGreaterThan(0);
  expect(styles.iconWidth).toBeLessThan(50);
}

test('cadastro, visibilidade de senha e falha de login não criam sessão fictícia', async ({ page }) => {
  await page.route('**/auth/v1/token**', (route) => route.fulfill({
    status: 400,
    contentType: 'application/json',
    body: JSON.stringify({ error_code: 'invalid_credentials', msg: 'Invalid login credentials' }),
  }));
  await page.goto('/');
  await expectNoHorizontalOverflow(page);
  await expectStylesApplied(page);
  await page.getByRole('link', { name: 'Criar conta', exact: true }).click();
  await expect(page.getByLabel('Como podemos te chamar?')).toBeVisible();
  await expect(page.getByLabel('Sua senha', { exact: true })).toHaveAttribute('minlength', '8');
  await page.getByRole('button', { name: 'Mostrar senha' }).click();
  await expect(page.getByLabel('Sua senha', { exact: true })).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Ocultar senha' }).click();
  await expect(page.getByLabel('Sua senha', { exact: true })).toHaveAttribute('type', 'password');
  await page.getByRole('link', { name: 'Entrar', exact: true }).click();
  await page.getByLabel('Seu e-mail').fill('inexistente@example.test');
  await page.getByLabel('Sua senha', { exact: true }).fill('senha-incorreta');
  await page.getByRole('button', { name: 'Entrar no Agitta' }).click();
  await expect(page.locator('#auth-error')).toBeVisible();
  await expect(page.locator('#auth-error')).toContainText(/contas ainda não estão conectadas|E-mail ou senha incorretos/);
  await expect(page.locator('.app-shell')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('agitta-mode'))).toBeNull();
});

test('feed filtra categorias e encontra regiões sem exigir acentos', async ({ page }) => {
  await enterDemo(page);
  await expect(page.getByText('Modo demonstração', { exact: true })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.getByRole('button', { name: 'Música', exact: true }).click();
  await expect(page.locator('.event-card')).toHaveCount(2);
  await expect(page.getByRole('button', { name: 'Música', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Cultura', exact: true }).click();
  await expect(page.locator('.event-card')).toHaveCount(1);
  await expect(page.locator('.event-card')).toContainText('Cinema debaixo das estrelas');
  await page.getByRole('button', { name: 'Tudo junto', exact: true }).click();
  await page.getByRole('searchbox', { name: 'Buscar eventos' }).fill('aguas claras');
  await expect(page.locator('.event-card')).toHaveCount(1);
  await expect(page.locator('.event-card')).toContainText('Bora ocupar a pista?');
  await page.getByRole('searchbox', { name: 'Buscar eventos' }).fill('naoexiste123');
  await expect(page.getByRole('heading', { name: 'Nenhum rolê por aqui. Ainda.' })).toBeVisible();
  await page.getByRole('searchbox', { name: 'Buscar eventos' }).fill('');
  await expect(page.locator('.event-card')).toHaveCount(5);
});

test('detalhes mostram endereço, classificação e um link de mapa válido', async ({ page }) => {
  await enterDemo(page);
  await page.locator('.event-card').first().getByRole('heading').getByRole('link').click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  const detailURL = page.url();
  await page.reload();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page).toHaveURL(detailURL);
  await expect(dialog).toContainText('Eixão Norte, altura da 208 Norte');
  await expect(dialog).toContainText('Classificação: Livre');
  const map = dialog.getByRole('link', { name: /Abrir no mapa/ });
  await expect(map).toHaveAttribute('target', '_blank');
  const target = new URL(await map.getAttribute('href'));
  expect(target.origin).toBe('https://www.google.com');
  expect(target.searchParams.get('query')).toContain('208 Norte');
  await expectNoHorizontalOverflow(page);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page).toHaveURL(/#feed$/);
});

test('salvar e remover eventos funciona e o estado sobrevive ao recarregamento', async ({ page }) => {
  await enterDemo(page);
  await page.getByRole('button', { name: /Salvar evento: O Eixão/ }).click();
  await expect(page.getByRole('button', { name: /Remover dos salvos: O Eixão/ })).toHaveAttribute('aria-pressed', 'true');
  await page.locator('.mobile-nav').getByRole('link', { name: /Salvos/ }).click();
  await expect(page.locator('.event-card')).toHaveCount(1);
  await expect(page.locator('.event-card')).toContainText('O Eixão vai virar pista');
  await page.reload();
  await expect(page.getByText('Modo demonstração', { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/#saved$/);
  await expect(page.locator('.event-card')).toHaveCount(1);
  await page.getByRole('button', { name: /Remover dos salvos: O Eixão/ }).click();
  await expect(page.getByRole('heading', { name: 'Seu próximo rolê merece um lugar aqui.' })).toBeVisible();
});

test('publicação valida data, exibe texto seguro e persiste o novo evento local', async ({ page }) => {
  await enterDemo(page);
  await page.locator('.mobile-nav').getByRole('link', { name: 'Publicar', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  const title = 'Encontro <img src=x onerror=alert(1)>';
  await page.getByLabel('Qual é o rolê?').fill(title);
  await page.getByLabel('Conta mais').fill('Encontro fictício de teste com texto <script>alert(1)</script> para a comunidade.');
  await page.getByLabel('Categoria', { exact: true }).selectOption('culture');
  await page.getByLabel('Nome do local').fill('Praça de teste');
  await page.getByLabel('Região do DF').fill('Asa Sul');
  await page.getByLabel('Endereço ou ponto de encontro').fill('SQS 308, Asa Sul, Brasília DF');
  await page.getByLabel('Entrada · R$').fill('12.50');
  await page.getByLabel('Classificação indicativa').selectOption('16');
  const date = page.getByLabel('Data e hora · Brasília');
  await date.fill('2000-01-01T12:00');
  await dialog.getByRole('button', { name: 'Publicar rolê', exact: true }).click();
  await expect(dialog).toBeVisible();
  expect(await date.evaluate((input) => input.validity.rangeUnderflow)).toBe(true);
  const future = new Date(Date.now() + 7 * 86400000 - 3 * 3600000).toISOString().slice(0, 16);
  await date.fill(future);
  await dialog.getByRole('button', { name: 'Publicar rolê', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('heading', { name: title, exact: true })).toBeVisible();
  await expect(page.getByRole('dialog')).toContainText('Classificação: 16 anos');
  await expect(page.getByRole('dialog')).toContainText('R$ 12,50');
  await expect(page.getByRole('dialog').locator('img, script')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await page.getByRole('searchbox', { name: 'Buscar eventos' }).fill('Encontro <img');
  await expect(page.locator('.event-card')).toHaveCount(1);
  await page.reload();
  await page.getByRole('searchbox', { name: 'Buscar eventos' }).fill('Encontro <img');
  await expect(page.locator('.event-card')).toHaveCount(1);
  await expect(page.locator('.event-card').getByRole('heading')).toHaveText(title);
});

test('perfil identifica a demonstração e sair retorna para o login', async ({ page }) => {
  await enterDemo(page);
  await page.locator('.mobile-nav').getByRole('link', { name: 'Perfil', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Seu cantinho.' })).toBeVisible();
  await expect(page.getByText('Visitando o protótipo · sem conta real')).toBeVisible();
  await page.getByRole('button', { name: 'Sair da demonstração', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Entrar no Agitta' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('agitta-mode'))).toBeNull();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Entrar no Agitta' })).toBeVisible();
});

test('layout desktop navega sem erros de JavaScript nem transbordamento', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await enterDemo(page);
  await expect(page.locator('.sidebar')).toBeVisible();
  await expect(page.locator('.discover-panel')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await expectStylesApplied(page);
  await page.locator('.sidebar').getByRole('link', { name: /Rolês salvos/ }).click();
  await expect(page.getByRole('heading', { name: 'Seus próximos rolês.' })).toBeVisible();
  expect(errors).toEqual([]);
});
