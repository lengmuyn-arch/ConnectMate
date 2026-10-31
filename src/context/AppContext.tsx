import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  TabType,
  ActivityTab,
  MoodMode,
  RewardsSubTab,
  CalendarEvent,
  PeerStatus,
  NearbyBluetoothDevice,
  GardenPlot,
  MenuItem,
  PetData,
  CharityPin,
  FamilyTask,
  FamilyReward,
  ToastMessage,
  PhoneUsageState,
  PhubbingLevel,
  PhubbingAction,
  UserVoiceProfile,
} from '../types';
import { triggerHapticVibration } from '../services/nativeBridge';
import {
  FusionEngine,
  FusionConfig,
  FusionStepOutput,
  DEFAULT_FUSION_CONFIG,
  FAST_TEST_FUSION_CONFIG,
  PHUBBING_LEVELS,
  PHUBBING_ACTIONS,
} from '../services/fusionEngine';


export interface HabitMemory {
  falsePositiveCount: number;
  trustedPeers: string[];
  learnedStudyHours: number[];
  adaptiveSensitivity: number;
  lastLearnedAt?: number;
}

interface AppContextType {
  currentTab: TabType;
  setCurrentTab: (tab: TabType) => void;
  stars: number;
  addStars: (amount: number, reason?: string) => void;
  spendStars: (amount: number, reason?: string) => boolean;
  toast: ToastMessage | null;
  showToast: (message: string, type?: ToastMessage['type'], undoAction?: () => void) => void;
  dismissToast: () => void;
  
  // Home
  events: CalendarEvent[];
  addEvent: (event: Omit<CalendarEvent, 'id' | 'bgColor'>) => void;
  deleteEvent: (id: string) => void;
  isAwayModalOpen: boolean;
  setIsAwayModalOpen: (open: boolean) => void;
  isAddEventModalOpen: boolean;
  setIsAddEventModalOpen: (open: boolean) => void;

  // Sync
  isBabySproutNapActive: boolean;
  triggerBabySproutNap: () => void;
  babySproutHealth: number; // 0-100%
  typingSpeed: number;
  setTypingSpeed: (speed: number | ((prev: number) => number)) => void;
  appInUse: string;
  setAppInUse: (app: string) => void;
  isWarning: boolean;
  setIsWarning: (warning: boolean) => void;
  typingDetectorMode: 'real' | 'simulation';
  setTypingDetectorMode: (mode: 'real' | 'simulation') => void;
  audioActive: boolean;
  speechRatio: number;
  syncPeers: PeerStatus[];
  phubbingPromptCount: number;
  maxReminderCount: number;
  setMaxReminderCount: (count: number) => void;
  incrementPromptCount: () => number;
  resetPromptCount: () => void;
  isExploreModeActive: boolean;
  setIsExploreModeActive: (active: boolean) => void;
  glanceGracePeriodSeconds: number;
  setGlanceGracePeriodSeconds: (sec: number) => void;
  quickGlanceSuccessCount: number;
  recordQuickGlanceSuccess: () => void;
  isQuickGlanceActive: boolean;
  quickGlanceRemainingSec: number;
  requestBackgroundNotificationPermission: () => Promise<boolean>;
  sendBackgroundNotification: (title: string, body: string) => void;

  // Bluetooth Proximity & Physical Coverage Area (Phubbing context)
  nearbyBluetoothDevices: NearbyBluetoothDevice[];
  isBluetoothMeetupActive: boolean;
  toggleBluetoothMeetup: () => void;
  scanRealBluetoothDevice: () => Promise<void>;
  isBluetoothScanning: boolean;
  bluetoothCoverageStatus: 'in_meetup' | 'alone';
  setBluetoothCoverageStatus: (status: 'in_meetup' | 'alone') => void;
  addCustomNearbyFriend: (name: string, distance?: number) => void;
  removeNearbyDevice: (id: string) => void;
  detectionPreset: 'fast_test' | 'real_world';
  setDetectionPreset: (preset: 'fast_test' | 'real_world') => void;
  testTriggerPhubbingAlert: (reason?: string) => void;

  // Multi-Modal Phubbing Fusion Engine (Pipeline A + B from Colab)
  fusionConfig: FusionConfig;
  updateFusionConfig: (cfg: Partial<FusionConfig>) => void;
  fusionOutput: FusionStepOutput | null;
  pConv: number;
  setPConv: (p: number | ((prev: number) => number)) => void;
  phoneState: PhoneUsageState;
  setPhoneState: (state: PhoneUsageState) => void;
  isExemptStudyMode: boolean;
  setIsExemptStudyMode: (exempt: boolean) => void;
  stepFusionEngine: (p_conv?: number, state?: PhoneUsageState) => FusionStepOutput;
  isPhubbingAlertModalOpen: boolean;
  setIsPhubbingAlertModalOpen: (open: boolean) => void;
  phubbingAlertLevel: PhubbingLevel;
  phubbingAlertReason: string;

  // Adaptive Online Learning & Habit Memory (Anti-False-Alarm System)
  habitMemory: HabitMemory;
  recordFalsePositiveFeedback: (peerName?: string) => void;
  resetHabitMemory: () => void;

  // Personal Voice Calibration (Self-Talk vs Partner Speech)
  myVoiceProfile: UserVoiceProfile;
  calibrateMyVoiceProfile: (pitchHz: number, userName?: string) => void;
  resetMyVoiceProfile: () => void;


  // Activities
  activityTab: ActivityTab;
  setActivityTab: (tab: ActivityTab) => void;
  moodMode: MoodMode;
  setMoodMode: (mode: MoodMode) => void;
  activeActivityDetail: 'none' | 'picture_guess' | 'extrovert_explore';
  setActiveActivityDetail: (detail: 'none' | 'picture_guess' | 'extrovert_explore') => void;
  introvertTopicIndex: number;
  nextIntrovertTopic: () => void;
  isArtSecretRevealed: boolean;
  setIsArtSecretRevealed: (revealed: boolean) => void;
  isHideAndSeekActive: boolean;
  hideAndSeekPhase: 'map' | 'hunting' | 'done';
  startHideAndSeek: () => void;
  stopHideAndSeek: () => void;

  // Family Tasks
  familyTasks: FamilyTask[];
  verifyFamilyTask: (taskId: string, pin: string) => boolean;

  // Bakery (Pomodoro)
  pomodoroMinutes: number;
  pomodoroSeconds: number;
  isPomodoroRunning: boolean;
  startPomodoro: () => void;
  pausePomodoro: () => void;
  resetPomodoro: () => void;
  savedPlayMinutes: number;
  bakeryTaskTitle: string;
  setBakeryTaskTitle: (title: string) => void;
  bakeryPeers: PeerStatus[];

  // Rewards
  rewardsSubTab: RewardsSubTab;
  setRewardsSubTab: (tab: RewardsSubTab) => void;
  
  // Garden
  gardenPlots: GardenPlot[];
  waterPlant: (index: number) => void;
  fertilizePlant: (index: number) => void;
  
