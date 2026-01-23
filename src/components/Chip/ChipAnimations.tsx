import { motion } from 'framer-motion';
import type { ChipValue } from '../../types';
import { CHIP_COLORS } from '../../types';
import { Chip } from './Chip';
import './ChipAnimations.css';

// Chip placement animation variants - internal only
const chipPlaceVariants = {
  initial: {
    y: -200,
    x: 0,
    scale: 0.5,
    opacity: 0,
    rotate: -30,
  },
  placed: {
    y: 0,
    x: 0,
    scale: 1,
    opacity: 1,
    rotate: 0,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 20,
    },
  },
};

// Chip stack animation - internal only
const chipStackVariants = {
  hidden: {
    y: -30,
    opacity: 0,
    scale: 0.8,
  },
  visible: (index: number) => ({
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      delay: index * 0.05,
      type: 'spring',
      stiffness: 300,
      damping: 15,
    },
  }),
};

// Winning chip motion - internal only
const winChipVariants = {
  initial: {
    scale: 1,
    y: 0,
  },
  win: {
    scale: [1, 1.2, 1],
    y: [0, -20, 0],
    transition: {
      duration: 0.5,
      ease: 'easeInOut',
    },
  },
};

// Losing chip motion - internal only
const loseChipVariants = {
  initial: {
    scale: 1,
    opacity: 1,
  },
  lose: {
    scale: 0.8,
    opacity: 0,
    x: 50,
    transition: {
      duration: 0.3,
    },
  },
};

interface ChipButtonProps {
  value: ChipValue;
  onClick?: () => void;
  disabled?: boolean;
}

export function ChipButton({ value, onClick, disabled }: ChipButtonProps) {
  const color = CHIP_COLORS[value];

  return (
    <motion.button
      className="chip-button"
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.15, y: -5 } : undefined}
      whileTap={!disabled ? { scale: 0.9 } : undefined}
      initial="initial"
      animate="placed"
      variants={chipPlaceVariants}
      style={{ '--chip-color': color } as React.CSSProperties}
    >
      <Chip value={value} />
    </motion.button>
  );
}

interface AnimatedChipStackProps {
  chips: Array<{ value: ChipValue; id: string }>;
  vertical?: boolean;
  animateWin?: boolean;
  animateLose?: boolean;
}

export function AnimatedChipStack({
  chips,
  vertical = true,
  animateWin = false,
  animateLose = false,
}: AnimatedChipStackProps) {
  const offset = vertical ? 4 : 6;

  return (
    <div className="animated-chip-stack">
      {chips.map((chip, index) => {
        const animate = animateWin ? 'win' : animateLose ? 'lose' : undefined;

        return (
          <motion.div
            key={chip.id}
            className="chip-stack-item"
            style={{ [vertical ? 'bottom' : 'right']: index * offset }}
            custom={index}
            variants={chipStackVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              variants={animateWin ? winChipVariants : animateLose ? loseChipVariants : undefined}
              animate={animate}
            >
              <Chip value={chip.value} />
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}
