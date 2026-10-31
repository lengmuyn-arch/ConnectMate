/**
 * ConnectMate - Native Bridge for Android UsageStatsManager & Zero-Persistence Audio
 *
 * Handles the boundary between Web/PWA and Native Android (Capacitor/Kotlin):
 * 1. Checks if running inside native Android shell.
 * 2. On Native Android: Calls `UsageStatsManager` via Capacitor Bridge to get foreground app packageName.
 * 3. Categorizes app into Group 0 (Study/Productivity) or Group 1 (Entertainment/Social/Game).
 * 4. On Web/PWA: Falls back gracefully with real device sensor detection (visibilitychange, accelerometer, mic VAD).
 */

export interface AppCategoryInfo {
  packageName: string;
  appName: string;
  group: 0 | 1; // 0 = Study/Safe, 1 = Distraction/Phubbing Risk
  categoryLabel: string;
  icon: string;
  isStudyExempt: boolean;
}

// Comprehensive database of popular Vietnamese high school apps
export const APP_DIRECTORY: Record<string, AppCategoryInfo> = {
  // Group 0: Study & Productivity (Safe, Exempt from Phubbing alerts)
  'com.zing.zalo': {
    packageName: 'com.zing.zalo',
    appName: 'Zalo (Học tập & Liên lạc)',
    group: 0,
    categoryLabel: 'Nhóm 0 - Trao đổi học tập',
    icon: '💬',
    isStudyExempt: true,
  },
  'com.google.android.apps.classroom': {
    packageName: 'com.google.android.apps.classroom',
    appName: 'Google Classroom',
    group: 0,
    categoryLabel: 'Nhóm 0 - Lớp học trực tuyến',
    icon: '🏫',
    isStudyExempt: true,
  },
  'notion.id': {
    packageName: 'notion.id',
    appName: 'Notion (Ghi chép)',
    group: 0,
    categoryLabel: 'Nhóm 0 - Ghi chép học tập',
    icon: '📓',
    isStudyExempt: true,
  },
  'com.google.android.apps.docs': {
    packageName: 'com.google.android.apps.docs',
    appName: 'Google Docs / Drive',
    group: 0,
    categoryLabel: 'Nhóm 0 - Tài liệu ôn thi',
    icon: '📄',
    isStudyExempt: true,
  },
  'com.quizlet.quizletandroid': {
    packageName: 'com.quizlet.quizletandroid',
    appName: 'Quizlet (Flashcard từ vựng)',
    group: 0,
    categoryLabel: 'Nhóm 0 - Ôn thi từ vựng',
    icon: '📇',
    isStudyExempt: true,
  },
  'com.duolingo': {
    packageName: 'com.duolingo',
    appName: 'Duolingo (Học ngoại ngữ)',
    group: 0,
    categoryLabel: 'Nhóm 0 - Học ngoại ngữ',
    icon: '🦉',
    isStudyExempt: true,
  },

  // Group 1: Entertainment, Social Media, Gaming (High Phubbing Risk during conversation)
  'com.ss.android.ugc.trill': {
    packageName: 'com.ss.android.ugc.trill',
    appName: 'TikTok',
    group: 1,
    categoryLabel: 'Nhóm 1 - Video ngắn / Giải trí',
    icon: '🎵',
    isStudyExempt: false,
  },
  'com.facebook.katana': {
    packageName: 'com.facebook.katana',
    appName: 'Facebook',
    group: 1,
    categoryLabel: 'Nhóm 1 - Mạng xã hội',
    icon: '📘',
    isStudyExempt: false,
  },
  'com.instagram.android': {
    packageName: 'com.instagram.android',
    appName: 'Instagram / Threads',
    group: 1,
    categoryLabel: 'Nhóm 1 - Mạng xã hội',
    icon: '📸',
    isStudyExempt: false,
  },
  'com.google.android.youtube': {
    packageName: 'com.google.android.youtube',
    appName: 'YouTube',
    group: 1,
    categoryLabel: 'Nhóm 1 - Video giải trí',
    icon: '▶️',
    isStudyExempt: false,
  },
  'com.garena.game.kgvn': {
    packageName: 'com.garena.game.kgvn',
    appName: 'Liên Quân Mobile',
    group: 1,
    categoryLabel: 'Nhóm 1 - Trò chơi điện tử',
    icon: '⚔️',
    isStudyExempt: false,
  },
  'com.dts.freefireth': {
    packageName: 'com.dts.freefireth',
    appName: 'Free Fire',
    group: 1,
    categoryLabel: 'Nhóm 1 - Trò chơi điện tử',
    icon: '🎯',
    isStudyExempt: false,
  },
};