  // Menu
  menuItems: MenuItem[];
  redeemedVoucher: MenuItem | null;
  setRedeemedVoucher: (item: MenuItem | null) => void;
  redeemFoodItem: (item: MenuItem) => boolean;

  // Pets
  selectedPetIndex: number;
  setSelectedPetIndex: (idx: number) => void;
  petsList: PetData[];
  feedCurrentPet: () => void;
  playCurrentPet: () => void;
  adoptPet: (petId: string) => void;
  adoptablePets: PetData[];

  // Charity
  charityPins: CharityPin[];
  selectedPin: CharityPin | null;
  setSelectedPin: (pin: CharityPin | null) => void;
  donateToPin: (pinId: string) => void;
  userDonationCount: number;

  // Family Fund
  familyFundStars: number;
  familyRewards: FamilyReward[];
  redeemFamilyReward: (milestone: number) => void;

  // Journal
  journalText: string;
  setJournalText: (txt: string) => void;
  saveJournalEntry: () => void;
  aiReportState: 'relaxed' | 'strict';
  toggleAiReportState: () => void;
  journalSavedToday: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Current tab
  const [currentTab, setCurrentTab] = useState<TabType>('home');

  // Star wallet
  const [stars, setStars] = useState<number>(() => {
    const saved = localStorage.getItem('cm_stars');
    return saved !== null ? Number(saved) : 1250;
  });

  useEffect(() => {
    localStorage.setItem('cm_stars', stars.toString());
  }, [stars]);

  // Toast
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = (message: string, type: ToastMessage['type'] = 'info', undoAction?: () => void) => {
    const id = Date.now().toString();
    setToast({ id, message, type, undoAction });
    setTimeout(() => {
      setToast((curr) => (curr?.id === id ? null : curr));
    }, 4500);
  };

  const dismissToast = () => setToast(null);

  const addStars = (amount: number, reason?: string) => {
    setStars((prev) => prev + amount);
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
    if (reason) {
      showToast(`+${amount} ⭐ ${reason}`, 'success');
    }
  };

  const spendStars = (amount: number, reason?: string): boolean => {
    if (stars < amount) {
      showToast(`Chưa đủ Sao, cần thêm ${(amount - stars).toLocaleString('vi-VN')} Sao nữa! ⭐`, 'error');
      return false;
    }
    setStars((prev) => prev - amount);
    if (reason) {
      showToast(`-${amount} ⭐ ${reason}`, 'info');
    }
    return true;
  };

