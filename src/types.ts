export type TabType = 'home' | 'sync' | 'activities' | 'bakery' | 'rewards' | 'journal';

export type ActivityTab = 'friends' | 'family';
export type MoodMode = 'introvert' | 'extrovert';
export type RewardsSubTab = 'garden' | 'menu' | 'pets' | 'charity' | 'family';

export interface CalendarEvent {
  id: string;
  title: string;
  dayTime: string;
  type: 'exam' | 'tea' | 'report' | 'custom';
  icon: string;
  bgColor: string; // '#F4BAB3' | '#DFB2FA' | '#CFE3DC'
  isDeadline?: boolean;
}

export interface NearbyBluetoothDevice {
  id: string;
  name: string;
  rssi: number; // dBm, e.g. -54 is ~0.8m, -72 is ~2.0m
  distanceMeters: number;
  status: 'focused' | 'talking' | 'phubbing';
  isVerifiedSpeaker: boolean;
  deviceType?: 'phone' | 'watch' | 'laptop' | 'beacon';
}

export interface PeerStatus {
  id: string;
  name: string;
  emoji: string;
  status: 'focused' | 'sneaking' | 'distracted';
  progress?: number; // for bakery Pomodoro (e.g. 77%)
  distanceMeters?: number;
  rssi?: number;
  connected?: boolean;
}

export interface GardenPlot {
  id: number;
  stage: 0 | 25 | 50 | 75 | 100; // 0=seed, 25=sprout, 50=stem, 75=bud, 100=bloom
}

export interface MenuItem {
  id: string;
  name: string;
  icon: string;
  cost: number;
}

export interface PetData {
  id: string;
  name: string;
  species: string;
  avatar: string;
  hunger: number; // 0 to 100
  happiness: number; // 0 to 100
  isAdopted: boolean;
  cost?: number;
}

export interface CharityPin {
  id: string;
  name: string;
  icon: string;
  cost: number;
  description: string;
  donated: boolean;
  coords: { x: number; y: number }; // percentage on map
}

export interface FamilyTask {
  id: string;
  title: string;
  description: string;
  icon: string;
  pin: string;
  isCompleted: boolean;
  rewardStars: number;
}

export interface FamilyReward {
  milestone: number;
  title: string;
  icon: string;
  isRedeemed: boolean;
}

export interface ToastMessage {
  id: string;
  message: string;
  type?: 'success' | 'warning' | 'info' | 'error';
  undoAction?: () => void;
}

export interface AudioFrequencyAnalysis {
  fundamental_frequency_f0_hz: number;
  spectral_centroid_hz: number;
  spectral_bandwidth_hz: number;
  spectral_rolloff_hz: number;
  zero_crossing_rate: number;
  rms_energy: number;
  volume_db: number;
  chroma_pitch_12: number[];
  mfcc_13: number[];
}

export interface VoiceDirectionAnalysis {
  angle_degrees: number;
  direction_label: string;
  direction_type: 'direct_facing' | 'facing_screen' | 'angled_left' | 'angled_right';
  confidence_score: number;
}

export interface MLClassificationAnalysis {
  predicted_label: string;
  predicted_id: 'direct_conversation' | 'phubbing_speech' | 'ambient_noise' | 'silence';
  badge: string;
  status_text: string;
  confidence_percent: number;
  probabilities: {
    direct_conversation: number;
    phubbing_speech: number;
    ambient_noise: number;
    silence: number;
  };
  phubbing_risk_percent: number;
  kmeans_cluster_distribution: number[];
}

export interface SpeakerVerificationAnalysis {
  speaker_count: number;
  speaker1_f0_hz: number;
  speaker2_f0_hz: number;
  turn_taking_ratio: number;
  is_two_or_more_speakers: boolean;
  truth_verdict: string;
}

export interface AudioAnalysisResult {
  success: boolean;
  engine: string;
  python_version: string;
  librosa_version: string;
  scikit_learn_version?: string;
  p_conv?: number;
  speaker_verification?: SpeakerVerificationAnalysis;
  frequency_analysis: AudioFrequencyAnalysis;
  voice_direction: VoiceDirectionAnalysis;
  ml_classification: MLClassificationAnalysis;
}

export interface UserVoiceProfile {
  calibrated: boolean;
  pitchHz: number;
  variance: number; // pitch tolerance in Hz, e.g. 25 Hz
  calibratedAt?: number;
  userName: string;
}

export type PhubbingLevel = 'none' | 'low' | 'medium' | 'high';
export type BehaviorSeverity = 'light' | 'moderate' | 'heavy'; // 3 Mức độ: Nhẹ, Trung Bình, Nặng
export type PhoneUsageState = 'idle' | 'glance' | 'active' | 'exempt';
export type PhubbingAction = '-' | 'ghi nhận' | 'rung nhẹ' | 'gợi ý chủ đề trò chuyện';


