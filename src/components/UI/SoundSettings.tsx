import { motion } from 'framer-motion';
import { useSound } from '../../hooks/useSound';
import { useVolume } from '../../hooks/soundHelpers';
import { useAmbience } from '../../hooks/useAmbience';
import './SoundSettings.css';

interface SoundSettingsProps {
  /** Osztó-hang (TTS) bekapcsolva? */
  voiceEnabled?: boolean;
  onToggleVoice?: () => void;
}

export function SoundSettings({ voiceEnabled = true, onToggleVoice }: SoundSettingsProps) {
  const { isMuted, toggleMute } = useSound();
  const { volume, setVolume, increaseVolume, decreaseVolume } = useVolume();
  const ambience = useAmbience();

  return (
    <div className="sound-settings">
      {onToggleVoice && (
        <button
          className={`sound-settings__voice-btn ${voiceEnabled ? '' : 'sound-settings__voice-btn--off'}`}
          onClick={onToggleVoice}
          aria-label={voiceEnabled ? 'Mute dealer voice' : 'Unmute dealer voice'}
          aria-pressed={voiceEnabled}
          title="Dealer voice"
        >
          <span className="sound-settings__icon" aria-hidden="true">
            {voiceEnabled ? '🗣' : '🤐'}
          </span>
        </button>
      )}

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
        <button className="sound-settings__volume-btn" onClick={decreaseVolume} aria-label="Decrease volume">
          −
        </button>

        <div className="sound-settings__slider-container">
          <motion.div className="sound-settings__slider-track" initial={false}>
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

        <button className="sound-settings__volume-btn" onClick={increaseVolume} aria-label="Increase volume">
          +
        </button>
      </div>

      <div className="sound-settings__ambience">
        <span className="sound-settings__ambience-label" aria-hidden="true">
          AMB
        </span>
        <div className="sound-settings__slider-container sound-settings__slider-container--narrow">
          <motion.div className="sound-settings__slider-track" initial={false}>
            <motion.div
              className="sound-settings__slider-fill sound-settings__slider-fill--ambience"
              initial={false}
              animate={{ width: `${(ambience.enabled ? ambience.level : 0) * 100}%` }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          </motion.div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={ambience.enabled ? ambience.level : 0}
            onChange={(e) => ambience.setLevel(parseFloat(e.target.value))}
            className="sound-settings__slider-input"
            aria-label="Ambience volume"
          />
        </div>
      </div>
    </div>
  );
}
