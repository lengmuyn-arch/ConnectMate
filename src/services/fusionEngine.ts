/**
 * ConnectMate - Multi-Modal Phubbing Fusion Engine (Pipeline A + Pipeline B)
 * Directly ported from Google Colab research notebook:
 * https://colab.research.google.com/drive/1NxzhqHvb1PmTe-foMdQ0-vi9VPvfmnye
 *
 * Pipeline A: Acoustic Conversation Detection (p_conv)
 * Pipeline B: Phone Usage Behavior Detection (idle, glance, active, exempt)
 * FusionEngine: Rule-based smoothing, sliding window filtering, and tiered alerting.
 */

export type PhubbingLevel = 'none' | 'low' | 'medium' | 'high';
export type PhoneUsageState = 'idle' | 'glance' | 'active' | 'exempt';
export type PhubbingAction = '-' | 'ghi nhận' | 'rung nhẹ' | 'gợi ý chủ đề trò chuyện';

export interface FusionConfig {
  window_s: number;         // Window duration in seconds (Default: 3)
  p_conv_thr: number;       // Conversation probability threshold (Default: 0.70)
  conv_k: number;           // Stable conversation: at least conv_k out of conv_n windows (Default: 3)
  conv_n: number;           // (Default: 5)
  act_k: number;            // Stable phone active: at least act_k out of act_n windows (Default: 2)
  act_n: number;            // (Default: 3)
  ratio_low: number;        // Medium phubbing active ratio threshold (Default: 0.20)
  ratio_high: number;       // High phubbing active ratio threshold (Default: 0.50)
  cont_high_s: number;      // Continuous active seconds for High level (Default: 30)
  burst_n: number;          // Rapid glance burst count to promote to active (Default: 4)
  burst_win_s: number;      // Window in seconds to evaluate glance burst (Default: 60)
  min_ep_s: number;         // Minimum conversation episode length to evaluate (Default: 15)
  min_alert_s: number;      // Minimum conversation episode length before triggering any alert (Default: 45)
  min_active_w: number;     // Minimum active windows for Low level (Default: 2)
  cooldown_s: number;       // Cooldown between alerts unless escalated (Default: 120)
  end_after: number;        // Episode ends after end_after consecutive non-conv windows (Default: 3)
}

export const DEFAULT_FUSION_CONFIG: FusionConfig = {
  window_s: 3,
  p_conv_thr: 0.70,
  conv_k: 2,
  conv_n: 3,
  act_k: 2,
  act_n: 3,
  ratio_low: 0.20,
  ratio_high: 0.40,
  cont_high_s: 15, // 15s continuous active threshold (allows checking notifications without false alarm)
  burst_n: 3,
  burst_win_s: 30,
  min_ep_s: 6,
  min_alert_s: 15, // 15s minimum continuous usage before alerting
  min_active_w: 2,
  cooldown_s: 60, // 60s minimum cooldown between alerts
  end_after: 3,
};

// Unified configuration for standard 7-10s real-world detection
export const FAST_TEST_FUSION_CONFIG: FusionConfig = {
  ...DEFAULT_FUSION_CONFIG,
};

export const PHUBBING_LEVELS: PhubbingLevel[] = ['none', 'low', 'medium', 'high'];

export const PHUBBING_ACTIONS: Record<PhubbingLevel, PhubbingAction> = {
  none: '-',
  low: 'ghi nhận',
  medium: 'rung nhẹ',
  high: 'gợi ý chủ đề trò chuyện',
};

export interface FusionStepOutput {
  windowIndex: number;
  timestampSec: number;
  p_conv: number;
  raw_state: PhoneUsageState;
  conv_ok: boolean;
  smoothed_state: PhoneUsageState;
  level: PhubbingLevel;
  alert: boolean;
  action: PhubbingAction;
  episodeActive: boolean;
  episodeDurationSec: number;
  activeRatio: number;
  longestRunSec: number;
  reason: string;
}

export class FusionEngine {
  private c: FusionConfig;
  private trackAlerts: boolean;
  private i: number = -1;
  private convHistory: boolean[] = [];
  private stateHistory: PhoneUsageState[] = [];
  private currentEpisode: { start_i: number; states: PhoneUsageState[] } | null = null;
  public completedEpisodes: Array<{ start_i: number; end_i: number; states: PhoneUsageState[] }> = [];
  private lastAlertTimeSec: number = -1e9;
  private lastLevelIndex: number = 0;

