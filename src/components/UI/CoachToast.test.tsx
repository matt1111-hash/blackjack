import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { CoachToast } from './CoachToast';

describe('CoachToast', () => {
  afterEach(cleanup);

  it('is silent without feedback', () => {
    render(<CoachToast feedback={null} />);
    expect(screen.queryByTestId('coach-feedback')).not.toBeInTheDocument();
  });

  it('names the optimal play and what was played', () => {
    render(<CoachToast feedback={{ played: 'hit', optimal: 'stand', id: 1 }} />);
    expect(screen.getByTestId('coach-feedback')).toHaveTextContent('STAND');
    expect(screen.getByText('you played HIT')).toBeInTheDocument();
  });
});
