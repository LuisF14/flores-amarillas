import { test, expect, type Page } from "@playwright/test";

async function reachSurprise(page: Page) {
  const control = page.locator('.grow-button');
  for (let i = 0; i < 4; i++) {
    await expect(control).toHaveAttribute('aria-disabled', 'false');
    await control.click();
  }
  await expect(page.locator('.dedication')).toBeVisible({ timeout: 6000 });
  for (let i = 2; i <= 5; i++) {
    await expect(control).toHaveAttribute('aria-disabled', 'false');
    await control.click();
    await expect(page.locator('.garden-art .flower-svg')).toHaveCount(i);
  }
  await expect(control).toHaveAttribute('aria-disabled', 'false');
  await expect(control).toContainText('¿Y si fueran muchas más?');
  await control.click();
}

// A generated silent PCM fixture exercises playback without distributing a song.
function audioFixture() {
  const samples = 22050 * 60, wav = Buffer.alloc(44 + samples * 2);
  wav.write('RIFF'); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(22050, 24); wav.writeUInt32LE(44100, 28); wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(samples * 2, 40);
  return wav;
}

async function missingAudio(page: Page) {
  // A failed media request must remain a handled, silent feature failure.
  await page.route('**/audio/vienna.mp3', route => route.fulfill({ status: 404, body: '' }));
}

test('initial stages, second surprise, planting limit and keyboard', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await missingAudio(page);
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');
  await page.locator('.garden-touch').click();
  await page.locator('.garden-touch').dispatchEvent('click');
  await expect(page.locator('.garden-scene')).toHaveClass(/stage-1/);
  await expect(page.locator('.grow-button')).toHaveAttribute('aria-disabled', 'false');
  await page.keyboard.press('Enter');
  await expect(page.locator('.garden-scene')).toHaveClass(/stage-2/);
  await expect(page.locator('.grow-button')).toHaveAttribute('aria-disabled', 'false');
  await page.keyboard.press('Space');
  await expect(page.locator('.garden-scene')).toHaveClass(/stage-3/);
  await expect(page.locator('.grow-button')).toHaveAttribute('aria-disabled', 'false');
  await page.locator('.grow-button').click();
  await expect(page.locator('.dedication')).toHaveCount(0);
  await expect(page.locator('.dedication')).toBeVisible({ timeout: 6000 });
  for (let i = 2; i <= 5; i++) {
    await expect(page.locator('.grow-button')).toHaveAttribute('aria-disabled', 'false');
    await page.locator('.grow-button').click();
  }
  await expect(page.locator('.grow-button')).toHaveAttribute('aria-disabled', 'false');
  await page.getByRole('button', { name: '¿Y si fueran muchas más?', exact: true }).click();
  await expect(page.locator('.grow-button')).toHaveCount(0);
  await expect(page.locator('.surprise-note h2')).toHaveCount(0);
  await expect(page.locator('.flower-field')).toHaveAttribute('data-ready', 'true', { timeout: 16000 });
  await expect(page.locator('.surprise-note')).toContainText('Creo que una sola no era suficiente');
  await page.screenshot({ path: 'test-results/field-desktop.png', fullPage: true });
  const canvas = page.locator('.flower-field canvas');
  await canvas.focus();
  for (let i = 0; i < 12; i++) await page.keyboard.press('Enter');
  await expect(page.locator('.flower-field')).toHaveAttribute('data-flowers', '33');
  await expect(page.locator('.field-hint')).not.toHaveClass(/visible/, { timeout: 8000 });
  expect(errors).toEqual([]);
});

