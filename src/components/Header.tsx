import React, { useState } from 'react';
import { Mic, Smartphone, UserCheck } from 'lucide-react';
import { VoiceAssistantModal } from './VoiceAssistantModal';
import { MobileApkInstallModal } from './MobileApkInstallModal';
import { VoiceCalibrationModal } from './VoiceCalibrationModal';

export const Header: React.FC = () => {
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isCalibrationModalOpen, setIsCalibrationModalOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#0ABAB5] border-b-[3px] border-[#2B2118] px-3 py-2 sm:px-3.5 sm:py-2.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-1.5 text-white">
          <span className="text-xl">✨</span>
          <span className="font-heading font-black text-lg sm:text-xl tracking-tight">ConnectMate</span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Nút Đăng ký Mẫu Giọng Chủ Máy để tránh nhầm khi tự đọc bài */}
          <button
            onClick={() => setIsCalibrationModalOpen(true)}
            title="Lưu mẫu giọng của bạn để không bao giờ bị thông báo nhầm khi tự học bài / nói một mình"
            className="flex items-center gap-1 bg-[#CFE3DC] hover:bg-[#bde3d7] text-[#2B2118] font-heading font-black text-xs px-2.5 py-1.5 rounded-xl border-2 border-[#2B2118] pop-shadow-sm transition-all active:translate-x-0.5 active:translate-y-0.5"
          >
            <UserCheck size={13} className="text-[#2B2118]" />
            <span className="hidden xs:inline">Giọng của tôi</span>
            <span className="xs:hidden">Giọng</span>
          </button>

          {/* Nút cài đặt ứng dụng vào điện thoại / APK */}
          <button
            onClick={() => setIsInstallModalOpen(true)}
            title="Cài đặt ConnectMate trực tiếp vào điện thoại hoặc tải file APK"
            className="flex items-center gap-1 bg-[#DFB2FA] hover:bg-[#d6a1f7] text-[#2B2118] font-heading font-black text-xs px-2.5 py-1.5 rounded-xl border-2 border-[#2B2118] pop-shadow-sm transition-all active:translate-x-0.5 active:translate-y-0.5"
          >
            <Smartphone size={13} className="text-[#2B2118]" />
            <span>📲 Cài App</span>
          </button>

          {/* Nút dùng mic thiết bị để nói vào ứng dụng */}
          <button
            onClick={() => setIsVoiceModalOpen(true)}
            title="Nói chuyện hoặc thử mic thiết bị với trợ lý AI"
            className="flex items-center gap-1 bg-[#F9DCC4] hover:bg-[#ffe5cd] text-[#2B2118] font-heading font-black text-xs px-2.5 py-1.5 rounded-xl border-2 border-[#2B2118] pop-shadow-sm transition-all active:translate-x-0.5 active:translate-y-0.5"
          >
            <Mic size={13} className="text-[#2B2118]" />
            <span className="hidden xs:inline">Thử Giọng</span>
            <span className="xs:hidden">Mic</span>
          </button>
        </div>
      </header>

      <VoiceAssistantModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
      />

      <MobileApkInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />

      <VoiceCalibrationModal
        isOpen={isCalibrationModalOpen}
        onClose={() => setIsCalibrationModalOpen(false)}
      />
    </>
  );
};

