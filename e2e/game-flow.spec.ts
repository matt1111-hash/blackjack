import { expect, test, type Page } from '@playwright/test';

type TestCard = {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
  faceUp: boolean;
};

const E2E_SHOE_STORAGE_KEY = 'blackjack:e2e-shoe';

/** Set predetermined shoe, navigate, place bet, and deal. */
async function launchScenario(page: Page, shoe: TestCard[]): Promise<void> {
  await page.addInitScript(([storageKey, cards]) => {
    window.localStorage.setItem(storageKey, JSON.stringify(cards));
  }, [E2E_SHOE_STORAGE_KEY, shoe]);

  await page.goto('/');
  await page.getByTestId('bet-chip-100').click();
  await page.getByTestId('deal-button').click();
}

// ---------------------------------------------------------------------------
// Existing scenarios (kept for regression)
// ---------------------------------------------------------------------------

test('stand resolves to a win when the dealer busts', async ({ page }) => {
  await launchScenario(page, [
    { suit: 'spades', rank: 'K', faceUp: true },
    { suit: 'hearts', rank: '6', faceUp: true },
    { suit: 'clubs', rank: 'Q', faceUp: true },
    { suit: 'diamonds', rank: '10', faceUp: true },
    { suit: 'hearts', rank: 'K', faceUp: true },
  ]);

  await page.getByTestId('action-stand').click();

  await expect(page.getByTestId('game-result-badge-0')).toHaveText('WIN');
  await expect(page.getByTestId('dealer-value')).toHaveText('26');
});

test('hit resolves to a loss when the player busts', async ({ page }) => {
  await launchScenario(page, [
    { suit: 'spades', rank: '9', faceUp: true },
    { suit: 'hearts', rank: '7', faceUp: true },
    { suit: 'clubs', rank: '7', faceUp: true },
    { suit: 'diamonds', rank: '8', faceUp: true },
    { suit: 'clubs', rank: '10', faceUp: true },
  ]);

  await page.getByTestId('action-hit').click();

  await expect(page.getByTestId('player-hand-value-0')).toHaveText('BUST');
  await expect(page.getByTestId('game-result-badge-0')).toHaveText('LOSE');
});

// ---------------------------------------------------------------------------
// New critical-flow scenarios
// ---------------------------------------------------------------------------

test('blackjack pays 3:2 on natural 21', async ({ page }) => {
  // Shoe: p1=K, d1=6, p2=A, d2=10(hole)
  // Player: K+A = 21 (blackjack), game ends immediately
  await launchScenario(page, [
    { suit: 'spades', rank: 'K', faceUp: true },
    { suit: 'hearts', rank: '6', faceUp: true },
    { suit: 'clubs', rank: 'A', faceUp: true },
    { suit: 'diamonds', rank: '10', faceUp: true },
  ]);

  await expect(page.getByTestId('game-result-badge-0')).toHaveText('BLACKJACK');
});

test('double down doubles the bet and resolves to win', async ({ page }) => {
  // Shoe: p1=8, d1=6, p2=2, d2=10(hole), extra=A(player), K(dealer bust)
  // Player: 8+2=10 → double → +A = 21
  // Dealer: 6+10=16 → hit K=26 bust
  await launchScenario(page, [
    { suit: 'spades', rank: '8', faceUp: true },
    { suit: 'hearts', rank: '6', faceUp: true },
    { suit: 'clubs', rank: '2', faceUp: true },
    { suit: 'diamonds', rank: '10', faceUp: true },
    { suit: 'spades', rank: 'A', faceUp: true },
    { suit: 'spades', rank: 'K', faceUp: true },
  ]);

  await page.getByTestId('action-double').click();

  await expect(page.getByTestId('game-result-badge-0')).toHaveText('WIN');
});

