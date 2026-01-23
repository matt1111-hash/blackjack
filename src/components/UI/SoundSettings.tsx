import { motion } from 'framer-motion';
import { useSound, useVolume } from '../../hooks/useSound';
import './SoundSettings.css';

export function SoundSettings() {
  const { isMuted, toggleMute } = useSound();
  const { volume, setVolume, increaseVolume, decreaseVolume } = useVolume();

  return (
    <div className="sound-settings">
      <button
        className={`sound-settings__mute-btn ${isMuted ? 'sound-settings__mute-btn--muted' : ''}`}
        onClick={toggleMute}
        aria-label={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? (
          <span className="sound-settings__icon">🔇</span>
        ) : (
          <span className="sound-settings__icon">🔊</span>
        )}
      </button>

      <div className="sound-settings__volume">
        <button
          className="sound-settings__volume-btn"
          onClick={decreaseVolume}
          aria-label="Decrease volume"
        >
          −
        </button>

        <div className="sound-settings__slider-container">
          <motion.div
            className="sound-settings__slider-track"
            initial={false}
          >
            <motion.div
              className="sound-settings__slider-fill"
              initial={false}
              animate={{ width: `${volume * 100}%` }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          </motion.div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="sound-settings__slider-input"
            aria-label="Volume"
          />
        </div>

        <button
          className="sound-settings__volume-btn"
          onClick={increaseVolume}
          aria-label="Increase volume"
        >
          +
        </button>
      </div>
    </div>
  );
}