  constructor(config: Partial<FusionConfig> = {}, trackAlerts: boolean = true) {
    this.c = { ...DEFAULT_FUSION_CONFIG, ...config };
    this.trackAlerts = trackAlerts;
  }

  public updateConfig(newConfig: Partial<FusionConfig>) {
    this.c = { ...this.c, ...newConfig };
  }

  public getConfig(): FusionConfig {
    return { ...this.c };
  }

  /**
   * Check if conversation is stable over recent sliding windows
   */
  private isConvStable(): boolean {
    const slice = this.convHistory.slice(-this.c.conv_n);
    const count = slice.filter(Boolean).length;
    return count >= this.c.conv_k;
  }

  /**
   * Smooth phone usage state across sliding window
   */
  private smoothState(): PhoneUsageState {
    const last = this.stateHistory[this.stateHistory.length - 1];
    if (last === 'exempt') return 'exempt';

    const recent = this.stateHistory.slice(-this.c.act_n);
    const activeCount = recent.filter((s) => s === 'active').length;
    if (activeCount >= this.c.act_k) return 'active';

    return last === 'glance' ? 'glance' : 'idle';
  }

  /**
   * Determine phubbing severity level for current conversation episode
   */
  private computeEpisodeLevel(states: PhoneUsageState[]): {
    level: PhubbingLevel;
    activeRatio: number;
    longestRunSec: number;
  } {
    const s = states.filter((x) => x !== 'exempt');
    if (s.length === 0 || s.length * this.c.window_s < this.c.min_ep_s) {
      return { level: 'none', activeRatio: 0, longestRunSec: 0 };
    }

    // Burst of glances converted to active
    const w = Math.max(1, Math.floor(this.c.burst_win_s / this.c.window_s));
    const eff = [...s];
    for (let i = 0; i < s.length; i++) {
      if (s[i] === 'glance') {
        const glanceCount = s.slice(Math.max(0, i - w + 1), i + 1).filter((y) => y === 'glance').length;
        if (glanceCount >= this.c.burst_n) {
          eff[i] = 'active';
        }
      }
    }

    const n_act = eff.filter((x) => x === 'active').length;
    const ratio = n_act / eff.length;

    let run = 0;
    let longestRun = 0;
    for (const x of eff) {
      run = x === 'active' ? run + 1 : 0;
      if (run > longestRun) longestRun = run;
    }

    const longestRunSec = longestRun * this.c.window_s;

    if (longestRunSec >= this.c.cont_high_s || ratio > this.c.ratio_high) {
      return { level: 'high', activeRatio: ratio, longestRunSec };
    }
    if (ratio >= this.c.ratio_low) {
      return { level: 'medium', activeRatio: ratio, longestRunSec };
    }
    if (n_act >= this.c.min_active_w) {
      return { level: 'low', activeRatio: ratio, longestRunSec };
    }
    return { level: 'none', activeRatio: ratio, longestRunSec };
  }