test('music: real Vienna, volume, pause, resume and continuity', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  const response = await page.request.get('/audio/vienna.mp3');
  expect(response.status()).toBe(200); expect(response.headers()['content-type']).toMatch(/audio/);
  await page.addInitScript(() => {
    Object.assign(window, { __mediaEvents: [] });
    for (const name of ['loadedmetadata', 'playing', 'pause']) document.addEventListener(name, e => {
      if (e.target instanceof HTMLAudioElement) (window as unknown as { __mediaEvents: string[] }).__mediaEvents.push(name);
    }, true);
    if (window.AudioContext) {
      const create = AudioContext.prototype.createGain;
      AudioContext.prototype.createGain = function () { const gain = create.call(this); Object.assign(window, { __gain: gain.gain }); return gain; };
    }
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const audio = page.locator('audio'), button = page.locator('.music-toggle');
  await expect(audio).toHaveCount(1);
  await expect(button).toContainText('\u{1F3B5} M\u00fasica');
  expect(await audio.evaluate(a => (a as HTMLAudioElement).paused)).toBe(true);
  await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  const state = () => audio.evaluate(el => {
    const a = el as HTMLAudioElement;
    return { paused: a.paused, muted: a.muted, loop: a.loop, time: a.currentTime, volume: a.volume, gain: (window as unknown as { __gain?: AudioParam }).__gain?.value };
  });
  await expect.poll(async () => (await state()).volume).toBeCloseTo(0.55, 2);
  expect(await state()).toMatchObject({ paused: false, muted: false, loop: true });
  await page.locator('.music-mute').click();
  await expect.poll(async () => (await state()).paused).toBe(true);
  await expect(button).toContainText('silenciada');
  const pausedAt = (await state()).time;
  await page.locator('.music-mute').click();
  await expect.poll(async () => (await state()).time).toBeGreaterThan(pausedAt);
  await page.locator('.music-mute').click(); await page.locator('.music-mute').click();
  await expect.poll(async () => (await state()).volume).toBeCloseTo(0.55, 2);
  await expect.poll(async () => (await state()).gain).toBeCloseTo(1, 2);
  const slider = page.getByRole('slider');
  await slider.focus(); await slider.press('Home');
  await expect(button).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(async () => (await state()).paused).toBe(true);
  expect((await state()).volume).toBe(0);
  const zeroAt = (await state()).time;
  await slider.press('End');
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  expect((await state()).volume).toBe(1);
  await expect.poll(async () => (await state()).time).toBeGreaterThan(zeroAt);
  await slider.press('ArrowLeft'); expect((await state()).volume).toBeCloseTo(0.99, 2);
  await page.keyboard.press('Escape'); await expect(slider).toHaveCount(0);
  await audio.evaluate(a => Object.assign(window, { __originalAudio: a }));
  const before = (await state()).time;
  await reachSurprise(page);
  await expect(page.locator('.flower-field')).toHaveAttribute('data-ready', 'true');
  await page.locator('.journey-invite').click();
  await expect(page.locator('.infinite-garden canvas')).toHaveAttribute('data-phase', 'travel');
  expect(await audio.evaluate(a => a === (window as unknown as { __originalAudio: HTMLAudioElement }).__originalAudio)).toBe(true);
  expect((await state()).time).toBeGreaterThan(before);
  expect((await state()).paused).toBe(false);
  const events = await page.evaluate(() => (window as unknown as { __mediaEvents: string[] }).__mediaEvents);
  expect(events).toContain('loadedmetadata'); expect(events.filter(e => e === 'playing').length).toBeGreaterThanOrEqual(2); expect(events).toContain('pause');
  expect(errors).toEqual([]);
});

test('music works without Web Audio and handles a missing source', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(window, 'AudioContext', { value: undefined }); Object.defineProperty(window, 'webkitAudioContext', { value: undefined }); });
  await page.route('**/audio/vienna.mp3', route => route.fulfill({ status: 200, contentType: 'audio/wav', body: audioFixture() }));
  await page.goto('/');
  await page.locator('.music-toggle').click();
  await expect(page.locator('.music-toggle')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('.music-mute').click();
  await expect.poll(() => page.locator('audio').evaluate(a => (a as HTMLAudioElement).paused)).toBe(true);
  await missingAudio(page); await page.reload();
  await page.locator('.music-toggle').click();
  await expect.poll(() => page.locator('audio').evaluate(a => (a as HTMLAudioElement).error?.code)).toBeTruthy();
  await expect(page.locator('.music-toggle')).toHaveAttribute('aria-pressed', 'false');
});

