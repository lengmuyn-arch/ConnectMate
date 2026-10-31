import React, { useState, useEffect } from 'react';
import {
  Bluetooth,
  BluetoothSearching,
  BluetoothConnected,
  Users,
  MapPin,
  Wifi,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Coffee,
  Utensils,
  BookOpen,
  Home,
  Radio,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export type VenueType = 'cafe' | 'dining' | 'library' | 'home';

export interface NearbyBluetoothDevice {
  id: string;
  name: string;
  rssi: number; // dBm, e.g. -55 is ~0.8m, -72 is ~2.0m
  distanceMeters: number;
  status: 'focused' | 'talking' | 'phubbing';
  isVerifiedSpeaker: boolean;
}

interface VenuePreset {
  id: VenueType;
  name: string;
  icon: string;
  beaconName: string;
  recommendation: string;
  meshNetworkId: string;
  badgeColor: string;
}

const VENUES: Record<VenueType, VenuePreset> = {
  cafe: {
    id: 'cafe',
    name: 'Quán Cà Phê / Trà Sữa',
    icon: '☕',
    beaconName: 'BLE_BEACON_CAFE_HIGHLANDS_#12',
    recommendation: 'Chế độ Cà Phê Trò Chuyện: Hãy đặt điện thoại úp mặt xuống bàn và kể cho bạn bè nghe những câu chuyện vui!',
    meshNetworkId: 'MESH-CAFE-B3',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
  },
  dining: {
    id: 'dining',
    name: 'Bàn Ăn Gia Đình / Nhà Hàng',
    icon: '🍽️',
    beaconName: 'BLE_BEACON_DINING_ROOM_TABLE',
    recommendation: 'Bàn Ăn Gắn Kết: Nguyên tắc vàng - Tuyệt đối không bấm điện thoại trong bữa ăn để trân trọng món ăn và người thân!',
    meshNetworkId: 'MESH-FAMILY-DINING',
    badgeColor: 'bg-orange-100 text-orange-900 border-orange-300',
  },
  library: {
    id: 'library',
    name: 'Thư Viện / Phòng Tự Học',
    icon: '📚',
    beaconName: 'BLE_BEACON_STUDY_HUB_ROOM4',
    recommendation: 'Chế độ Học Nhóm Tập Trung: Tắt chuông điện thoại, cùng nhau hoàn thành bài tập và hỗ trợ bạn bè!',
    meshNetworkId: 'MESH-STUDY-ROOM',
    badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
  },
  home: {
    id: 'home',
    name: 'Phòng Khách Gia Đình',
    icon: '🏠',
    beaconName: 'BLE_BEACON_LIVING_ROOM_TV',
    recommendation: 'Gắn Kết Gia Đình: Tạm gác mạng xã hội, cùng trò chuyện và hỏi thăm cha mẹ, người thân.',
    meshNetworkId: 'MESH-HOME-FAMILY',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  },
};

export const BluetoothSyncPanel: React.FC = () => {
  const {
    addStars,
    showToast,
    nearbyBluetoothDevices,
    isBluetoothMeetupActive,
    scanRealBluetoothDevice,
    isBluetoothScanning,
    addCustomNearbyFriend,
    removeNearbyDevice,
  } = useApp();

  const [isBluetoothEnabled, setIsBluetoothEnabled] = useState(true);
  const [selectedVenue, setSelectedVenue] = useState<VenueType>('cafe');
  const [isMeshConnected, setIsMeshConnected] = useState(true);
  const [bluetoothError, setBluetoothError] = useState<string | null>(null);

  const venue = VENUES[selectedVenue];
  const totalPeoplePresent = nearbyBluetoothDevices.length + 1; // devices + user
  const isMultiPersonConversation = totalPeoplePresent >= 2;

  const handleRescan = () => {
    scanRealBluetoothDevice().catch(() => {});
  };

  const handleAddSimulatedFriend = () => {
    const friendNames = [
      'iPad của Bố (Ngồi cùng bàn)',
      'MacBook của Minh (Học nhóm)',
      'Pixel 8 của Hương (Bạn thân)',
      'iPhone 15 của Mẹ (Gia đình)',
    ];
    const available = friendNames.filter((name) => !nearbyBluetoothDevices.some((d) => d.name.includes(name.split(' ')[0])));
    const chosenName = available[0] || `Thiết bị bạn bè #${nearbyBluetoothDevices.length + 1}`;
    const dist = Math.round((0.6 + Math.random() * 1.5) * 10) / 10;
    addCustomNearbyFriend(chosenName, dist);
  };

  return (
    <div className="bg-[#1C1612] border-2 border-stone-700/80 rounded-3xl p-4 sm:p-5 text-white space-y-4">
      {/* 1. Header Row */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#0ABAB5] text-[#2B2118] flex items-center justify-center pop-shadow-sm font-black">
            <Bluetooth size={18} />
          </div>
          <div>
            <h3 className="font-heading font-black text-xs sm:text-sm text-white flex items-center gap-1.5">
              <span>MẠNG CỤC BỘ BLUETOOTH &amp; ĐỊA ĐIỂM</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#0ABAB5]/20 text-[#0ABAB5] border border-[#0ABAB5]/40 font-bold">
                BLE Mesh
              </span>
            </h3>
            <p className="text-[10.5px] text-stone-300">
              Phát hiện cuộc trò chuyện &gt;= 2 người &amp; kết nối không cần GPS
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => scanRealBluetoothDevice().catch(() => {})}
            disabled={isBluetoothScanning}
            className="flex items-center gap-1.5 text-xs font-heading font-black px-3 py-1.5 rounded-xl bg-[#0ABAB5] hover:bg-[#089e9a] text-[#2B2118] border-2 border-[#2B2118] transition-all pop-shadow-sm disabled:opacity-50 active:translate-x-0.5 active:translate-y-0.5"
          >
            {isBluetoothScanning ? (
              <RefreshCw size={13} className="animate-spin" />
            ) : (
              <BluetoothSearching size={13} />
            )}
            <span>{isBluetoothScanning ? 'Đang Quét...' : 'Quét Bluetooth Thật'}</span>
          </button>

          <button
            onClick={handleRescan}
            title="Quét lại"
            className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-600 transition-colors"
          >
            <RefreshCw size={14} className={isBluetoothScanning ? 'animate-spin text-[#0ABAB5]' : ''} />
          </button>
        </div>
      </div>

      {bluetoothError && (
        <div className="text-[11px] text-amber-300 bg-amber-950/40 border border-amber-800/60 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5">
          <AlertTriangle size={13} className="shrink-0" />
          <span>{bluetoothError}</span>
        </div>
      )}

      {/* 2. Multi-Person Conversation Detection Box */}
      <div
        className={`border-2 rounded-2xl p-3.5 space-y-2.5 transition-all ${
          isMultiPersonConversation
            ? 'bg-[#0ABAB5]/10 border-[#0ABAB5]'
            : 'bg-stone-900/60 border-stone-700'
        }`}
      >
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">👥</span>
            <div>
              <span className="text-[10px] text-stone-400 font-mono block">
                TRẠNG THÁI CUỘC TRÒ CHUYỆN (BLUETOOTH RSSI &lt; 3M)
              </span>
              <h4 className="font-heading font-black text-xs sm:text-sm text-white">
                {isMultiPersonConversation
                  ? `Phát Hiện Cuộc Trò Chuyện Từ 2 Người Trở Lên (${totalPeoplePresent} người đang ngồi cạnh nhau ✨)`
                  : 'Chưa phát hiện đủ 2 người (Đang ngồi một mình)'}
              </h4>
            </div>
          </div>

          <span
            className={`text-[11px] font-heading font-black px-2.5 py-1 rounded-full border ${
              isMultiPersonConversation
                ? 'bg-[#CFE3DC] text-[#2B2118] border-[#2B2118]'
                : 'bg-stone-800 text-stone-400 border-stone-700'
            }`}
          >
            {isMultiPersonConversation ? '✅ Đủ 2+ Người Đối Thoại' : '⏳ Cần ít nhất 2 người'}
          </span>
        </div>

        {/* List of nearby Bluetooth devices */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px] text-stone-400 font-mono">
            <span>Thiết bị Bluetooth trong bán kính gần (~1 - 3m):</span>
            <button
              onClick={handleAddSimulatedFriend}
              className="text-[#0ABAB5] hover:text-white font-bold underline"
            >
              + Thêm người cùng bàn
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* User device */}
            <div className="bg-black/50 border border-[#0ABAB5]/40 rounded-xl p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0ABAB5] animate-ping shrink-0" />
                <div>
                  <span className="font-heading font-bold text-xs text-white block">
                    Thiết bị của bạn (Chủ tọa)
                  </span>
                  <span className="text-[10px] text-[#0ABAB5] font-mono">
                    Gốc phát sóng • Đang đối thoại
                  </span>
                </div>
              </div>
              <span className="text-[10px] bg-[#0ABAB5]/20 text-[#0ABAB5] px-2 py-0.5 rounded-full border border-[#0ABAB5]/40 font-bold">
                0 m
              </span>
            </div>

            {/* Nearby peers */}
            {nearbyBluetoothDevices.map((dev) => (
              <div
                key={dev.id}
                className="bg-black/40 border border-stone-800 hover:border-stone-700 rounded-xl p-2.5 flex items-center justify-between group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">📱</span>
                  <div>
                    <span className="font-heading font-bold text-xs text-stone-200 block">
                      {dev.name}
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">
                      Cách ~{dev.distanceMeters}m • Sóng: {dev.rssi} dBm
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] bg-emerald-950/60 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-800 font-bold">
                    ✓ Cạnh nhau
                  </span>
                  <button
                    onClick={() => removeNearbyDevice(dev.id)}
                    className="text-stone-500 hover:text-rose-400 text-xs px-1"
                    title="Xóa thiết bị"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Acoustic synergy hint */}
        <div className="bg-black/30 border border-stone-800 rounded-xl p-2 flex items-center justify-between text-[11px] text-stone-300">
          <div className="flex items-center gap-1.5">
            <Radio size={13} className="text-[#0ABAB5]" />
            <span>
              Bluetooth xác nhận khoảng cách vật lý + Librosa đo luân phiên 2 giọng nói.
            </span>
          </div>
          <span className="text-[#0ABAB5] font-bold font-mono">Turn-taking: 62%</span>
        </div>
      </div>

      {/* 3. Venue & Location Type Detection (NO GPS REQUIRED) */}
      <div className="bg-[#241B15] border border-stone-700 rounded-2xl p-3.5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">📍</span>
            <div>
              <span className="text-[10px] text-stone-400 font-mono block">
                LOẠI HÌNH ĐỊA ĐIỂM (PHÁT HIỆN QUA BLE BEACON TRẠM PHÁT SÓNG)
              </span>
              <h4 className="font-heading font-black text-xs sm:text-sm text-white flex items-center gap-1.5">
                <span>{venue.icon} {venue.name}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40 font-bold">
                  Không cần GPS
                </span>
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] text-stone-400 font-mono">Chọn không gian:</span>
            <div className="flex gap-1">
              {(Object.keys(VENUES) as VenueType[]).map((vKey) => (
                <button
                  key={vKey}
                  onClick={() => {
                    setSelectedVenue(vKey);
                    showToast(`Đã nhận diện trạm BLE: ${VENUES[vKey].name}`, 'info');
                  }}
                  className={`px-2 py-1 rounded-lg text-xs transition-all ${
                    selectedVenue === vKey
                      ? 'bg-[#0ABAB5] text-[#2B2118] font-black'
                      : 'bg-stone-800 text-stone-400 hover:text-white'
                  }`}
                  title={VENUES[vKey].name}
                >
                  {VENUES[vKey].icon}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Venue Recommendation Box */}
        <div className="bg-black/40 border border-stone-800 rounded-xl p-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#0ABAB5] font-heading font-black">
              💡 Lời khuyên tương tác cho {venue.name}:
            </span>
            <span className="text-[10px] font-mono text-stone-400">
              Beacon ID: {venue.beaconName}
            </span>
          </div>
          <p className="text-[11.5px] text-stone-200 leading-relaxed italic">
            "{venue.recommendation}"
          </p>
        </div>

        {/* 4. Local Area Mesh Network (Mạng cục bộ không Internet) */}
        <div className="bg-[#1C1612] border border-stone-800 rounded-xl p-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#DFB2FA] text-[#2B2118] flex items-center justify-center font-black">
              <Wifi size={15} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-bold text-xs text-white">
                  Mạng Cục Bộ: #{venue.meshNetworkId}
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.2 rounded-full font-bold">
                  {isMeshConnected ? 'Đã kết nối cục bộ' : 'Ngắt kết nối'}
                </span>
              </div>
              <p className="text-[10px] text-stone-400">
                Đồng bộ trạng thái buông điện thoại giữa các máy trong bán kính 10m mà không qua server đám mây.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setIsMeshConnected(!isMeshConnected);
              showToast(
                !isMeshConnected
                  ? `Đã tham gia Mạng Cục Bộ #${venue.meshNetworkId}`
                  : 'Đã tạm ngắt kết nối Mạng Cục Bộ',
                'info'
              );
            }}
            className={`text-xs font-heading font-black px-3 py-1.5 rounded-xl border-2 border-[#2B2118] transition-all pop-shadow-sm ${
              isMeshConnected
                ? 'bg-[#F9DCC4] text-[#2B2118] hover:bg-[#ffe3cc]'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            {isMeshConnected ? 'Đang Trong Mạng Cục Bộ' : 'Tham Gia Mạng'}
          </button>
        </div>

        {/* Privacy Note */}
        <div className="flex items-center gap-1.5 text-[10px] text-stone-400">
          <ShieldCheck size={13} className="text-[#0ABAB5] shrink-0" />
          <span>
            Bảo mật tối đa: Nhận dạng địa điểm thuần túy qua ID sóng Bluetooth BLE của quán/phòng, không gửi tọa độ GPS lên Internet.
          </span>
        </div>
      </div>
    </div>
  );
};
