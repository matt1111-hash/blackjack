import { expect, test } from '@playwright/test';

type TestCard = {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
  faceUp: boolean;
};

const E2E_SHOE_STORAGE_KEY = 'blackjack:e2e-shoe';

async function launchScenario(page: Parameters<typeof test>[0]['page'], shoe: TestCard[]): Promise<void> {
  await page.addInitScript(([storageKey, cards]) => {
    window.localStorage.setItem(storageKey, JSON.stringify(cards));
  }, [E2E_SHOE_STORAGE_KEY, shoe]);

  await page.goto('/');
  await page.getByTestId('bet-chip-100').click();
  await page.getByTestId('deal-button').click();
}

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
