import './ActionButtons.css';

interface ActionButtonsProps {
  onHit: () => void;
  onStand: () => void;
  onDouble?: () => void;
  onSplit?: () => void;
  disabled?: boolean;
  canDouble?: boolean;
  canSplit?: boolean;
}

interface ActionSpec {
  key: string;
  label: string;
  shortcut: string;
  testId: string;
  onClick: () => void;
}

/**
 * Döntési gombok egyetlen anyagból (lakk + réz). A nem elérhető döntés nem
 * jelenik meg — a pult csak azt kínálja, ami szabályosan választható.
 */
export function ActionButtons({
  onHit,
  onStand,
  onDouble,
  onSplit,
  disabled = false,
  canDouble = false,
  canSplit = false,
}: ActionButtonsProps) {
  const specs: ActionSpec[] = [
    { key: 'hit', label: 'HIT', shortcut: 'H', testId: 'action-hit', onClick: onHit },
    { key: 'stand', label: 'STAND', shortcut: 'S', testId: 'action-stand', onClick: onStand },
  ];
  if (onDouble && canDouble) {
    specs.push({ key: 'double', label: 'DOUBLE', shortcut: 'D', testId: 'action-double', onClick: onDouble });
  }
  if (onSplit && canSplit) {
    specs.push({ key: 'split', label: 'SPLIT', shortcut: 'P', testId: 'action-split', onClick: onSplit });
  }

  return (
    <div className="action-buttons" role="group" aria-label="Decisions">
      {specs.map((spec) => (
        <button
          key={spec.key}
          className={`action-btn action-btn--${spec.key}`}
          onClick={spec.onClick}
          disabled={disabled}
          data-testid={spec.testId}
          aria-label={spec.label.charAt(0) + spec.label.slice(1).toLowerCase()}
          aria-keyshortcuts={spec.shortcut}
        >
          <span className="action-btn__label">{spec.label}</span>
          <span className="action-btn__key" aria-hidden="true">
            {spec.shortcut}
          </span>
        </button>
      ))}
    </div>
  );
}