  // 1. Home Events
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem('cm_events');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return [
      {
        id: '1',
        title: 'Kiểm tra giữa kì Toán',
        dayTime: 'Thứ Năm · 09:00 AM',
        type: 'exam',
        icon: '📝',
        bgColor: '#F4BAB3',
      },
      {
        id: '2',
        title: 'Hẹn trà sữa cùng P.Linh',
        dayTime: 'Thứ Bảy · 03:00 PM',
        type: 'tea',
        icon: '🍿',
        bgColor: '#DFB2FA',
      },
      {
        id: '3',
        title: 'Báo cáo thí nghiệm Vật Lý',
        dayTime: 'Thứ Sáu · Deadline 11:59 PM',
        type: 'report',
        icon: '📚',
        bgColor: '#CFE3DC',
        isDeadline: true,
      },
    ];
  });

  useEffect(() => {
    localStorage.setItem('cm_events', JSON.stringify(events));
  }, [events]);

  const [isAwayModalOpen, setIsAwayModalOpen] = useState(false);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);

  const addEvent = (eventData: Omit<CalendarEvent, 'id' | 'bgColor'>) => {
    const colors = ['#F4BAB3', '#DFB2FA', '#CFE3DC'];
    const nextColor = colors[events.length % colors.length];
    const newEvent: CalendarEvent = {
      id: Date.now().toString(),
      ...eventData,
      bgColor: nextColor,
    };
    setEvents((prev) => [...prev, newEvent]);
    showToast('Đã thêm thẻ mới vào bảng công việc! ✨', 'success');
  };

  const deleteEvent = (id: string) => {
    const eventToDelete = events.find((e) => e.id === id);
    if (!eventToDelete) return;
    setEvents((prev) => prev.filter((e) => e.id !== id));
    showToast(`Đã xóa "${eventToDelete.title}"`, 'info', () => {
      setEvents((prev) => [...prev, eventToDelete]);
    });
  };

  // 2. Sync (Phubbing detection)
  const [typingDetectorMode, setTypingDetectorMode] = useState<'real' | 'simulation'>('real');
  const [typingSpeed, setTypingSpeed] = useState(0);
  const [appInUse, setAppInUse] = useState('Mạng Xã Hội');
  const [isWarning, setIsWarning] = useState(false);
  const [audioActive, setAudioActive] = useState(true);
  const [speechRatio, setSpeechRatio] = useState(7);
  const [babySproutHealth, setBabySproutHealth] = useState(65);
  const [isBabySproutNapActive, setIsBabySproutNapActive] = useState(false);

  // Phubbing Popup Limit & App Exploration Mode (Only remind 1-2 times, then allow free app exploration)
  const [phubbingPromptCount, setPhubbingPromptCount] = useState<number>(0);
  const [maxReminderCount, setMaxReminderCount] = useState<number>(2);
  const [isExploreModeActive, setIsExploreModeActive] = useState<boolean>(false);

  // Quick Glance Grace Period (10s check notification without losing reminder count)
  const [glanceGracePeriodSeconds, setGlanceGracePeriodSeconds] = useState<number>(10);
  const [quickGlanceSuccessCount, setQuickGlanceSuccessCount] = useState<number>(0);
  const [isQuickGlanceActive, setIsQuickGlanceActive] = useState<boolean>(false);
  const [quickGlanceRemainingSec, setQuickGlanceRemainingSec] = useState<number>(0);
  const phoneActiveStartedAtRef = useRef<number>(0);
  const lastAlertFiredAtRef = useRef<number>(0);
  const quickGlanceHistoryRef = useRef<number[]>([]);

  const recordQuickGlanceSuccess = () => {
    const now = Date.now();
    // Track rapid consecutive glances in the last 90 seconds
    quickGlanceHistoryRef.current.push(now);
    quickGlanceHistoryRef.current = quickGlanceHistoryRef.current.filter((t) => now - t <= 90000);

    // If checking notifications too frequently (>= 3 times within 90 seconds):
    if (quickGlanceHistoryRef.current.length >= 3) {
      quickGlanceHistoryRef.current = [];
      triggerHapticVibration('warning');
      setIsPhubbingAlertModalOpen(true);
      showToast('⚠️ Bạn đã kiểm tra thông báo liên tục 3 lần giữa cuộc đối thoại. Hãy tạm gác máy nhé!', 'warning');
      sendBackgroundNotification(
        'ConnectMate Nhắc Nhở 🌸',
        'Bạn đã kiểm tra thông báo liên tục nhiều lần giữa cuộc đối thoại. Hãy tạm gác điện thoại để trò chuyện trọn vẹn nhé!'
      );
      return;
    }

    setQuickGlanceSuccessCount((prev) => prev + 1);
    addStars(5, 'Kiểm tra thông báo nhanh hợp lệ');
    showToast('✨ Kiểm tra thông báo nhanh hợp lệ (<10s)! Không bị tính Phubbing (+5 ⭐)', 'success');
  };

  const requestBackgroundNotificationPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      showToast('Trình duyệt này không hỗ trợ thông báo hệ thống', 'info');
      return false;
    }
    try {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        showToast('🔔 Đã bật thông báo nhắc nhở khi chuyển sang app khác!', 'success');
        return true;
      } else {
        showToast('Chưa cấp quyền thông báo hệ thống', 'info');
        return false;
      }
    } catch {
      return false;
    }
  };

  const sendBackgroundNotification = (title: string, body: string) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    try {
      new Notification(title, {
        body,
        icon: '🌿',
      });
    } catch (err) {
      console.warn('Background notification error:', err);
    }
  };

  const incrementPromptCount = () => {
    const nextCount = phubbingPromptCount + 1;
    setPhubbingPromptCount(nextCount);
    if (nextCount >= maxReminderCount) {
      setIsExploreModeActive(true);
    }
    return nextCount;
  };

  const resetPromptCount = () => {
    setPhubbingPromptCount(0);
    setIsExploreModeActive(false);
    showToast('Đã bật lại chế độ nhắc nhở cảnh báo (2 lần đầu)! ✨', 'info');
  };

  const [syncPeers, setSyncPeers] = useState<PeerStatus[]>([
    { id: '1', name: 'Tiên', emoji: '🌸', status: 'focused' },
    { id: '2', name: 'Minh', emoji: '🦖', status: 'focused' },
    { id: '3', name: 'Phương', emoji: '✨', status: 'sneaking' },
    { id: '4', name: 'Uyên', emoji: '🎸', status: 'focused' },
  ]);

  // Phone usage & Conversation state (Pipeline A + B)
  const [fusionOutput, setFusionOutput] = useState<FusionStepOutput | null>(null);
  const [pConv, setPConv] = useState<number>(0.08); // Baseline: quiet / no conversation (Pipeline A)
  const [phoneState, setPhoneStateInternal] = useState<PhoneUsageState>('idle'); // Pipeline B phone usage

  const setPhoneState = useCallback((state: PhoneUsageState) => {
    setPhoneStateInternal((prev) => {
      const now = Date.now();
      if (state === 'active') {
        if (prev !== 'active' || phoneActiveStartedAtRef.current === 0) {
          phoneActiveStartedAtRef.current = now;
          setIsQuickGlanceActive(true);
          setQuickGlanceRemainingSec(10);
        }
      } else {
        if (prev === 'active' && phoneActiveStartedAtRef.current > 0) {
          const durationSec = (now - phoneActiveStartedAtRef.current) / 1000;
          if (durationSec <= 10) {
            recordQuickGlanceSuccess();
          }
        }
        phoneActiveStartedAtRef.current = 0;
        setIsQuickGlanceActive(false);
        setQuickGlanceRemainingSec(0);
      }
      return state;
    });
  }, []);
  const [isExemptStudyMode, setIsExemptStudyMode] = useState<boolean>(false);
  const [isPhubbingAlertModalOpen, setIsPhubbingAlertModalOpen] = useState<boolean>(false);
  const [phubbingAlertLevel, setPhubbingAlertLevel] = useState<PhubbingLevel>('none');
  const [phubbingAlertReason, setPhubbingAlertReason] = useState<string>('Hệ thống đang đồng bộ 2 luồng A + B...');

  // Bluetooth Proximity & Physical Coverage Area (Phubbing Meetup Context)
  const [bluetoothCoverageStatus, setBluetoothCoverageStatus] = useState<'in_meetup' | 'alone'>(() => {
    return (localStorage.getItem('cm_bluetooth_status') as 'in_meetup' | 'alone') || 'alone';
  });
  const [nearbyBluetoothDevices, setNearbyBluetoothDevices] = useState<NearbyBluetoothDevice[]>(() => {
    const saved = localStorage.getItem('cm_nearby_bluetooth_devices');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [];
  });
  const [isBluetoothScanning, setIsBluetoothScanning] = useState(false);
  const isBluetoothMeetupActive = bluetoothCoverageStatus === 'in_meetup' && nearbyBluetoothDevices.length > 0;

  const toggleBluetoothMeetup = () => {
    setBluetoothCoverageStatus((prev) => {
      const next = prev === 'in_meetup' ? 'alone' : 'in_meetup';
      localStorage.setItem('cm_bluetooth_status', next);
      if (next === 'alone') {
        showToast('Đã chuyển sang: "Ở một mình" (Không kích hoạt cảnh báo Phubbing) 🌿', 'info');
      } else {
        if (nearbyBluetoothDevices.length === 0) {
          const sampleFriends: NearbyBluetoothDevice[] = [
            {
              id: 'ble-linh-iphone',
              name: 'Linh (iPhone - Cùng bàn)',
              rssi: -54,
              distanceMeters: 0.8,
              status: 'talking',
              isVerifiedSpeaker: true,
              deviceType: 'phone',
            },
            {
              id: 'ble-hoang-galaxy',
              name: 'Hoàng (Galaxy - Bên cạnh)',
              rssi: -62,
              distanceMeters: 1.2,
              status: 'focused',
              isVerifiedSpeaker: true,
              deviceType: 'phone',
            },
          ];
          setNearbyBluetoothDevices(sampleFriends);
          localStorage.setItem('cm_nearby_bluetooth_devices', JSON.stringify(sampleFriends));
        }
        showToast('Đã chuyển sang: "Gặp gỡ bạn bè" (Đang quét Bluetooth ~1-3m) 👥', 'success');
      }
      return next;
    });
  };

  const addCustomNearbyFriend = (name: string, distance = 1.0) => {
    const newDev: NearbyBluetoothDevice = {
      id: `ble-${Date.now()}`,
      name,
      rssi: -50 - Math.round(distance * 12),
      distanceMeters: distance,
      status: 'focused',
      isVerifiedSpeaker: true,
      deviceType: 'phone',
    };
    setNearbyBluetoothDevices((prev) => [newDev, ...prev]);
    setBluetoothCoverageStatus('in_meetup');
    showToast(`Đã nhận diện bạn bè qua Bluetooth: ${name} (~${distance}m)! ✨`, 'success');
    addStars(5, 'Kết nối bạn bè qua Bluetooth');
  };

  const removeNearbyDevice = (id: string) => {
    setNearbyBluetoothDevices((prev) => {
      const filtered = prev.filter((d) => d.id !== id);
      if (filtered.length === 0) {
        setBluetoothCoverageStatus('alone');
        showToast('Không còn bạn bè trong vùng Bluetooth. Chuyển về "Ở một mình" 🌿', 'info');
      }
      return filtered;
    });
  };

  // Real Web Bluetooth scanning trigger
  const scanRealBluetoothDevice = async () => {
    setIsBluetoothScanning(true);
    const nav = navigator as any;
    if (!nav.bluetooth) {
      setTimeout(() => {
        setIsBluetoothScanning(false);
        showToast('Web Bluetooth API chưa được bật trên trình duyệt này. Hãy dùng Android Chrome hoặc thêm bạn bè thủ công!', 'info');
      }, 900);
      return;
    }

    try {
      const device = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['generic_access', 'battery_service'],
      });

      if (device) {
        const newDev: NearbyBluetoothDevice = {
          id: device.id || `ble-${Date.now()}`,
          name: device.name || 'Thiết bị Bluetooth đối diện',
          rssi: -58,
          distanceMeters: 0.9,
          status: 'focused',
          isVerifiedSpeaker: true,
          deviceType: 'phone',
        };
        setNearbyBluetoothDevices((prev) => [newDev, ...prev.filter((d) => d.id !== newDev.id)]);
        setBluetoothCoverageStatus('in_meetup');
        showToast(`Đã nhận diện thiết bị Bluetooth thật: ${newDev.name} (~0.9m)! 🎉`, 'success');
        addStars(10, 'Quét thiết bị Bluetooth thành công');
      }
    } catch (err: any) {
      console.warn('Bluetooth request failed or cancelled:', err);
      if (err.name !== 'NotFoundError') {
        showToast('Lỗi Bluetooth: ' + (err.message || 'Không thể kết nối'), 'warning');
      }
    } finally {
      setIsBluetoothScanning(false);
    }
  };

  // Real-time P2P Mesh sync via BroadcastChannel
  useEffect(() => {
    if (!('BroadcastChannel' in window)) return;
    const channel = new BroadcastChannel('connectmate_bluetooth_mesh');
    const myId = 'peer_' + Math.floor(Math.random() * 10000);

    const interval = setInterval(() => {
      try {
        channel.postMessage({
          type: 'BLE_BEACON',
          peerId: myId,
          name: 'Bạn học ConnectMate',
          status: phoneState === 'active' ? 'sneaking' : 'focused',
          rssi: -58,
          distanceMeters: 1.0,
          timestamp: Date.now(),
        });
      } catch {}
    }, 4000);

    channel.onmessage = (event) => {
      if (event.data?.type === 'BLE_BEACON' && event.data.peerId !== myId) {
        const p = event.data;
        setNearbyBluetoothDevices((prev) => {
          const exists = prev.some((d) => d.id === p.peerId);
          if (exists) return prev;
          return [
            {
              id: p.peerId,
              name: p.name,
              rssi: p.rssi,
              distanceMeters: p.distanceMeters,
              status: p.status === 'sneaking' ? 'phubbing' : 'focused',
              isVerifiedSpeaker: true,
              deviceType: 'phone',
            },
            ...prev,
          ];
        });
        setBluetoothCoverageStatus('in_meetup');
      }
    };

    return () => {
      clearInterval(interval);
      try { channel.close(); } catch {}
    };
  }, [phoneState]);

  // Standard Real-World Detection (7-10s warning timing)
  const [detectionPreset, setDetectionPresetState] = useState<'fast_test' | 'real_world'>('real_world');

  // Multi-Modal Phubbing Fusion Engine State (Pipeline A + Pipeline B from Colab)
  const [fusionConfig, setFusionConfig] = useState<FusionConfig>(() => {
    const saved = localStorage.getItem('cm_fusion_config');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return DEFAULT_FUSION_CONFIG; // Default to 7-10s real world configuration
  });

  const setDetectionPreset = (preset: 'fast_test' | 'real_world') => {
    setDetectionPresetState('real_world');
    const cfg = DEFAULT_FUSION_CONFIG;
    setFusionConfig(cfg);
    localStorage.setItem('cm_fusion_config', JSON.stringify(cfg));
    engineRef.current.updateConfig(cfg);
    showToast('🎓 Đã đặt Chế độ Thực tế tiêu chuẩn: Thời gian cảnh báo 7 – 10 giây!', 'info');
  };

  const updateFusionConfig = (cfg: Partial<FusionConfig>) => {
    setFusionConfig((prev) => {
      const next = { ...prev, ...cfg };
      localStorage.setItem('cm_fusion_config', JSON.stringify(next));
      engineRef.current.updateConfig(next);
      return next;
    });
    showToast('Đã lưu cấu hình độ nhạy Fusion Engine! ⚙️', 'success');
  };

  // Adaptive Online Learning & Habit Memory (Persistent LocalStorage)
  const [habitMemory, setHabitMemory] = useState<HabitMemory>(() => {
    const saved = localStorage.getItem('cm_phubbing_habit_memory');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return {
      falsePositiveCount: 0,
      trustedPeers: [],
      learnedStudyHours: [],
      adaptiveSensitivity: 1.0,
    };
  });

  const recordFalsePositiveFeedback = useCallback((peerName?: string) => {
    setHabitMemory((prev) => {
      const currentHour = new Date().getHours();
      const updatedHours = Array.from(new Set([...prev.learnedStudyHours, currentHour]));
      const updatedPeers = peerName ? Array.from(new Set([...prev.trustedPeers, peerName])) : prev.trustedPeers;
      const newSensitivity = Math.max(0.4, Math.round((prev.adaptiveSensitivity - 0.1) * 10) / 10);

      const newMemory: HabitMemory = {
        falsePositiveCount: prev.falsePositiveCount + 1,
        trustedPeers: updatedPeers,
        learnedStudyHours: updatedHours,
        adaptiveSensitivity: newSensitivity,
        lastLearnedAt: Date.now(),
      };
      localStorage.setItem('cm_phubbing_habit_memory', JSON.stringify(newMemory));
      return newMemory;
    });
    showToast('🧠 AI đã ghi nhớ thói quen này để tự động giảm cảnh báo sai!');
  }, [showToast]);

  const resetHabitMemory = useCallback(() => {
    const defaultMem: HabitMemory = {
      falsePositiveCount: 0,
      trustedPeers: [],
      learnedStudyHours: [],
      adaptiveSensitivity: 1.0,
    };
    setHabitMemory(defaultMem);
    localStorage.removeItem('cm_phubbing_habit_memory');
    showToast('🧠 Đã đặt lại bộ nhớ học thói quen AI!', 'info');
  }, [showToast]);

  // Personal Voice Calibration (Self-Talk vs Partner Speech)
  const [myVoiceProfile, setMyVoiceProfile] = useState<UserVoiceProfile>(() => {
    const saved = localStorage.getItem('cm_my_voice_profile');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return {
      calibrated: false,
      pitchHz: 185.0,
      variance: 25.0,
      userName: 'Chủ máy',
    };
  });

  const calibrateMyVoiceProfile = useCallback((pitchHz: number, userName = 'Chủ máy') => {
    const newProfile: UserVoiceProfile = {
      calibrated: true,
      pitchHz: Math.round(pitchHz * 10) / 10,
      variance: 25.0,
      calibratedAt: Date.now(),
      userName,
    };
    setMyVoiceProfile(newProfile);
    localStorage.setItem('cm_my_voice_profile', JSON.stringify(newProfile));
    showToast(`🎤 Đã lưu mẫu giọng chủ máy (${newProfile.pitchHz} Hz)! Từ nay AI sẽ không nhầm khi bạn tự đọc bài/nói một mình ✨`, 'success');
  }, [showToast]);

  const resetMyVoiceProfile = useCallback(() => {
    const resetProfile: UserVoiceProfile = {
      calibrated: false,
      pitchHz: 185.0,
      variance: 25.0,
      userName: 'Chủ máy',
    };
    setMyVoiceProfile(resetProfile);
    localStorage.removeItem('cm_my_voice_profile');
    showToast('Đã xóa mẫu giọng chủ máy', 'info');
  }, [showToast]);

  const engineRef = React.useRef<FusionEngine>(new FusionEngine(fusionConfig));
  const silentActiveWindowsRef = useRef<number>(0);
  const partnerTalkScrollWindowsRef = useRef<number>(0);

  const stepFusionEngine = (customPConv?: number, customState?: PhoneUsageState): FusionStepOutput => {
    const now = Date.now();
    const pc = customPConv !== undefined ? customPConv : pConv;
    const rawSt = customState !== undefined ? customState : phoneState;
    const st = isExemptStudyMode ? 'exempt' : rawSt;

    // Calculate active duration for Quick Glance notification check
    const activeElapsedSec = phoneActiveStartedAtRef.current > 0 ? (now - phoneActiveStartedAtRef.current) / 1000 : 0;
    // Active typing / high cadence (>60 CPM) is active messaging, NOT a passive glance!
    const isTypingActive = typingSpeed > 60;
    const isWithinQuickGlanceWindow = st === 'active' && activeElapsedSec < 10 && !isTypingActive;

    if (isWithinQuickGlanceWindow) {
      const rem = Math.max(1, 10 - Math.floor(activeElapsedSec));
      setQuickGlanceRemainingSec(rem);
      setIsQuickGlanceActive(true);
    } else {
      setIsQuickGlanceActive(false);
      setQuickGlanceRemainingSec(0);
    }

    // Effective state for FusionEngine: if within 10s grace period and not typing, treat as 'glance' (safe, exempt)
    const effectiveSt: PhoneUsageState = isWithinQuickGlanceWindow ? 'glance' : st;

    // Track consecutive active phone usage strictly beyond 10s grace period
    if (effectiveSt === 'active') {
      silentActiveWindowsRef.current += 1;
    } else {
      silentActiveWindowsRef.current = 0;
    }

    // Social Presence: Active if Bluetooth friends are present OR if active real-world conversation is detected (pc >= 0.70)
    const hasSocialPresence = isBluetoothMeetupActive || pc >= 0.70;

    // RULE 1: If user is truly alone (No Bluetooth friends AND no conversation), ZERO Phubbing!
    if (!hasSocialPresence) {
      const aloneOutput: FusionStepOutput = {
        windowIndex: 0,
        timestampSec: now / 1000,
        p_conv: pc,
        raw_state: st,
        conv_ok: false,
        smoothed_state: st,
        level: 'none',
        alert: false,
        action: '-',
        episodeActive: false,
        episodeDurationSec: 0,
        activeRatio: 0,
        longestRunSec: 0,
        reason: 'Bạn đang ở một mình (Không phát hiện bạn bè hoặc cuộc trò chuyện). Thoải mái sử dụng điện thoại! 🌿',
      };
      setFusionOutput(aloneOutput);
      setPhubbingAlertLevel('none');
      setPhubbingAlertReason(aloneOutput.reason);
      setIsWarning(false);
      return aloneOutput;
    }

    // RULE 2: Quick glance grace period (User is checking notification < 10s without typing)
    if (isWithinQuickGlanceWindow) {
      const glanceOutput: FusionStepOutput = {
        windowIndex: 0,
        timestampSec: now / 1000,
        p_conv: pc,
        raw_state: st,
        conv_ok: false,
        smoothed_state: 'glance',
        level: 'none',
        alert: false,
        action: '-',
        episodeActive: false,
        episodeDurationSec: 0,
        activeRatio: 0,
        longestRunSec: 0,
        reason: `Đang kiểm tra thông báo nhanh (${Math.max(1, 10 - Math.floor(activeElapsedSec))}s còn lại) - Miễn trừ Phubbing hợp lệ 🛡️`,
      };
      setFusionOutput(glanceOutput);
      setPhubbingAlertLevel('none');
      setPhubbingAlertReason(glanceOutput.reason);
      setIsWarning(false);
      return glanceOutput;
    }

    // RULE 3: Cooldown between alerts (Minimum 15s cooldown per user request: "mỗi lần cách nhau 15s thôi")
    const timeSinceLastAlert = now - lastAlertFiredAtRef.current;
    const isAlertCooldownActive = timeSinceLastAlert < 15000;

    let out = engineRef.current.step(pc, effectiveSt);

    if (isAlertCooldownActive && out.alert) {
      out = {
        ...out,
        alert: false,
        reason: `Thời gian giãn cách cảnh báo (còn ${Math.max(1, Math.round((15000 - timeSinceLastAlert) / 1000))}s) - Không ngắt quãng liên tục.`,
      };
    }

    setFusionOutput(out);
    setPhubbingAlertLevel(out.level);
    setPhubbingAlertReason(out.reason);

    // isWarning is strictly gated on FusionEngine multi-modal alert
    setIsWarning(out.alert && (out.level === 'medium' || out.level === 'high'));

    if (out.alert && !isExploreModeActive && !isBabySproutNapActive && !isAlertCooldownActive) {
      if (out.level === 'medium') {
        triggerHapticVibration('warning');
        showToast('📳 Rung nhẹ: Bạn đang ở cùng bạn bè, đừng quên tương tác bằng ánh mắt nhé 🌸', 'warning');
      } else if (out.level === 'high') {
        lastAlertFiredAtRef.current = now;
        triggerHapticVibration('alert');
        incrementPromptCount();
        setIsPhubbingAlertModalOpen(true);
      }
    }
    return out;
  };

  const testTriggerPhubbingAlert = (customReason?: string) => {
    const reason = customReason || 'Bạn đang cắm mặt vào điện thoại khi bạn bè đang ở cự ly gần (Bluetooth 0.8m)!';
    triggerHapticVibration('alert');
    setIsWarning(true);
    setPhubbingAlertLevel('high');

    setPhubbingAlertReason(reason);
    incrementPromptCount();
    setIsPhubbingAlertModalOpen(true);
    showToast('🚨 Đã kích hoạt cảnh báo Phubbing tức thì!', 'warning');
  };

  // Periodic 3-second Sliding Window Tick (Matching Colab WIN_S = 3s)
  useEffect(() => {
    const interval = setInterval(() => {
      stepFusionEngine();
    }, 3000);
    return () => clearInterval(interval);
  }, [pConv, phoneState, isExemptStudyMode, isExploreModeActive, isBabySproutNapActive]);

  // Periodic sensor mock simulation (only runs when mode is simulation)
  useEffect(() => {
    if (typingDetectorMode !== 'simulation') return;

    const interval = setInterval(() => {
      if (!isBabySproutNapActive) {
        setTypingSpeed((prev) => {
          const delta = (Math.random() - 0.48) * 12;
          const next = Math.max(30, Math.min(260, Math.round(prev + delta)));
          // Only warn if there is an ongoing conversation (pConv >= 0.70)
          const warn = next > 110 && appInUse === 'Mạng Xã Hội' && pConv >= 0.70 && !isExemptStudyMode;
          setIsWarning(warn);
          return next;
        });

        setSpeechRatio((prev) => {
          const delta = (Math.random() - 0.5) * 4;
          return Math.max(2, Math.min(35, Math.round(prev + delta)));
        });

        // Small random peer update
        if (Math.random() < 0.2) {
          setSyncPeers((prev) =>
            prev.map((peer) => {
              if (peer.name === 'Phương') {
                return {
                  ...peer,
                  status: Math.random() > 0.4 ? 'sneaking' : 'focused',
                };
              }
              return peer;
            })
          );
        }
      }
    }, 2800);
    return () => clearInterval(interval);
  }, [appInUse, isBabySproutNapActive, typingDetectorMode]);

  const triggerBabySproutNap = () => {
    setIsBabySproutNapActive(true);
    showToast('Chế độ "Cho Bé Mầm chợp mắt" đã kích hoạt trong 5 phút! 🍃', 'success');
    setTimeout(() => {
      setIsBabySproutNapActive(false);
      showToast('Bé Mầm đã thức dậy, tiếp tục tập trung nhé! ✨', 'info');
    }, 300000); // 5 mins
  };

  // 3. Activities
  const [activityTab, setActivityTab] = useState<ActivityTab>('friends');
  const [moodMode, setMoodMode] = useState<MoodMode>('introvert');
  const [activeActivityDetail, setActiveActivityDetail] = useState<'none' | 'picture_guess' | 'extrovert_explore'>('none');
  const [introvertTopicIndex, setIntrovertTopicIndex] = useState(0);
  const [isArtSecretRevealed, setIsArtSecretRevealed] = useState(false);

  const nextIntrovertTopic = () => {
    setIntrovertTopicIndex((prev) => (prev + 1) % 3);
    setIsArtSecretRevealed(false);
    showToast('Đã đổi chủ đề tranh và từ khoá mới! 🔄', 'info');
  };

  const [isHideAndSeekActive, setIsHideAndSeekActive] = useState(false);
  const [hideAndSeekPhase, setHideAndSeekPhase] = useState<'map' | 'hunting' | 'done'>('map');

  const startHideAndSeek = () => {
    setIsHideAndSeekActive(true);
    setHideAndSeekPhase('map');
  };

  const stopHideAndSeek = () => {
    setIsHideAndSeekActive(false);
    setHideAndSeekPhase('done');
  };

  // Family Tasks
  const [familyTasks, setFamilyTasks] = useState<FamilyTask[]>(() => {
    const saved = localStorage.getItem('cm_family_tasks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return [
      {
        id: 'task_1',
        title: 'Mát-xa cho ông bà',
        description: 'Bạn sẽ làm ông bà mình vui lắm đó! ✨',
        icon: '💆',
        pin: '1234',
        isCompleted: false,
        rewardStars: 50,
      },
      {
        id: 'task_2',
        title: 'Phụ bố mẹ quét dọn nhà cửa',
        description: 'Cùng dọn nhà — không khí gia đình sẽ ấm áp hơn! 🏡',
        icon: '🧹',
        pin: '1234',
        isCompleted: false,
        rewardStars: 50,
      },
      {
        id: 'task_3',
        title: 'Dọn bàn ăn cơm tối',
        description: 'Một cử chỉ nhỏ, bố mẹ sẽ nhớ mãi đó! 💕',
        icon: '🍽️',
        pin: '1234',
        isCompleted: false,
        rewardStars: 50,
      },
    ];
  });

  useEffect(() => {
    localStorage.setItem('cm_family_tasks', JSON.stringify(familyTasks));
  }, [familyTasks]);

  const [familyFundStars, setFamilyFundStars] = useState<number>(() => {
    const saved = localStorage.getItem('cm_family_fund');
    return saved !== null ? Number(saved) : 350;
  });

  useEffect(() => {
    localStorage.setItem('cm_family_fund', familyFundStars.toString());
  }, [familyFundStars]);

  const verifyFamilyTask = (taskId: string, pin: string): boolean => {
    const task = familyTasks.find((t) => t.id === taskId);
    if (!task) return false;
    if (pin === task.pin || pin === '1234') {
      setFamilyTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, isCompleted: true } : t))
      );
      addStars(50, 'Hoàn thành việc nhà!');
      setFamilyFundStars((prev) => prev + 50);
      return true;
    }
    return false;
  };

  // 4. Bakery Pomodoro
  const [pomodoroMinutes, setPomodoroMinutes] = useState(50);
  const [pomodoroSeconds, setPomodoroSeconds] = useState(0);
  const [isPomodoroRunning, setIsPomodoroRunning] = useState(false);
  const [savedPlayMinutes, setSavedPlayMinutes] = useState(45);
  const [bakeryTaskTitle, setBakeryTaskTitle] = useState('Đang hoàn thành Deadline Giải Tích Cao Cấp! 🧠✨');

  const [bakeryPeers] = useState<PeerStatus[]>([
    { id: '1', name: 'Minh', emoji: '🌸', status: 'focused', progress: 77 },
    { id: '2', name: 'Uyên', emoji: '🦖', status: 'focused', progress: 42 },
  ]);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isPomodoroRunning) {
      timer = setInterval(() => {
        setPomodoroSeconds((sec) => {
          if (sec > 0) return sec - 1;
          setPomodoroMinutes((min) => {
            if (min > 0) return min - 1;
            // Pomodoro Finished!
            setIsPomodoroRunning(false);
            addStars(50, 'Hoàn thành nướng bánh Pomodoro!');
            setSavedPlayMinutes((prev) => prev + 15);
            showToast('🎉 Bánh chín rồi! Nhận ngay 50 Sao và 15 Phút vui chơi!', 'success');
            return 0;
          });
          return 59;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPomodoroRunning]);

  const startPomodoro = () => setIsPomodoroRunning(true);
  const pausePomodoro = () => setIsPomodoroRunning(false);
  const resetPomodoro = () => {
    setIsPomodoroRunning(false);
    setPomodoroMinutes(50);
    setPomodoroSeconds(0);
  };

  // 5. Rewards Sub-tabs
  const [rewardsSubTab, setRewardsSubTab] = useState<RewardsSubTab>('garden');

  // Garden Plots (12 cells matching image 8)
  const [gardenPlots, setGardenPlots] = useState<GardenPlot[]>(() => {
    const saved = localStorage.getItem('cm_garden');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    // Row 1: 100, 75, 50, 25
    // Row 2: 100, 75, 50, 0
    // Row 3: 25, 100, 75, 50
    return [
      { id: 0, stage: 100 },
      { id: 1, stage: 75 },
      { id: 2, stage: 50 },
      { id: 3, stage: 25 },
      { id: 4, stage: 100 },
      { id: 5, stage: 75 },
      { id: 6, stage: 50 },
      { id: 7, stage: 0 },
      { id: 8, stage: 25 },
      { id: 9, stage: 100 },
      { id: 10, stage: 75 },
      { id: 11, stage: 50 },
    ];
  });

  useEffect(() => {
    localStorage.setItem('cm_garden', JSON.stringify(gardenPlots));
  }, [gardenPlots]);

  const waterPlant = (index: number) => {
    if (!spendStars(20, 'Tưới nước cho cây')) return;
    setGardenPlots((prev) => {
      const next = [...prev];
      const cur = next[index].stage;
      const stageMap: Record<number, 0 | 25 | 50 | 75 | 100> = {
        0: 25,
        25: 50,
        50: 75,
        75: 100,
        100: 100,
      };
      next[index].stage = stageMap[cur] || 100;
      if (cur < 100 && next[index].stage === 100) {
        confetti({ particleCount: 50, spread: 80, origin: { y: 0.6 } });
        showToast('Một bông hoa nữa đã nở rộ! 🌺 Bạn vừa đóng góp trồng 1 cây thật ngoài đời!', 'success');
      }
      return next;
    });
  };

  const fertilizePlant = (index: number) => {
    if (!spendStars(40, 'Dùng phân bón thần kỳ')) return;
    setGardenPlots((prev) => {
      const next = [...prev];
      next[index].stage = 100;
      confetti({ particleCount: 60, spread: 90, origin: { y: 0.6 } });
      showToast('Cây đã nở hoa tức thì nhờ phân bón thần kỳ! 🌺✨', 'success');
      return next;
    });
  };

  // Menu items (matching image 9)
  const menuItems: MenuItem[] = [
    { id: '1', name: 'Trà Sữa Trân Châu', icon: '🧋', cost: 300 },
    { id: '2', name: 'Đĩa Sushi', icon: '🍣', cost: 450 },
    { id: '3', name: 'Combo Burger', icon: '🍔', cost: 380 },
    { id: '4', name: 'Matcha Latte Kem Sữa', icon: '🍵', cost: 250 },
    { id: '5', name: 'Bánh Croissant', icon: '🥐', cost: 200 },
    { id: '6', name: 'Bánh Cầu Vồng Nhiều Màu', icon: '🍰', cost: 280 },
  ];

  const [redeemedVoucher, setRedeemedVoucher] = useState<MenuItem | null>(null);

  const redeemFoodItem = (item: MenuItem): boolean => {
    if (!spendStars(item.cost, `Đổi ${item.name}`)) return false;
    setRedeemedVoucher(item);
    confetti({ particleCount: 60, spread: 70 });
    return true;
  };

  // Pets (matching image 10)
  const [selectedPetIndex, setSelectedPetIndex] = useState(0);
  const [petsList, setPetsList] = useState<PetData[]>([
    { id: 'pet_1', name: 'Hamster Bo', species: 'Hamster', avatar: '🐹', hunger: 75, happiness: 80, isAdopted: true },
    { id: 'pet_2', name: 'Mèo Miu', species: 'Mèo', avatar: '🐱', hunger: 65, happiness: 75, isAdopted: true },
    { id: 'pet_3', name: 'Thỏ Bông', species: 'Thỏ', avatar: '🐰', hunger: 80, happiness: 70, isAdopted: true },
    { id: 'pet_4', name: 'Chó Vàng', species: 'Chó', avatar: '🐶', hunger: 70, happiness: 85, isAdopted: true },
    { id: 'pet_5', name: 'Gấu Pooh', species: 'Gấu', avatar: '🐻', hunger: 55, happiness: 60, isAdopted: true },
    { id: 'pet_6', name: 'Chim Sáo', species: 'Chim', avatar: '🐦', hunger: 90, happiness: 95, isAdopted: true },
  ]);

  const [adoptablePets, setAdoptablePets] = useState<PetData[]>([
    { id: 'adopt_1', name: 'Mèo Xám cô đơn', species: 'Mèo', avatar: '🐈', hunger: 20, happiness: 15, isAdopted: false, cost: 200 },
    { id: 'adopt_2', name: 'Chó Vàng lạc nhà', species: 'Chó', avatar: '🐕', hunger: 25, happiness: 20, isAdopted: false, cost: 200 },
  ]);

  const feedCurrentPet = () => {
    if (!spendStars(50, `Cho ${petsList[selectedPetIndex].name} ăn`)) return;
    setPetsList((prev) => {
      const next = [...prev];
      next[selectedPetIndex].hunger = Math.min(100, next[selectedPetIndex].hunger + 15);
      return next;
    });
    showToast(`Đã cho bé ăn no nê! 🍔`, 'success');
  };

  const playCurrentPet = () => {
    if (!spendStars(30, `Chơi cùng ${petsList[selectedPetIndex].name}`)) return;
    setPetsList((prev) => {
      const next = [...prev];
      next[selectedPetIndex].happiness = Math.min(100, next[selectedPetIndex].happiness + 15);
      return next;
    });
    showToast(`Bé rất vui vì được bạn chơi cùng! 💖`, 'success');
  };

  const adoptPet = (petId: string) => {
    const petToAdopt = adoptablePets.find((p) => p.id === petId);
    if (!petToAdopt) return;
    if (!spendStars(200, `Nhận nuôi ${petToAdopt.name}`)) return;

    setAdoptablePets((prev) => prev.filter((p) => p.id !== petId));
    setPetsList((prev) => [
      ...prev,
      { ...petToAdopt, isAdopted: true, hunger: 40, happiness: 50 },
    ]);
    confetti({ particleCount: 70, spread: 80 });
    showToast(`Chúc mừng bạn đã có thêm người bạn mới: ${petToAdopt.name}! 🐾💖`, 'success');
  };

  // Charity (matching image 11)
  const [charityPins, setCharityPins] = useState<CharityPin[]>([
    { id: 'pin_1', name: 'Trồng Rừng Phủ Xanh', icon: '🌳', cost: 200, description: 'Trồng thêm cây xanh chống xói mòn và giảm thiểu biến đổi khí hậu.', donated: false, coords: { x: 36, y: 62 } },
    { id: 'pin_2', name: 'Nước Sạch Bản Xa', icon: '💧', cost: 150, description: 'Lắp đặt giếng khoan và hệ thống lọc nước sạch cho trẻ em vùng cao.', donated: false, coords: { x: 52, y: 59 } },
    { id: 'pin_3', name: 'Áo Ấm Mùa Đông', icon: '🧥', cost: 120, description: 'Tặng áo phao và chăn ấm cho các em nhỏ chịu rét vùng biên giới.', donated: false, coords: { x: 59, y: 55 } },
    { id: 'pin_4', name: 'Tủ Sách Vùng Cao', icon: '📚', cost: 100, description: 'Gửi sách giáo khoa và truyện tranh bổ ích đến các điểm trường nghèo.', donated: false, coords: { x: 60, y: 58 } },
    { id: 'pin_5', name: 'Bữa Cơm Cho Em', icon: '🍚', cost: 80, description: 'Hỗ trợ bữa trưa đủ chất dinh dưỡng và sữa tươi cho học sinh bán trú.', donated: false, coords: { x: 65, y: 57 } },
    { id: 'pin_6', name: 'Vắc-xin Trẻ Em', icon: '💉', cost: 250, description: 'Tài trợ các mũi vắc-xin bảo vệ sức khỏe cho trẻ em có hoàn cảnh khó khăn.', donated: false, coords: { x: 68, y: 59 } },
  ]);

  const [selectedPin, setSelectedPin] = useState<CharityPin | null>(null);

  const donateToPin = (pinId: string) => {
    const pin = charityPins.find((p) => p.id === pinId);
    if (!pin) return;
    if (pin.donated) {
      showToast('Bạn đã quyên góp cho quỹ này rồi! Cảm ơn tấm lòng của bạn ❤️', 'info');
      return;
    }
    if (!spendStars(pin.cost, `Quyên góp cho quỹ ${pin.name}`)) return;

    setCharityPins((prev) =>
      prev.map((p) => (p.id === pinId ? { ...p, donated: true } : p))
    );
    confetti({ particleCount: 70, spread: 80, origin: { y: 0.5 } });
    showToast(`Cảm ơn bạn đã quyên góp cho ${pin.name}! Trái tim toàn cầu đã ghi nhận tấm lòng của bạn! ❤️`, 'success');
  };

  const userDonationCount = charityPins.filter((p) => p.donated).length;

  // Family Rewards (matching image 12)
  const [familyRewards, setFamilyRewards] = useState<FamilyReward[]>([
    { milestone: 300, title: 'Đi làm gốm / uống cà phê cùng con', icon: '🏺', isRedeemed: false },
    { milestone: 500, title: 'Cả nhà cùng đi ăn Pizza cuối tuần', icon: '🍕', isRedeemed: false },
    { milestone: 800, title: 'Một chuyến dã ngoại ngoại ô cùng gia đình', icon: '🎡', isRedeemed: false },
  ]);

  const redeemFamilyReward = (milestone: number) => {
    const reward = familyRewards.find((r) => r.milestone === milestone);
    if (!reward) return;
    if (familyFundStars < milestone) {
      showToast(`Quỹ gia đình cần thêm ${milestone - familyFundStars} sao nữa! 🔒`, 'error');
      return;
    }
    setFamilyRewards((prev) =>
      prev.map((r) => (r.milestone === milestone ? { ...r, isRedeemed: true } : r))
    );
    confetti({ particleCount: 80, spread: 90 });
    showToast(`Đã chốt phiếu quà tặng: "${reward.title}" cho gia đình! 🎁💕`, 'success');
  };

  // 6. Journal (matching image 4)
  const [journalText, setJournalText] = useState('');
  const [aiReportState, setAiReportState] = useState<'relaxed' | 'strict'>('relaxed');
  const [journalSavedToday, setJournalSavedToday] = useState(false);

  const toggleAiReportState = () => {
    setAiReportState((prev) => (prev === 'relaxed' ? 'strict' : 'relaxed'));
    showToast('Đã chuyển đổi trạng thái phân tích của AI! 🤖', 'info');
  };

  const saveJournalEntry = () => {
    if (journalText.trim().length < 5) {
      showToast('Vui lòng viết ít nhất một câu ngắn cảm xúc hôm nay nhé!', 'warning');
      return;
    }
    setJournalSavedToday(true);
    addStars(20, 'Ghi chép nhật ký biết ơn');
    showToast('Đã lưu nhật ký hôm nay và nhận 20 Sao! ✨', 'success');
  };

  return (
    <AppContext.Provider
      value={{
        currentTab,
        setCurrentTab,
        stars,
        addStars,
        spendStars,
        toast,
        showToast,
        dismissToast,
        events,
        addEvent,
        deleteEvent,
        isAwayModalOpen,
        setIsAwayModalOpen,
        isAddEventModalOpen,
        setIsAddEventModalOpen,
        typingSpeed,
        setTypingSpeed,
        appInUse,
        setAppInUse,
        isWarning,
        setIsWarning,
        typingDetectorMode,
        setTypingDetectorMode,
        audioActive,
        speechRatio,
        babySproutHealth,
        isBabySproutNapActive,
        triggerBabySproutNap,
        syncPeers,
        phubbingPromptCount,
        maxReminderCount,
        setMaxReminderCount,
        incrementPromptCount,
        resetPromptCount,
        isExploreModeActive,
        setIsExploreModeActive,
        glanceGracePeriodSeconds,
        setGlanceGracePeriodSeconds,
        quickGlanceSuccessCount,
        recordQuickGlanceSuccess,
        isQuickGlanceActive,
        quickGlanceRemainingSec,
        requestBackgroundNotificationPermission,
        sendBackgroundNotification,
        nearbyBluetoothDevices,
        isBluetoothMeetupActive,
        toggleBluetoothMeetup,
        scanRealBluetoothDevice,
        isBluetoothScanning,
        bluetoothCoverageStatus,
        setBluetoothCoverageStatus,
        addCustomNearbyFriend,
        removeNearbyDevice,
        detectionPreset,
        setDetectionPreset,
        testTriggerPhubbingAlert,
        fusionConfig,
        updateFusionConfig,
        fusionOutput,
        pConv,
        setPConv,
        phoneState,
        setPhoneState,
        isExemptStudyMode,
        setIsExemptStudyMode,
        stepFusionEngine,
        isPhubbingAlertModalOpen,
        setIsPhubbingAlertModalOpen,
        phubbingAlertLevel,
        phubbingAlertReason,
        habitMemory,
        recordFalsePositiveFeedback,
        resetHabitMemory,
        myVoiceProfile,
        calibrateMyVoiceProfile,
        resetMyVoiceProfile,
        activityTab,

        setActivityTab,
        moodMode,
        setMoodMode,
        activeActivityDetail,
        setActiveActivityDetail,
        introvertTopicIndex,
        nextIntrovertTopic,
        isArtSecretRevealed,
        setIsArtSecretRevealed,
        isHideAndSeekActive,
        hideAndSeekPhase,
        startHideAndSeek,
        stopHideAndSeek,
        familyTasks,
        verifyFamilyTask,
        pomodoroMinutes,
        pomodoroSeconds,
        isPomodoroRunning,
        startPomodoro,
        pausePomodoro,
        resetPomodoro,
        savedPlayMinutes,
        bakeryTaskTitle,
        setBakeryTaskTitle,
        bakeryPeers,
        rewardsSubTab,
        setRewardsSubTab,
        gardenPlots,
        waterPlant,
        fertilizePlant,
        menuItems,
        redeemedVoucher,
        setRedeemedVoucher,
        redeemFoodItem,
        selectedPetIndex,
        setSelectedPetIndex,
        petsList,
        feedCurrentPet,
        playCurrentPet,
        adoptPet,
        adoptablePets,
        charityPins,
        selectedPin,
        setSelectedPin,
        donateToPin,
        userDonationCount,
        familyFundStars,
        familyRewards,
        redeemFamilyReward,
        journalText,
        setJournalText,
        saveJournalEntry,
        aiReportState,
        toggleAiReportState,
        journalSavedToday,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