test('split creates two hands and both win when dealer busts', async ({ page }) => {
  // Shoe: p1=K, d1=6, p2=K(same rank), d2=10(hole)
  // Split: hand1=[K,9]=19, hand2=[K,Q]=20
  // Dealer: 6+10=16 → hit 7=23 bust
  await launchScenario(page, [
    { suit: 'spades', rank: 'K', faceUp: true },
    { suit: 'hearts', rank: '6', faceUp: true },
    { suit: 'clubs', rank: 'K', faceUp: true },
    { suit: 'diamonds', rank: '10', faceUp: true },
    { suit: 'spades', rank: '9', faceUp: true },
    { suit: 'spades', rank: 'Q', faceUp: true },
    { suit: 'spades', rank: '7', faceUp: true },
  ]);

  await page.getByTestId('action-split').click();
  await page.getByTestId('action-stand').click();
  await page.getByTestId('action-stand').click();

  await expect(page.getByTestId('game-result-badge-0')).toHaveText('WIN');
  await expect(page.getByTestId('game-result-badge-1')).toHaveText('WIN');
});

test('insurance buy protects against dealer blackjack', async ({ page }) => {
  // Shoe: p1=K, d1=A(dealer shows Ace), p2=Q, d2=K(hole, dealer BJ)
  // Player: K+Q=20, Dealer: A+K=21 (blackjack)
  // Insurance pays 2:1 → net zero loss
  await launchScenario(page, [
    { suit: 'spades', rank: 'K', faceUp: true },
    { suit: 'hearts', rank: 'A', faceUp: true },
    { suit: 'clubs', rank: 'Q', faceUp: true },
    { suit: 'diamonds', rank: 'K', faceUp: true },
  ]);

  await page.getByTestId('insurance-buy').click();

  await expect(page.getByTestId('game-result-badge-0')).toHaveText('LOSE');
});

test('insurance decline allows continued play', async ({ page }) => {
  // Shoe: p1=K, d1=A(dealer shows Ace), p2=Q, d2=8(hole, no BJ)
  // Decline → phase=playing → stand → dealer: A+8=19, player 20 wins
  await launchScenario(page, [
    { suit: 'spades', rank: 'K', faceUp: true },
    { suit: 'hearts', rank: 'A', faceUp: true },
    { suit: 'clubs', rank: 'Q', faceUp: true },
    { suit: 'diamonds', rank: '8', faceUp: true },
    { suit: 'spades', rank: '7', faceUp: true },
  ]);

  await page.getByTestId('insurance-decline').click();
  await page.getByTestId('action-stand').click();

  await expect(page.getByTestId('game-result-badge-0')).toHaveText('WIN');
});

test('full round cycle: deal → finish → new round → deal again', async ({ page }) => {
  const shoe = [
    { suit: 'spades', rank: 'K', faceUp: true },
    { suit: 'hearts', rank: '6', faceUp: true },
    { suit: 'clubs', rank: 'Q', faceUp: true },
    { suit: 'diamonds', rank: '10', faceUp: true },
    { suit: 'hearts', rank: 'K', faceUp: true },
  ];

  await page.addInitScript(([storageKey, cards]) => {
    window.localStorage.setItem(storageKey, JSON.stringify(cards));
  }, [E2E_SHOE_STORAGE_KEY, shoe]);

  await page.goto('/');

  // Round 1: bet → deal → stand → win
  await page.getByTestId('bet-chip-100').click();
  await page.getByTestId('deal-button').click();
  await page.getByTestId('action-stand').click();
  await expect(page.getByTestId('game-result-badge-0')).toHaveText('WIN');

  // New round — back to betting state
  await page.getByTestId('new-round-button').click();
  await expect(page.getByTestId('bet-chip-100')).toBeVisible();

  // Round 2: same shoe (reshuffled from localStorage), same outcome
  await page.getByTestId('bet-chip-100').click();
  await page.getByTestId('deal-button').click();
  await page.getByTestId('action-stand').click();
  await expect(page.getByTestId('game-result-badge-0')).toHaveText('WIN');
});
