import { motion, type Variants } from 'framer-motion';
import type { ChipValue } from '../../types';
import { Chip } from './Chip';
import './ChipAnimations.css';

// Chip stack animation - 3D enhanced
const chipStackVariants: Variants = {
  hidden: {
    y: -30,
    z: 50,
    opacity: 0,
    scale: 0.8,
  },
  visible: (index: number) => ({
    y: 0,
    z: 0,
    opacity: 1,
    scale: 1,
    transition: {
      delay: index * 0.05,
      type: 'spring' as const,
      stiffness: 300,
      damping: 15,
    },
  }),
};

// Winning chip motion - 3D enhanced
const winChipVariants: Variants = {
  initial: {
    scale: 1,
    y: 0,
    z: 0,
  },
  win: {
    scale: [1, 1.2, 1],
    y: [0, -20, 0],
    z: [0, 60, 0],
    transition: {
      duration: 0.5,
      ease: 'easeInOut' as const,
    },
  },
};

// Losing chip motion - internal only
const loseChipVariants: Variants = {
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
  const offset = vertical ? 7 : 6; /* Increased for better 3D stack effect */

  return (
    <div className="animated-chip-stack" style={{ transformStyle: 'preserve-3d' } as React.CSSProperties}>
      {chips.map((chip, index) => {
        const animate = animateWin ? 'win' : animateLose ? 'lose' : undefined;

        return (
          <motion.div
            key={chip.id}
            className="chip-stack-item"
            style={{ [vertical ? 'bottom' : 'right']: index * offset, transformStyle: 'preserve-3d' } as React.CSSProperties}
            custom={index}
            variants={chipStackVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              variants={animateWin ? winChipVariants : animateLose ? loseChipVariants : undefined}
              animate={animate}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <Chip value={chip.value} />
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}
