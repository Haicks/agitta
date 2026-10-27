import { test, expect } from '@playwright/test';

test('falha ao carregar o aplicativo mostra recuperação em vez de tela vazia', async ({ page }) => {
  await page.route('**/src/main.js*', (route) => route.abort('failed'));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Não foi possível abrir o Agitta.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tentar novamente', exact: true })).toBeVisible();
  await expect(page.locator('#startup-message')).toContainText('atualize seu navegador');
});

test('WebView sem Object.hasOwn ou Object.fromEntries abre o feed e publica', async ({ page }) => {
  await page.addInitScript(() => { Object.hasOwn = undefined; Object.fromEntries = undefined; });
  await page.goto('/');
  await page.getByRole('button', { name: /Explorar demonstração/ }).click();
  await expect(page.locator('.event-card')).toHaveCount(5);
  await page.locator('.mobile-nav').getByRole('link', { name: 'Publicar', exact: true }).click();
  await page.getByLabel('Qual é o rolê?').fill('Rolê no WebView antigo');
  await page.getByLabel('Conta mais').fill('Evento fictício para verificar compatibilidade do aplicativo.');
  await page.getByLabel('Data e hora · Brasília').fill('2099-12-02T18:00');
  await page.getByLabel('Nome do local').fill('Eixão');
  await page.getByLabel('Região do DF').fill('Asa Norte');
  await page.getByLabel('Endereço ou ponto de encontro').fill('SQN 208, Brasília DF');
  await page.getByRole('dialog').getByRole('button', { name: 'Publicar rolê', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Rolê no WebView antigo', exact: true })).toBeVisible();
});
