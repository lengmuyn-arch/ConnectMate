import React, { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  Download,
  QrCode,
  CheckCircle2,
  Share2,
  Copy,
  Terminal,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Laptop,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

import QRCode from 'qrcode';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

// 100% ISO-Standard Scannable QR Code Component (Works with iPhone Camera, Android, Zalo, Google Lens)
const ValidQrCode: React.FC<{ value: string; size?: number }> = ({ value, size = 180 }) => {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(value, {
      margin: 2,
      width: size * 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#2B2118',
        light: '#FFFFFF',
      },
    })
      .then((url) => {
        if (isMounted) setDataUrl(url);
      })
      .catch((err) => {
        console.error('QR generation error:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [value, size]);

  if (!dataUrl) {
    return (
      <div style={{ width: size, height: size }} className="flex items-center justify-center bg-white rounded-xl mx-auto border border-stone-200">
        <span className="text-xs text-stone-400 font-mono">Đang tạo mã QR...</span>
      </div>
    );
  }

  return (
    <img
      src={dataUrl}
      alt={`QR Code for ${value}`}
      style={{ width: size, height: size }}
      className="mx-auto rounded-xl pop-shadow-sm border border-stone-300"
    />
  );
};

export const MobileApkInstallModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { showToast } = useApp();

  const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [activeTab, setActiveTab] = useState<'install' | 'apk_guide' | 'qr'>('install');

  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://ais-pre-mlsnbk2zsvncab22ygdwhx-714664693182.asia-east1.run.app';

  // Check if running as standalone app
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      setIsStandalone(isStandaloneMode);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvent(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallPwa = async () => {
    if (installPromptEvent) {
      installPromptEvent.prompt();
      const choiceResult = await installPromptEvent.userChoice;
      if (choiceResult.outcome === 'accepted') {
        showToast('🎉 Đang cài đặt ConnectMate vào điện thoại của bạn!', 'success');
        setInstallPromptEvent(null);
      }
    } else {
      showToast('👉 Mẹo: Hãy bấm biểu tượng 3 chấm trên trình duyệt > Chọn "Cài đặt ứng dụng" hoặc "Thêm vào Màn hình chính"', 'info');
    }
  };

  const copyUrlToClipboard = () => {
    navigator.clipboard.writeText(currentUrl);
    showToast('✓ Đã sao chép đường link ứng dụng!', 'success');
  };

  const copyCapacitorCommands = () => {
    const commands = `npm install @capacitor/core @capacitor/cli @capacitor/android\nnpx cap init ConnectMate com.connectmate.app --web-dir dist\nnpm run build\nnpx cap add android\nnpx cap open android`;
    navigator.clipboard.writeText(commands);
    showToast('✓ Đã sao chép lệnh build file APK!', 'success');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-[#2B2118] text-white w-full max-w-lg rounded-3xl border-[3px] border-[#2B2118] pop-shadow flex flex-col max-h-[92vh] overflow-hidden my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-800 flex items-center justify-between bg-[#1f1712]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#0ABAB5] text-[#2B2118] flex items-center justify-center font-black pop-shadow-sm">
              <Smartphone size={22} />
            </div>
            <div>
              <h2 className="font-heading font-black text-base sm:text-lg text-white">
                CÀI ĐẶT ỨNG DỤNG DI ĐỘNG (APK)
              </h2>
              <p className="text-xs text-stone-300">
                Tương thích 100% với Android &amp; iOS, hoạt động như app native
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center font-black transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="grid grid-cols-3 bg-black/40 border-b border-stone-800 text-xs font-heading font-bold p-1 gap-1">
          <button
            onClick={() => setActiveTab('install')}
            className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'install'
                ? 'bg-[#0ABAB5] text-[#2B2118] font-black'
                : 'text-stone-300 hover:text-white'
            }`}
          >
            <Download size={14} />
            <span>1. Cài 1-Chạm</span>
          </button>

          <button
            onClick={() => setActiveTab('apk_guide')}
            className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'apk_guide'
                ? 'bg-[#DFB2FA] text-[#2B2118] font-black'
                : 'text-stone-300 hover:text-white'
            }`}
          >
            <Terminal size={14} />
            <span>2. Xuất File APK</span>
          </button>

          <button
            onClick={() => setActiveTab('qr')}
            className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'qr'
                ? 'bg-[#F9DCC4] text-[#2B2118] font-black'
                : 'text-stone-300 hover:text-white'
            }`}
          >
            <QrCode size={14} />
            <span>3. Quét Mã QR</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* TAB 1: 1-Click Install PWA / WebAPK */}
          {activeTab === 'install' && (
            <div className="space-y-3.5">
              {isStandalone ? (
                <div className="bg-[#0ABAB5]/20 border-2 border-[#0ABAB5] rounded-2xl p-4 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-[#0ABAB5] text-[#2B2118] flex items-center justify-center mx-auto text-2xl font-black">
                    ✓
                  </div>
                  <h3 className="font-heading font-black text-sm text-white">
                    Ứng dụng đã được cài đặt trên thiết bị!
                  </h3>
                  <p className="text-[11px] text-stone-300">
                    Bạn đang mở ConnectMate ở chế độ toàn màn hình Native Standalone mượt mà.
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-[#0ABAB5]/15 border border-[#0ABAB5]/40 rounded-2xl p-3 flex items-start gap-2.5 text-stone-200">
                    <span className="text-xl shrink-0">✨</span>
                    <div>
                      <h4 className="font-heading font-black text-xs text-[#0ABAB5]">
                        Cài đặt trực tiếp thành App trên điện thoại (Không cần qua CH Play)
                      </h4>
                      <p className="text-[11px] text-stone-300 leading-relaxed mt-0.5">
                        ConnectMate đã tích hợp công nghệ PWA / WebAPK tiêu chuẩn của Google: Sau khi cài, icon ConnectMate sẽ xuất hiện trên màn hình chính của điện thoại và mở toàn màn hình độc lập như app tải từ Store!
                      </p>
                    </div>
                  </div>

                  {/* Android Install Guide */}
                  <div className="bg-stone-900/80 border border-stone-700 rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-heading font-black text-xs text-white flex items-center gap-1.5">
                        <span>🤖</span>
                        <span>Dành cho điện thoại Android (Chrome / Samsung Internet):</span>
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-[#0ABAB5]/20 text-[#0ABAB5] rounded-full font-bold border border-[#0ABAB5]/30">
                        Tự động sinh WebAPK
                      </span>
                    </div>

                    <button
                      onClick={handleInstallPwa}
                      className="w-full py-3 bg-[#0ABAB5] hover:bg-[#089e9a] text-[#2B2118] font-heading font-black text-xs rounded-xl border-2 border-[#2B2118] pop-shadow-sm flex items-center justify-center gap-2 transition-all active:translate-y-0.5"
                    >
                      <Download size={16} />
                      <span>BẤM VÀO ĐÂY ĐỂ CÀI APP VÀO MÁY NGAY</span>
                    </button>

                    <p className="text-[10px] text-stone-400 italic text-center">
                      (Hoặc bấm menu <strong>3 chấm ⋮</strong> trên trình duyệt &gt; chọn <strong>"Cài đặt ứng dụng"</strong>)
                    </p>
                  </div>

                  {/* iOS Safari Guide */}
                  <div className="bg-stone-900/80 border border-stone-700 rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-heading font-black text-xs text-white flex items-center gap-1.5">
                        <span>🍎</span>
                        <span>Dành cho iPhone / iPad (Safari):</span>
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-[#DFB2FA]/20 text-[#DFB2FA] rounded-full font-bold border border-[#DFB2FA]/30">
                        iOS Standalone
                      </span>
                    </div>

                    <div className="bg-black/50 p-2.5 rounded-xl text-[11px] text-stone-300 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#DFB2FA]">Bước 1:</span>
                        <span>Bấm nút <strong>Chia sẻ (Icon ô vuông có mũi tên lên ⎋)</strong> ở thanh dưới Safari</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#DFB2FA]">Bước 2:</span>
                        <span>Cuộn xuống chọn <strong>"Thêm vào Màn hình chính" (Add to Home Screen)</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#DFB2FA]">Bước 3:</span>
                        <span>Bấm <strong>"Thêm" (Add)</strong> ở góc trên bên phải là hoàn tất!</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: Standalone APK Packaging Guide */}
          {activeTab === 'apk_guide' && (
            <div className="space-y-3.5">
              <div className="bg-[#DFB2FA]/15 border border-[#DFB2FA]/40 rounded-2xl p-3 text-stone-200">
                <h4 className="font-heading font-black text-xs text-[#DFB2FA] mb-1">
                  Đóng Gói File APK Độc Lập Bằng Capacitor / Bubblewrap CLI
                </h4>
                <p className="text-[11px] text-stone-300 leading-relaxed">
                  Nếu bạn muốn xuất ra file <strong>.apk</strong> cài trực tiếp (sideload) cho ban giám khảo hoặc nộp cuộc thi, dự án đã sẵn sàng 100% cấu hình để đóng gói qua <strong>Capacitor (Android Studio)</strong> hoặc <strong>PWABuilder (1-Click APK Generator)</strong>.
                </p>
              </div>

              {/* Method A: PWABuilder (Online APK Generator) */}
              <div className="bg-stone-900/90 border border-stone-700 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-black text-xs text-white flex items-center gap-1.5">
                    <span>⚡</span>
                    <span>Cách 1: Tải File APK Tự Động (Khuyên dùng)</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/40">
                    Miễn phí 100%
                  </span>
                </div>

                <p className="text-[11px] text-stone-300 leading-relaxed">
                  PWABuilder (Nền tảng mã nguồn mở chính thức của Microsoft &amp; Google) sẽ tự động đóng gói dự án ConnectMate thành file <strong>.apk</strong> chuẩn Android 14+ có thể cài trên mọi dòng máy Samsung, Xiaomi, Oppo, Vsmart...
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <a
                    href={`https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(currentUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 bg-[#DFB2FA] hover:bg-[#d6a1f7] text-[#2B2118] font-heading font-black text-xs rounded-xl border-2 border-[#2B2118] pop-shadow-sm flex items-center justify-center gap-1.5 transition-all text-center"
                  >
                    <span>🚀 Tới Trang Tải File APK</span>
                    <ExternalLink size={13} />
                  </a>

                  <button
                    onClick={copyUrlToClipboard}
                    className="py-2.5 px-3 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold rounded-xl border border-stone-600 flex items-center justify-center gap-1.5 transition-colors text-xs"
                  >
                    <Copy size={13} />
                    <span>Copy Link Ứng Dụng</span>
                  </button>
                </div>
              </div>

              {/* Method B: Capacitor CLI */}
              <div className="bg-stone-900/90 border border-stone-700 rounded-2xl p-3.5 space-y-2 font-mono">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-black text-xs text-white flex items-center gap-1.5 font-sans">
                    <span>🛠️</span>
                    <span>Cách 2: Build qua lệnh Terminal (Capacitor CLI)</span>
                  </span>
                  <button
                    onClick={copyCapacitorCommands}
                    className="text-[10px] text-[#0ABAB5] hover:underline font-bold flex items-center gap-1"
                  >
                    <Copy size={11} />
                    <span>Copy lệnh</span>
                  </button>
                </div>

                <pre className="bg-black/60 p-2.5 rounded-xl border border-stone-800 text-[10px] text-stone-300 overflow-x-auto leading-relaxed">
{`# 1. Cài đặt Capacitor
npm i @capacitor/core @capacitor/android
npx cap init ConnectMate com.connectmate.app

# 2. Build ứng dụng và xuất sang Android Studio
npm run build
npx cap add android
npx cap open android`}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: Scan QR Code */}
          {activeTab === 'qr' && (
            <div className="space-y-3.5 text-center">
              <div className="bg-white rounded-2xl p-3.5 inline-block mx-auto border-[3px] border-[#2B2118] pop-shadow">
                <ValidQrCode value={currentUrl} size={180} />
              </div>

              <div className="space-y-1 text-center">
                <h4 className="font-heading font-black text-sm text-white">
                  Quét Mã Để Mở Trên Điện Thoại
                </h4>
                <p className="text-[11px] text-stone-300 max-w-xs mx-auto">
                  Mở camera trên điện thoại iPhone hoặc Android và quét mã QR ở trên để mở ConnectMate ngay lập tức.
                </p>
              </div>

              <div className="flex items-center gap-2 max-w-sm mx-auto pt-1">
                <input
                  type="text"
                  readOnly
                  value={currentUrl}
                  className="flex-1 bg-black/60 border border-stone-700 rounded-xl px-2.5 py-1.5 text-[11px] text-stone-300 font-mono"
                />
                <button
                  onClick={copyUrlToClipboard}
                  className="px-3 py-1.5 bg-[#0ABAB5] hover:bg-[#089e9a] text-[#2B2118] rounded-xl font-heading font-black text-xs shrink-0 pop-shadow-sm transition-all"
                >
                  Copy Link
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-stone-800 bg-[#1f1712] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-stone-400 text-[11px]">
            <ShieldCheck size={14} className="text-[#0ABAB5]" />
            <span>Tự động tối ưu giao diện điện thoại (Touch, Safe Area &amp; Offline)</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-white rounded-xl font-heading font-bold text-xs transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
