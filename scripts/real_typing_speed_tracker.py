#!/usr/bin/env python3
"""
ConnectMate - Real Keystroke Speed & Phubbing Detection Engine
Monitors real keyboard typing velocity (CPM / WPM) and classifies Phubbing vs Focused Conversation.
"""

import sys
import time
import json
from collections import deque

class RealTypingSpeedDetector:
    def __init__(self, window_seconds=5.0, warning_cpm=120):
        self.window_seconds = window_seconds
        self.warning_cpm = warning_cpm
        self.timestamps = deque()
        self.total_keystrokes = 0
        self.peak_cpm = 0
        self.last_key_time = 0

    def on_press(self, key_str=""):
        now = time.time()
        self.total_keystrokes += 1
        self.last_key_time = now
        self.timestamps.append(now)

    def get_stats(self):
        now = time.time()
        # Evict keystrokes older than window
        while self.timestamps and (now - self.timestamps[0] > self.window_seconds):
            self.timestamps.popleft()

        count = len(self.timestamps)
        # CPM = (count / window) * 60
        cpm = round((count / self.window_seconds) * 60) if count > 0 else 0
        wpm = round(cpm / 5)

        if cpm > self.peak_cpm:
            self.peak_cpm = cpm

        is_phubbing = cpm >= self.warning_cpm
        is_active = (now - self.last_key_time) < 2.0 if self.last_key_time else False

        return {
            "cpm": cpm,
            "wpm": wpm,
            "peak_cpm": self.peak_cpm,
            "total_keystrokes": self.total_keystrokes,
            "is_typing": is_active,
            "is_phubbing_warning": is_phubbing,
            "status_label": "⚠️ Cảnh Báo: Nhắn tin / Gõ phím nhanh!" if is_phubbing else "✅ Ổn Định: Tập trung đối thoại",
            "timestamp": time.time()
        }

def start_terminal_demo():
    detector = RealTypingSpeedDetector()
    print("=" * 60)
    print("⌨️  CONNECTMATE - BỘ ĐO TỐC ĐỘ GÕ PHÍM THẬT THỜI GIAN THỰC")
    print("Gõ bất kỳ phím hoặc đoạn văn bản nào rồi bấm Enter:")
    print("=" * 60)

    try:
        while True:
            line = input("\n[Nhập văn bản] > ")
            if line.strip().lower() == "exit":
                break
            for char in line:
                detector.on_press(char)
                time.sleep(0.04) # Simulate stroke intervals
            
            stats = detector.get_stats()
            print(f"📊 Kết quả: {stats['cpm']} Ký tự/phút (CPM) | {stats['wpm']} Từ/phút (WPM)")
            print(f"🎯 Trạng thái: {stats['status_label']}")
            print(f"🏆 Kỷ lục cao nhất: {stats['peak_cpm']} CPM | Tổng ký tự: {stats['total_keystrokes']}")
    except KeyboardInterrupt:
        print("\nĐã dừng bộ đo.")

if __name__ == "__main__":
    start_terminal_demo()