/**
 * Checks if running inside native Android Capacitor app
 */
export const isNativeAndroidApp = (): boolean => {
  if (typeof window === 'undefined') return false;
  const cap = (window as any).Capacitor;
  return Boolean(cap && cap.isNativePlatform && cap.isNativePlatform() && cap.getPlatform() === 'android');
};

/**
 * Request UsageStatsManager permission in Android Settings
 */
export const requestUsageStatsPermission = async (): Promise<boolean> => {
  if (isNativeAndroidApp()) {
    try {
      const cap = (window as any).Capacitor;
      if (cap.Plugins?.UsageStatsPlugin) {
        return await cap.Plugins.UsageStatsPlugin.requestPermission();
      }
    } catch (err) {
      console.warn('Native UsageStats request failed:', err);
    }
  }
  return false;
};

/**
 * Query current foreground app packageName from Android native UsageStatsManager
 */
export const getNativeForegroundApp = async (): Promise<AppCategoryInfo | null> => {
  if (isNativeAndroidApp()) {
    try {
      const cap = (window as any).Capacitor;
      if (cap.Plugins?.UsageStatsPlugin) {
        const res = await cap.Plugins.UsageStatsPlugin.getForegroundApp();
        if (res && res.packageName) {
          const pkg = res.packageName.toLowerCase();
          const known = APP_DIRECTORY[pkg];
          if (known) return known;

          // Infer by package keywords if not in directory
          const isGameOrSocial = pkg.includes('game') || pkg.includes('tiktok') || pkg.includes('facebook') || pkg.includes('insta') || pkg.includes('youtube');
          return {
            packageName: pkg,
            appName: res.appName || pkg,
            group: isGameOrSocial ? 1 : 0,
            categoryLabel: isGameOrSocial ? 'Nhóm 1 - Giải trí' : 'Nhóm 0 - Tiện ích',
            icon: isGameOrSocial ? '📱' : '📂',
            isStudyExempt: !isGameOrSocial,
          };
        }
      }
    } catch (err) {
      console.warn('Failed to query native UsageStats:', err);
    }
  }
  return null;
};

// Audio context for gentle non-intrusive haptic feedback ping
let audioHapticCtx: AudioContext | null = null;

const playGentleHapticTone = (pattern: 'gentle' | 'warning' | 'alert') => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    if (!audioHapticCtx || audioHapticCtx.state === 'closed') {
      audioHapticCtx = new AudioCtx();
    }
    if (audioHapticCtx.state === 'suspended') {
      audioHapticCtx.resume().catch(() => {});
    }
    const osc = audioHapticCtx.createOscillator();
    const gain = audioHapticCtx.createGain();
    const now = audioHapticCtx.currentTime;

    osc.type = 'sine';
    if (pattern === 'gentle') {
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(360, now + 0.12);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(audioHapticCtx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
    } else {
      osc.frequency.setValueAtTime(540, now);
      osc.frequency.exponentialRampToValueAtTime(420, now + 0.20);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(audioHapticCtx.destination);
      osc.start(now);
      osc.stop(now + 0.23);
    }
  } catch {}
};

/**
 * Triggers physical haptic vibration pulse for alerts & notifications
 */
export const triggerHapticVibration = (pattern: 'gentle' | 'warning' | 'alert' = 'gentle'): void => {
  if (typeof window === 'undefined') return;

  // 1. Web Haptic Vibration API
  if ('navigator' in window && 'vibrate' in navigator) {
    try {
      if (pattern === 'gentle') {
        navigator.vibrate([100, 60, 100]);
      } else if (pattern === 'warning') {
        navigator.vibrate([160, 70, 160]);
      } else if (pattern === 'alert') {
        navigator.vibrate([220, 80, 220, 80, 280]);
      }
    } catch (err) {
      console.warn('Web vibration error:', err);
    }
  }

  // 2. Gentle tactile audio ping (crucial for browsers/OS without physical vibration motor)
  playGentleHapticTone(pattern);

  // 3. Native Capacitor Haptics plugin fallback
  const cap = (window as any).Capacitor;
  if (cap?.Plugins?.Haptics) {
    try {
      if (pattern === 'gentle') {
        cap.Plugins.Haptics.impact({ style: 'LIGHT' });
      } else if (pattern === 'warning') {
        cap.Plugins.Haptics.impact({ style: 'MEDIUM' });
      } else if (pattern === 'alert') {
        cap.Plugins.Haptics.notification({ type: 'WARNING' });
      }
    } catch (err) {
      console.warn('Native haptics error:', err);
    }
  }
};