test('requested sizes, touch planting, reduced motion and missing MP3', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await missingAudio(page);
  await page.goto('http://localhost:3000/');
  await reachSurprise(page);
  await expect(page.locator('.flower-field')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('.music-toggle')).toHaveAttribute('aria-pressed', 'false');
  await page.locator('.flower-field canvas').tap({ position: { x: 10, y: 230 } });
  await expect(page.locator('.flower-field')).toHaveAttribute('data-flowers', '26');
  for (const [width, height] of [[375,667], [390,844], [430,932], [768,1024], [1366,768], [1920,1080]]) {
    await page.setViewportSize({ width, height });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const note = await page.locator('.surprise-note').boundingBox(), field = await page.locator('.flower-field').boundingBox();
    expect(note!.y + note!.height).toBeLessThanOrEqual(field!.y + 1);
    if (width < 700) {
      const invite = await page.locator('.journey-invite').boundingBox(), music = await page.locator('.music-control').boundingBox();
      expect(invite!.y).toBeGreaterThanOrEqual(0); expect(invite!.y + invite!.height).toBeLessThan(height - 70);
      expect(invite!.height).toBeGreaterThanOrEqual(44); expect(invite!.y + invite!.height + 15).toBeLessThan(music!.y);
      expect(await page.evaluate(() => scrollY)).toBe(0);
      await page.locator('.music-toggle').tap();
      const panel = await page.locator('.music-panel').boundingBox();
      expect(invite!.y + invite!.height + 15).toBeLessThan(panel!.y);
      await page.screenshot({ path: `test-results/field-panel-${width}x${height}.png` });
      await page.keyboard.press('Escape');
    }
    await page.screenshot({ path: `test-results/field-${width}x${height}.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Hay algo más ✨', exact: true }).tap();
  const travel = page.locator('.infinite-garden canvas');
  await expect(travel).toHaveAttribute('data-phase', 'travel');
  await travel.dispatchEvent('pointerdown', { clientX: 180, clientY: 600, pointerType: 'touch', isPrimary: true, button: 0 });
  await travel.dispatchEvent('pointerup', { clientX: 180, clientY: 300, pointerType: 'touch', isPrimary: true, button: 0 });
  await expect.poll(async () => Number(await travel.getAttribute('data-distance'))).toBeGreaterThan(1);
  await expect(page.locator('.music-toggle')).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
  await context.close();
});

test('infinite garden: nine timely thoughts, silent stretch and living final', async ({ page }) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/');
  await reachSurprise(page);
  await expect(page.locator('.flower-field')).toHaveAttribute('data-ready', 'true', { timeout: 16000 });
  await page.clock.install(); await page.locator('.journey-invite').click();
  const scene = page.locator('.infinite-garden canvas'), thought = page.locator('.journey-thought');
  const advanceTo = async (seconds: number) => {
    const elapsed = Number(await scene.getAttribute('data-elapsed')) || 0;
    if (seconds > elapsed) await page.clock.runFor((seconds - elapsed) * 1000 + 40);
  };
  const phrases = ['No tienes', 'propio ritmo', 'cuando descansas', 'toman tiempo', 'disfrutar', 'fuerte', 'decisiones', 'miedo', 'por descubrir'];
  const times = [5.2, 10.2, 15.2, 20.2, 25.7, 31.7, 36.7, 41.7, 46.7];
  for (let i = 0; i < times.length; i++) {
    await advanceTo(times[i]); await expect(thought).toContainText(phrases[i]);
    expect(await thought.evaluate(el => Number(getComputedStyle(el).opacity))).toBeGreaterThan(0.9);
    if (i === 0) {
      for (const [width, height] of [[375,667], [390,844], [430,932], [1366,768], [1920,1080]]) {
        await page.setViewportSize({ width, height }); await page.clock.runFor(100);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        const bounds = await thought.boundingBox();
        expect(bounds!.x).toBeGreaterThanOrEqual(0); expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
        await page.screenshot({ path: `test-results/journey-message-${width}x${height}.png` });
      }
      await page.setViewportSize({ width: 390, height: 844 });
      const before = Number(await scene.getAttribute('data-distance'));
      await scene.dispatchEvent('wheel', { deltaY: 500 }); await page.clock.runFor(1500);
      expect(Number(await scene.getAttribute('data-distance')) - before).toBeGreaterThan(2);
    }
  }
  await advanceTo(51); await expect(thought).toBeEmpty(); await expect(page.locator('.journey-finale h2')).toHaveCSS('opacity','0');
  await advanceTo(55.8); await expect(thought).toBeEmpty(); await expect(page.locator('.journey-finale h2')).toHaveCSS('opacity','0');
  await advanceTo(57.2); await expect(page.locator('.journey-finale h2')).toHaveCSS('opacity','1');
  await expect(page.locator('.journey-finale p')).toHaveCSS('opacity','0');
  await advanceTo(60.2); await expect(page.locator('.journey-finale p')).toHaveCSS('opacity','1');
  await advanceTo(63); await expect(page.locator('.journey-finale small')).toHaveCSS('opacity','1');
  for (const [width,height] of [[375,667],[390,844],[430,932]]) {
    await page.setViewportSize({ width,height }); await page.clock.runFor(100);
    const final = await page.locator('.journey-finale').boundingBox(), music = await page.locator('.music-control').boundingBox();
    expect(final!.y + final!.height + 20).toBeLessThan(music!.y);
    await page.screenshot({ path: `test-results/finale-${width}x${height}.png` });
  }
  const distance = await scene.getAttribute('data-distance');
  await page.clock.runFor(10000); await expect(scene).toHaveAttribute('data-distance', distance!);
  await expect(scene).toHaveAttribute('data-phase','rest'); expect(errors).toEqual([]);
});

for (const [width, height] of [[375,667],[390,844],[430,932]]) {
  test(`touch volume panel at ${width}x${height}`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: {width,height}, isMobile: true, hasTouch: true, reducedMotion:'reduce' });
    const page = await context.newPage(); await page.goto('http://localhost:3000');
    await page.locator('.music-toggle').tap();
    await expect(page.locator('.music-toggle')).toHaveAttribute('aria-pressed','true');
    const slider = page.getByRole('slider'); const bounds = await slider.boundingBox();
    expect(bounds!.height).toBeGreaterThanOrEqual(44);
    await slider.tap({position:{x:bounds!.width * 0.7,y:bounds!.height/2}});
    const value = Number(await slider.inputValue());
    expect(value).toBeGreaterThan(0.6); expect(value).toBeLessThan(0.85);
    expect(await page.locator('audio').evaluate(a => (a as HTMLAudioElement).volume)).toBeCloseTo(value,2);
    await page.screenshot({ path: `test-results/volume-${width}x${height}.png` });
    await page.locator('.music-mute').tap();
    await expect.poll(()=>page.locator('audio').evaluate(a=>(a as HTMLAudioElement).paused)).toBe(true);
    await page.locator('.music-mute').tap();
    await expect(page.locator('.music-toggle')).toHaveAttribute('aria-pressed','true');
    await context.close();
  });
}
