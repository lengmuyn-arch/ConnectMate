import { useState, useEffect, useRef, useCallback } from 'react';

export interface SilentPhubbingEvent {
  type: 'scrolling' | 'motion' | 'app_switch' | 'typing';
  description: string;
  timestamp: number;
  durationSec?: number;
}

interface UseSilentScrollDetectorOptions {
  enabled?: boolean;
  onDetect?: (event: SilentPhubbingEvent) => void;
  cooldownMs?: number;
}

export const useSilentScrollDetector = ({
  enabled = true,
  onDetect,
  cooldownMs = 10000,
}: UseSilentScrollDetectorOptions = {}) => {
  const [tiltAngle, setTiltAngle] = useState<number>(0);
  const [isPhoneTilted, setIsPhoneTilted] = useState<boolean>(false);
  const [swipeCount, setSwipeCount] = useState<number>(0);
  const [tapCount, setTapCount] = useState<number>(0);
  const [tapCadenceCpm, setTapCadenceCpm] = useState<number>(0);
  const [isTypingCadence, setIsTypingCadence] = useState<boolean>(false);
  const [lastMotionType, setLastMotionType] = useState<string>('Nằm yên trên bàn');
  const [lastInteractionType, setLastInteractionType] = useState<'typing' | 'scrolling' | 'motion' | 'app_switch' | 'none'>('none');
  const [hasGyroPermission, setHasGyroPermission] = useState<boolean | null>(null);
  const [lastAwayDurationSec, setLastAwayDurationSec] = useState<number>(0);

  const lastTriggerRef = useRef<number>(0);
  const swipeTimestampsRef = useRef<number[]>([]);
  const tapTimestampsRef = useRef<number[]>([]);
  const lastTouchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTouchYRef = useRef<number | null>(null);
  const exitTimestampRef = useRef<number>(0);
  const wasTypingBeforeExitRef = useRef<boolean>(false);

  const fireDetection = useCallback(
    (type: 'scrolling' | 'motion' | 'app_switch' | 'typing', description: string, durationSec?: number) => {
      const now = Date.now();
      if (now - lastTriggerRef.current < cooldownMs) {
        return; // Cooldown
      }
      lastTriggerRef.current = now;
      setLastInteractionType(type);
      if (onDetect) {
        onDetect({ type, description, timestamp: now, durationSec });
      }
    },
    [onDetect, cooldownMs]
  );

  // 1. Touch & Gestures: Distinguishes between Virtual Keyboard Tap Cadence (Texting) vs Swiping (Scrolling)
  useEffect(() => {
    if (!enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        lastTouchYRef.current = touch.clientY;
        lastTouchStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          time: Date.now(),
        };
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!lastTouchStartRef.current) return;
      const now = Date.now();
      const elapsed = now - lastTouchStartRef.current.time;

      // Tap detection: short contact (< 280ms) and minimal movement (< 20px)
      // Typical of mobile virtual keyboard keystrokes
      if (elapsed < 280 && elapsed > 20) {
        tapTimestampsRef.current.push(now);
        // Keep taps in last 5 seconds
        tapTimestampsRef.current = tapTimestampsRef.current.filter((t) => now - t <= 5000);
        const count = tapTimestampsRef.current.length;
        setTapCount(count);

        // Estimate CPM from sliding tap cadence
        const calculatedCpm = Math.round((count / 5) * 60);
        setTapCadenceCpm(calculatedCpm);

        // Check if taps follow typing rhythm: 4+ taps within 3s (~80+ CPM)
        if (count >= 4) {
          setIsTypingCadence(true);
          wasTypingBeforeExitRef.current = true;
          setLastMotionType(`Bấm phím ảo nhịp độ cao (${calculatedCpm} CPM)`);
          setLastInteractionType('typing');

          if (calculatedCpm >= 110) {
            fireDetection(
              'typing',
              `Phát hiện nhịp bấm máy/nhắn tin liên tục trên bàn phím ảo (~${calculatedCpm} CPM)`
            );
          }
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0 || lastTouchYRef.current === null) return;
      const currentY = e.touches[0].clientY;
      const deltaY = Math.abs(currentY - lastTouchYRef.current);

      // Significant swipe gesture (> 35px) -> Scrolling behavior!
      if (deltaY > 35) {
        lastTouchYRef.current = currentY;
        const now = Date.now();
        swipeTimestampsRef.current.push(now);

        // Keep last 8 seconds
        swipeTimestampsRef.current = swipeTimestampsRef.current.filter((t) => now - t <= 8000);
        const count = swipeTimestampsRef.current.length;
        setSwipeCount(count);

        // If swiped 4+ times within 8 seconds without typing/speaking -> Silent scrolling detected!
        if (count >= 4) {
          setLastMotionType('Vuốt màn hình liên tục');
          setLastInteractionType('scrolling');
          wasTypingBeforeExitRef.current = false;
          fireDetection(
            'scrolling',
            'Phát hiện thao tác vuốt cuộn màn hình liên tục bằng ngón tay (Doomscrolling)'
          );
        }
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > 20) {
        const now = Date.now();
        swipeTimestampsRef.current.push(now);
        swipeTimestampsRef.current = swipeTimestampsRef.current.filter((t) => now - t <= 8000);
        const count = swipeTimestampsRef.current.length;
        setSwipeCount(count);

        if (count >= 5) {
          setLastMotionType('Cuộn con lăn liên tục');
          setLastInteractionType('scrolling');
          wasTypingBeforeExitRef.current = false;
          fireDetection(
            'scrolling',
            'Phát hiện con lăn / cuộn trang liên tục trên màn hình'
          );
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('wheel', handleWheel, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [enabled, fireDetection]);

  // Periodic decay of tap cadence
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      tapTimestampsRef.current = tapTimestampsRef.current.filter((t) => now - t <= 4000);
      const count = tapTimestampsRef.current.length;
      setTapCount(count);
      const cpm = Math.round((count / 4) * 60);
      setTapCadenceCpm(cpm);
      if (count < 2) {
        setIsTypingCadence(false);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Device Orientation & Accelerometer (Tilt Angle 45°-75° holding posture)
  useEffect(() => {
    if (!enabled) return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta !== null) {
        const beta = Math.round(e.beta);
        setTiltAngle(beta);

        const isTiltedForBrowsing = beta >= 38 && beta <= 80;
        setIsPhoneTilted(isTiltedForBrowsing);

        if (isTiltedForBrowsing) {
          setLastMotionType(`Cầm nghiêng ${beta}°`);
        } else if (beta < 20) {
          setLastMotionType('Đặt phẳng trên bàn ✨');
        }
      }
    };

    const handleMotion = (e: DeviceMotionEvent) => {
      if (!e.acceleration) return;
      const { x, y, z } = e.acceleration;
      if (x !== null && y !== null && z !== null) {
        const jerk = Math.sqrt(x * x + y * y + z * z);
        if (jerk > 3.5 && isPhoneTilted) {
          setLastInteractionType('motion');
          fireDetection(
            'motion',
            'Cảm biến gia tốc phát hiện vi rung động ngón tay hất/lướt máy khi đang cầm nghiêng'
          );
        }
      }
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }
    if (window.DeviceMotionEvent) {
      window.addEventListener('devicemotion', handleMotion, true);
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
      window.removeEventListener('devicemotion', handleMotion, true);
    };
  }, [enabled, isPhoneTilted, fireDetection]);

  // 3. Tab Visibility & Window Blur: Tracks EXIT TO TEXT / MESSAGING ON EXTERNAL APPS
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      const now = Date.now();
      if (document.visibilityState === 'hidden') {
        // User exited ConnectMate to open Zalo, Messenger, SMS, etc.
        exitTimestampRef.current = now;
      } else {
        // User returned to ConnectMate
        if (exitTimestampRef.current > 0) {
          const awaySec = Math.round((now - exitTimestampRef.current) / 1000);
          setLastAwayDurationSec(awaySec);

          // If away for > 15s (beyond quick glance grace period)
          if (awaySec > 15) {
            const isExternalTexting = wasTypingBeforeExitRef.current || awaySec >= 20;
            const eventType = isExternalTexting ? 'typing' : 'app_switch';
            const desc = isExternalTexting
              ? `Phát hiện thoát ứng dụng để nhắn tin bên ngoài (Zalo/Messenger/SMS) trong ${awaySec} giây!`
              : `Phát hiện chuyển sang ứng dụng khác trong ${awaySec} giây!`;

            setLastInteractionType(eventType);
            fireDetection(eventType, desc, awaySec);
          }

          exitTimestampRef.current = 0;
          wasTypingBeforeExitRef.current = false;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enabled, fireDetection]);

  // Manual trigger for testing
  const testTrigger = (type: 'scrolling' | 'motion' | 'app_switch' | 'typing') => {
    lastTriggerRef.current = 0; // Bypass cooldown
    const descs = {
      typing: 'Phát hiện cơ chế bấm máy, đếm nhịp gõ phím / nhắn tin nhanh (>120 CPM)',
      scrolling: 'Phát hiện thao tác vuốt cuộn màn hình im lặng (Doomscrolling)',
      motion: 'Cảm biến con quay hồi chuyển phát hiện tư thế cầm máy nghiêng 55°',
      app_switch: 'Phát hiện thoát ra ứng dụng khác để nhắn tin (Zalo/Messenger)',
    };
    fireDetection(type, descs[type]);
  };

  return {
    tiltAngle,
    isPhoneTilted,
    swipeCount,
    tapCount,
    tapCadenceCpm,
    isTypingCadence,
    lastMotionType,
    lastInteractionType,
    hasGyroPermission,
    lastAwayDurationSec,
    testTrigger,
  };
};
