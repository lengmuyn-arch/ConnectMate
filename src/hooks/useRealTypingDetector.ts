import { useState, useEffect, useRef, useCallback } from 'react';

export interface KeystrokeInfo {
  key: string;
  timestamp: number;
  intervalMs: number;
}

export interface TypingStats {
  cpm: number; // Characters per minute
  wpm: number; // Words per minute (cpm / 5)
  peakCpm: number;
  totalKeystrokes: number;
  averageIntervalMs: number;
  isTyping: boolean;
  burstCount: number;
  lastKeystrokeTime: number;
}

export const useRealTypingDetector = (options?: {
  enableGlobalListener?: boolean;
  onWarningThresholdChange?: (isWarning: boolean) => void;
}) => {
  const { enableGlobalListener = true, onWarningThresholdChange } = options || {};

  const [stats, setStats] = useState<TypingStats>({
    cpm: 0,
    wpm: 0,
    peakCpm: 0,
    totalKeystrokes: 0,
    averageIntervalMs: 0,
    isTyping: false,
    burstCount: 0,
    lastKeystrokeTime: 0,
  });

  const [recentKeys, setRecentKeys] = useState<KeystrokeInfo[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [detectionMode, setDetectionMode] = useState<'real' | 'simulation'>('real');

  const keystrokesRef = useRef<number[]>([]); // Timestamps within sliding window
  const lastKeyTimeRef = useRef<number>(0);
  const peakCpmRef = useRef<number>(0);
  const totalCountRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Play subtle clicky mechanical switch sound
  const playClickSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Pitch variation for natural typewriter feel
      const freq = 1200 + Math.random() * 400;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {}
  }, [soundEnabled]);

  // Record a real keystroke
  const recordKeystroke = useCallback(
    (keyName: string) => {
      if (detectionMode !== 'real') return;

      const now = Date.now();
      const last = lastKeyTimeRef.current || now;
      const interval = now - last;
      lastKeyTimeRef.current = now;

      totalCountRef.current += 1;
      keystrokesRef.current.push(now);

      // Play audio tactile feedback if enabled
      playClickSound();

      // Keep recent keys history (last 8)
      setRecentKeys((prev) => [
        { key: keyName === ' ' ? 'Space' : keyName, timestamp: now, intervalMs: interval },
        ...prev.slice(0, 7),
      ]);
    },
    [detectionMode, playClickSound]
  );

  // Periodic sliding window calculation (every 100ms)
  useEffect(() => {
    if (detectionMode !== 'real') return;

    const interval = setInterval(() => {
      const now = Date.now();
      // Keep only keystrokes within the last 6 seconds for instantaneous responsiveness
      const WINDOW_MS = 6000;
      keystrokesRef.current = keystrokesRef.current.filter((t) => now - t <= WINDOW_MS);

      const count = keystrokesRef.current.length;
      // CPM = (count / (WINDOW_MS / 1000)) * 60
      const currentCpm = count > 0 ? Math.round((count / (WINDOW_MS / 1000)) * 60) : 0;
      const currentWpm = Math.round(currentCpm / 5);

      if (currentCpm > peakCpmRef.current) {
        peakCpmRef.current = currentCpm;
      }

      const isTypingNow = now - lastKeyTimeRef.current < 2000;

      // Average interval among active strokes
      let avgInterval = 0;
      if (count > 1) {
        const span = keystrokesRef.current[count - 1] - keystrokesRef.current[0];
        avgInterval = Math.round(span / (count - 1));
      }

      setStats({
        cpm: currentCpm,
        wpm: currentWpm,
        peakCpm: peakCpmRef.current,
        totalKeystrokes: totalCountRef.current,
        averageIntervalMs: avgInterval,
        isTyping: isTypingNow,
        burstCount: count,
        lastKeystrokeTime: lastKeyTimeRef.current,
      });

      // Threshold check: over 110 CPM is likely rapid texting/phubbing
      if (onWarningThresholdChange) {
        onWarningThresholdChange(currentCpm > 110);
      }
    }, 120);

    return () => clearInterval(interval);
  }, [detectionMode, onWarningThresholdChange]);

  // Global window key listener
  useEffect(() => {
    if (!enableGlobalListener || detectionMode !== 'real') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't track hotkeys like F5 or Alt+Tab
      if (e.key.startsWith('F') && e.key.length > 1) return;
      if (e.ctrlKey || e.metaKey) return;

      recordKeystroke(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableGlobalListener, detectionMode, recordKeystroke]);

  const resetStats = useCallback(() => {
    keystrokesRef.current = [];
    totalCountRef.current = 0;
    peakCpmRef.current = 0;
    lastKeyTimeRef.current = 0;
    setRecentKeys([]);
    setStats({
      cpm: 0,
      wpm: 0,
      peakCpm: 0,
      totalKeystrokes: 0,
      averageIntervalMs: 0,
      isTyping: false,
      burstCount: 0,
      lastKeystrokeTime: 0,
    });
  }, []);

  return {
    stats,
    recentKeys,
    detectionMode,
    setDetectionMode,
    soundEnabled,
    setSoundEnabled,
    recordKeystroke,
    resetStats,
  };
};