  /**
   * Step the engine by 1 window (3 seconds)
   * @param p_conv Probability of conversation from acoustic analysis (0.0 - 1.0)
   * @param state Raw phone usage state ('idle' | 'glance' | 'active' | 'exempt')
   */
  public step(p_conv: number, state: PhoneUsageState): FusionStepOutput {
    this.i += 1;
    const t = this.i * this.c.window_s;

    const isConv = p_conv >= this.c.p_conv_thr;
    this.convHistory.push(isConv);
    this.stateHistory.push(state);

    const conv_ok = this.isConvStable();
    const sm = this.smoothState();

    if (this.currentEpisode === null && conv_ok) {
      this.currentEpisode = { start_i: this.i, states: [] };
      this.lastLevelIndex = 0;
    }

    let level: PhubbingLevel = 'none';
    let alert = false;
    let action: PhubbingAction = '-';
    let activeRatio = 0;
    let longestRunSec = 0;
    let reason = 'Đang ở trạng thái bình thường';
    let epDuration = 0;

    if (this.currentEpisode !== null) {
      this.currentEpisode.states.push(sm);
      epDuration = this.currentEpisode.states.length * this.c.window_s;

      const evaluated = this.computeEpisodeLevel(this.currentEpisode.states);
      level = evaluated.level;
      activeRatio = evaluated.activeRatio;
      longestRunSec = evaluated.longestRunSec;

      if (this.trackAlerts) {
        const curLevelIdx = PHUBBING_LEVELS.indexOf(level);
        const isEscalating = curLevelIdx > this.lastLevelIndex;

        // Anti-false-positive checks:
        // 1. Current smoothed state must actually be active (not idle, not single glance, not exempt)
        // 2. Episode has lasted at least min_alert_s (45s)
        // 3. Level is medium or high
        // 4. Either escalating (up=true) or cooldown_s (120s) has elapsed
        const meetsMinDuration = epDuration >= this.c.min_alert_s;
        const meetsCooldown = isEscalating || t - this.lastAlertTimeSec >= this.c.cooldown_s;

        if (sm === 'active' && (level === 'medium' || level === 'high') && meetsMinDuration && meetsCooldown) {
          alert = true;
          action = PHUBBING_ACTIONS[level];
          this.lastAlertTimeSec = t;
          this.lastLevelIndex = curLevelIdx;
          reason =
            level === 'high'
              ? `Phát hiện dùng điện thoại liên tục (${longestRunSec}s hoặc ${(activeRatio * 100).toFixed(0)}% thời lượng) trong lúc có hội thoại trực tiếp.`
              : `Tỷ lệ thao tác điện thoại đạt ${(activeRatio * 100).toFixed(0)}% trong cuộc trò chuyện.`;
        } else if (!meetsMinDuration && (level === 'medium' || level === 'high')) {
          reason = `Đang theo dõi phiên hội thoại (${epDuration}s / tối thiểu ${this.c.min_alert_s}s để chống nhắc sai).`;
        } else if (level === 'low') {
          reason = 'Mức thấp: Chỉ ghi nhận nhật ký tập trung, không làm gián đoạn người dùng.';
        } else if (sm === 'glance') {
          reason = 'Liếc thông báo nhanh (<6s) hợp lệ, không tính là Phubbing.';
        } else if (sm === 'exempt') {
          reason = 'Ứng dụng học tập / cuộc gọi khẩn cấp (Miễn trừ kiểm tra).';
        }
      }

      // Check if conversation has ended for end_after consecutive windows
      const recentConv = this.convHistory.slice(-this.c.end_after);
      if (recentConv.length >= this.c.end_after && !recentConv.some(Boolean)) {
        this.closeEpisode();
      }
    } else {
      if (sm === 'active') {
        reason = 'Đang dùng điện thoại ở một mình (không có hội thoại trực tiếp) -> Hoàn toàn được phép.';
      } else {
        reason = 'Không gian yên tĩnh / Không có cuộc trò chuyện trực tiếp.';
      }
    }

    return {
      windowIndex: this.i,
      timestampSec: t,
      p_conv,
      raw_state: state,
      conv_ok,
      smoothed_state: sm,
      level,
      alert,
      action,
      episodeActive: this.currentEpisode !== null,
      episodeDurationSec: epDuration,
      activeRatio: Math.round(activeRatio * 100),
      longestRunSec,
      reason,
    };
  }

  private closeEpisode() {
    if (!this.currentEpisode) return;
    const k = this.c.end_after;
    const validStates =
      this.currentEpisode.states.length > k
        ? this.currentEpisode.states.slice(0, -k)
        : this.currentEpisode.states;

    this.completedEpisodes.push({
      start_i: this.currentEpisode.start_i,
      end_i: this.i - k + 1,
      states: validStates,
    });
    this.currentEpisode = null;
  }

  public finish() {
    if (this.currentEpisode) {
      this.completedEpisodes.push({
        start_i: this.currentEpisode.start_i,
        end_i: this.i + 1,
        states: this.currentEpisode.states,
      });
      this.currentEpisode = null;
    }
  }

  public reset() {
    this.i = -1;
    this.convHistory = [];
    this.stateHistory = [];
    this.currentEpisode = null;
    this.completedEpisodes = [];
    this.lastAlertTimeSec = -1e9;
    this.lastLevelIndex = 0;
  }
}
