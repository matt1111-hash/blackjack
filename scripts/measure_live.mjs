// Élő kaszinó elfogadási mérés + vizuális baseline (docs/visual-live/*.png).
// Futtatás:  VITE_E2E=1 npx vite --host 127.0.0.1 --port 4199 &  node scripts/measure_live.mjs
// Rendszer-Chrome-mal (ha a Playwright böngészői nincsenek letöltve):  PW_CHANNEL=chrome node scripts/measure_live.mjs
import { chromium, devices } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:4199';
const SHOE_KEY = 'blackjack:e2e-shoe';
const PLAY_SHOE = [
  { suit: 'spades', rank: 'K', faceUp: true },
  { suit: 'hearts', rank: '6', faceUp: true },
  { suit: 'diamonds', rank: 'Q', faceUp: true },
  { suit: 'clubs', rank: '10', faceUp: true },
  { suit: 'hearts', rank: 'K', faceUp: true },
];

const checks = [];
function check(name, pass, detail) {
  checks.push({ name, pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name} — ${detail}`);
}

function overlaps(a, b) {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
}

const browser = await chromium.launch(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {});

// ---------- DESKTOP 1440x900 ----------
const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await desktop.newPage();
await page.addInitScript(([k, cards]) => window.localStorage.setItem(k, JSON.stringify(cards)), [SHOE_KEY, PLAY_SHOE]);
await page.goto(BASE);
await page.waitForSelector('[data-testid="bet-chip-100"]');

await page.getByTestId('bet-chip-100').click();
await page.getByTestId('bet-chip-25').click();
await page.waitForTimeout(700);
const betChips = await page.evaluate(() => document.querySelectorAll('[data-testid="bet-spot-stack"] .chip').length);
check('Valódi tét-felbontás ($125 → 100+25)', betChips === 2, `${betChips} zseton a tétkörben`);

const balances = await page.evaluate(() => document.querySelectorAll('[data-testid="balance-amount"]').length);
check('Egyetlen egyenleg a képernyőn', balances === 1, `${balances} egyenleg-kijelző`);
await page.screenshot({ path: 'docs/visual-live/desktop-betting.png' });

await page.getByTestId('deal-button').click();
await page.getByTestId('action-stand').waitFor({ state: 'visible', timeout: 10000 });
await page.waitForTimeout(400);

const playing = await page.evaluate(() => ({
  value: document.querySelector('[data-testid="player-hand-value-0"]')?.textContent ?? null,
  betOnFelt: !!document.querySelector('.bet-spot .bet-stack'),
  cardWidth: Math.round(document.querySelector('.player-area .card')?.getBoundingClientRect().width ?? 0),
  split: !!document.querySelector('[data-testid="action-split"]'),
  hudTransform: getComputedStyle(document.querySelector('.action-buttons')).transform,
}));
check('Lapérték látszik playing fázisban', playing.value === '20', `érték: "${playing.value}"`);
check('Tét a tétkörben playing fázisban', playing.betOnFelt, String(playing.betOnFelt));
check('Asztal-léptékű lapok (≥ 88px)', playing.cardWidth >= 88, `${playing.cardWidth}px`);
check('Csak szabályos döntés kínálva (K+Q: nincs SPLIT)', !playing.split, `split gomb: ${playing.split}`);
check('Kezelőpult nincs lapítva', playing.hudTransform === 'none', playing.hudTransform);
await page.screenshot({ path: 'docs/visual-live/desktop-playing.png' });

await page.getByTestId('action-stand').click();
await page.getByTestId('game-result-badge-0').waitFor({ timeout: 10000 });
await page.waitForTimeout(900);
const finished = await page.evaluate(() => {
  const rect = (sel) => document.querySelector(sel)?.getBoundingClientRect().toJSON() ?? null;
  return {
    dealerValue: document.querySelector('[data-testid="dealer-value"]')?.textContent,
    bust: !!document.querySelector('.dealer-area__bust'),
    payout: document.querySelector('[data-testid="payout-stack-0"]')?.getAttribute('aria-label') ?? null,
    plaque: rect('.game-result-card'),
    playerCards: rect('.player-area .hand'),
    dealerCards: rect('.dealer-area .hand'),
    speech: document.querySelector('.dealer-speech__bubble')?.textContent ?? null,
  };
});
check('Osztó lapjai felszámolva + BUST bélyeg', finished.bust && finished.dealerValue === '26', `dealer: ${finished.dealerValue}`);
check('Kifizetés a tét mellé kerül', finished.payout === 'Bet: $125', String(finished.payout));
const covers = overlaps(finished.plaque, finished.playerCards) || overlaps(finished.plaque, finished.dealerCards);
check('Eredmény-plakett nem takar lapot', !covers, JSON.stringify({ plaque: finished.plaque }));
check('Az osztó megszólal', !!finished.speech, `mondás: "${finished.speech}"`);
await page.screenshot({ path: 'docs/visual-live/desktop-finished.png' });
await desktop.close();

// ---------- MOBILE 390x844 ----------
const mobile = await browser.newContext({ ...devices['Pixel 5'], viewport: { width: 390, height: 844 } });
const mpage = await mobile.newPage();
await mpage.addInitScript(([k, cards]) => window.localStorage.setItem(k, JSON.stringify(cards)), [SHOE_KEY, PLAY_SHOE]);
await mpage.goto(BASE);
await mpage.waitForSelector('[data-testid="bet-chip-100"]');

const overflow = await mpage.evaluate(() => ({ scrollW: document.documentElement.scrollWidth, innerW: window.innerWidth }));
check('Mobil 390px: nulla vízszintes túlcsordulás', overflow.scrollW <= overflow.innerW, JSON.stringify(overflow));
await mpage.getByTestId('bet-chip-100').click();
await mpage.screenshot({ path: 'docs/visual-live/mobile-betting.png' });

await mpage.getByTestId('deal-button').click();
await mpage.getByTestId('action-stand').waitFor({ state: 'visible', timeout: 10000 });
await mpage.waitForTimeout(400);
const mobileButtons = await mpage.evaluate(() => {
  const buttons = [...document.querySelectorAll('.action-btn')].map((b) => ({
    bottom: b.getBoundingClientRect().bottom,
    clipped: b.scrollWidth > b.clientWidth,
  }));
  return { buttons, vh: window.innerHeight };
});
const inside = mobileButtons.buttons.every((b) => b.bottom <= mobileButtons.vh && !b.clipped);
check('Mobil: döntési gombok a viewporton belül, felirat nem lóg ki', inside, JSON.stringify(mobileButtons));
await mpage.screenshot({ path: 'docs/visual-live/mobile-playing.png' });

await mpage.getByTestId('action-stand').click();
await mpage.getByTestId('game-result-badge-0').waitFor({ timeout: 10000 });
await mpage.waitForTimeout(900);
await mpage.screenshot({ path: 'docs/visual-live/mobile-finished.png' });
await mobile.close();
await browser.close();

const failed = checks.filter((c) => !c.pass);
console.log(`\n===== ${checks.length - failed.length}/${checks.length} elfogadási kritérium teljesül =====`);
process.exit(failed.length ? 1 : 0);
