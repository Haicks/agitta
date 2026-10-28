import { test, expect } from '@playwright/test';

const themes = {
  dark: { background: 'rgb(11, 13, 11)', chrome: '#0b0d0b' },
  light: { background: 'rgb(248, 247, 243)', chrome: '#f8f7f3' },
};

async function expectTheme(page, theme) {
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor)).toBe(themes[theme].background);
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', themes[theme].chrome);
}

async function expectReadable(page, textSelector, backgroundSelector) {
  const ratio = await page.evaluate(({ textSelector, backgroundSelector }) => {
    const luminance = color => {
      const values = color.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => {
        value /= 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
      return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
    };
    const foreground = luminance(getComputedStyle(document.querySelector(textSelector)).color);
    const background = luminance(getComputedStyle(document.querySelector(backgroundSelector)).backgroundColor);
    return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
  }, { textSelector, backgroundSelector });
  expect(ratio, `Contraste de ${textSelector} sobre ${backgroundSelector}`).toBeGreaterThanOrEqual(4.5);
}

for (const theme of ['dark', 'light']) {
  test(`tema ${theme} acompanha o aparelho e muda sem apagar o formulário`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Entrar no Agitta' })).toBeVisible();
    await expectTheme(page, theme);
    await expectReadable(page, '.auth-panel h2', ':root');
    await expectReadable(page, '.auth-story h1', '.auth-story');
    await expectReadable(page, '#email', '#email');
    await expectReadable(page, '.auth-form .button-primary', '.auth-form .button-primary');
    await expectReadable(page, '.demo-link', ':root');
    await page.getByRole('button', { name: /Explorar demonstração/ }).click();
    await expect(page.locator('.event-card')).toHaveCount(5);
    await expectReadable(page, '.event-card h3', '.event-card');
    await expectReadable(page, '.event-description', '.event-card');
    await expectReadable(page, '.hero h2', '.hero');
    await page.locator('.mobile-nav').getByRole('link', { name: 'Publicar', exact: true }).click();
    await page.getByLabel('Qual é o rolê?').fill('Rascunho que acompanha o tema');
    await expectReadable(page, '.modal-header h2', '.modal');
    await expectReadable(page, '.modal [for="title"]', '.modal');
    await expectReadable(page, '#title', '#title');
    await expectReadable(page, '#event-form [type="submit"]', '#event-form [type="submit"]');
    const next = theme === 'dark' ? 'light' : 'dark';
    await page.emulateMedia({ colorScheme: next });
    await expectTheme(page, next);
    await expect(page.getByLabel('Qual é o rolê?')).toHaveValue('Rascunho que acompanha o tema');
    await expectReadable(page, '#title', '#title');
    await page.getByRole('dialog').getByRole('button', { name: 'Fechar', exact: true }).click();
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.locator('.sidebar').getByRole('link', { name: 'Meu perfil', exact: true }).click();
    await expect(page.locator('.profile-card')).toBeVisible();
    await expectReadable(page, '.profile-hero h2', '.profile-card');
    await expectReadable(page, '.nav-item.active', '.nav-item.active');
  });
}

test('recuperação da inicialização já acompanha o tema escuro', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.route('**/src/main.js*', route => route.abort('failed'));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Não foi possível abrir o Agitta.' })).toBeVisible();
  await expectTheme(page, 'dark');
  await expectReadable(page, '.startup-card h1', '.startup-card');
});
