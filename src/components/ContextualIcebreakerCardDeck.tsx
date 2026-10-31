import React, { useState } from 'react';
import {
  Sparkles,
  RefreshCw,
  Award,
  Coffee,
  Utensils,
  BookOpen,
  Home,
  MessageCircle,
  Flame,
  CheckCircle2,
  ChevronRight,
  Shuffle,
  Volume2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { VenueType } from './BluetoothSyncPanel';

export interface IcebreakerCard {
  id: string;
  category: string;
  categoryIcon: string;
  topicTitle: string;
  question: string;
  followUp: string;
  starsReward: number;
  bgGradient: string;
  badge: string;
}

const CONTEXT_DECKS: Record<VenueType, IcebreakerCard[]> = {
  cafe: [
    {
      id: 'cafe-1',
      category: 'Kỷ Niệm & Cảm Xúc',
      categoryIcon: '☕',
      topicTitle: 'Khoảnh Khắc Cười Ra Nước Mắt',
      question: 'Kỷ niệm "ngố tàu" hoặc buồn cười nhất mà bạn từng trải qua cùng bạn bè thời đi học là gì?',
      followUp: 'Nếu được quay video ngắn 10 giây tái hiện khoảnh khắc đó, bạn sẽ diễn lại cảnh nào?',
      starsReward: 5,
      bgGradient: 'from-amber-100 via-orange-50 to-amber-200',
      badge: 'Bistro & Chill 🧋',
    },
    {
      id: 'cafe-2',
      category: 'Ước Mơ & Tương Lai',
      categoryIcon: '🚀',
      topicTitle: 'Cánh Cửa Thần Kỳ',
      question: 'Nếu có một cánh cửa thần kỳ đưa bạn đến bất kỳ thành phố nào trên thế giới trong 1 ngày, bạn sẽ chọn đi đâu và rủ ai đi cùng?',
      followUp: 'Món ăn địa phương đầu tiên bạn muốn thử khi vừa bước ra khỏi cánh cửa đó là gì?',
      starsReward: 5,
      bgGradient: 'from-purple-100 via-pink-50 to-purple-200',
      badge: 'Deep Talk 🌌',
    },
    {
      id: 'cafe-3',
      category: 'Gu Ẩm Thực & Trà Sữa',
      categoryIcon: '🧋',
      topicTitle: 'Công Thức "Chân Ái"',
      question: 'Món nước "ruột" bạn luôn gọi mỗi khi ra quán cà phê là gì? Bạn có thói quen ăn uống kỳ lạ nào không?',
      followUp: 'Hãy thử đoán xem người đối diện thích uống trà sữa bao nhiêu % đường và đá?',
      starsReward: 5,
      bgGradient: 'from-emerald-100 via-teal-50 to-emerald-200',
      badge: 'Thấu Hiểu Bạn Bè 🍰',
    },
    {
      id: 'cafe-4',
      category: 'Âm Nhạc & Chữa Lành',
      categoryIcon: '🎧',
      topicTitle: 'Giai Điệu Tuổi Trẻ',
      question: 'Bài hát nào bạn có thể nghe đi nghe lại 100 lần mà không bao giờ thấy chán?',
      followUp: 'Bài hát đó gắn liền với mùa hè, chuyến đi hay một người đặc biệt nào?',
      starsReward: 5,
      bgGradient: 'from-blue-100 via-indigo-50 to-blue-200',
      badge: 'Giai Điệu 🎶',
    },
  ],
  dining: [
    {
      id: 'dining-1',
      category: 'Gia Đình & Bữa Cơm',
      categoryIcon: '🍽️',
      topicTitle: 'Món Ăn Nhớ Mãi',
      question: 'Món ăn do mẹ, ba hoặc người thân nấu mà bạn cảm thấy ngon nhất và luôn thèm mỗi khi đi xa?',
      followUp: 'Bạn có biết bí quyết hoặc gia vị đặc biệt nào làm nên món đó không?',
      starsReward: 5,
      bgGradient: 'from-orange-100 via-amber-50 to-orange-200',
      badge: 'Bàn Ăn Ấm Cúng 🍲',
    },
    {
      id: 'dining-2',
      category: 'Thói Quen Đáng Yêu',
      categoryIcon: '🏡',
      topicTitle: 'Truyền Thống Gia Đình',
      question: 'Gia đình mình có một thói quen hoặc câu nói cửa miệng nào vừa hài hước vừa ấm áp không?',
      followUp: 'Điều gì ở gia đình làm bạn cảm thấy tự hào và biết ơn nhất?',
      starsReward: 5,
      bgGradient: 'from-amber-100 via-yellow-50 to-amber-200',
      badge: 'Gắn Kết Thế Hệ ❤️',
    },
    {
      id: 'dining-3',
      category: 'Chuyến Đi Cả Nhà',
      categoryIcon: '🚗',
      topicTitle: 'Chuyến Du Lịch Đáng Nhớ',
      question: 'Kỷ niệm chuyến đi chơi xa cùng cả nhà mà bạn nhớ nhất từ nhỏ đến giờ?',
      followUp: 'Nếu được lên kế hoạch cho chuyến đi tiếp theo của cả nhà, bạn muốn đi biển hay lên núi?',
      starsReward: 5,
      bgGradient: 'from-rose-100 via-orange-50 to-rose-200',
      badge: 'Kỷ Niệm Gia Đình 🏖️',
    },
  ],
  library: [
    {
      id: 'lib-1',
      category: 'Thử Thách 60 Giây',
      categoryIcon: '⏱️',
      topicTitle: 'Đố Nhanh Siêu Tốc',
      question: 'Trong 30 giây, hãy kể tên 5 từ vựng, định luật hoặc công thức mà bạn vừa học trong tuần này!',
      followUp: 'Người đối diện hãy chấm điểm xem bạn nhớ chính xác bao nhiêu phần trăm nhé!',
      starsReward: 5,
      bgGradient: 'from-sky-100 via-blue-50 to-sky-200',
      badge: 'Học Nhóm 60s 📚',
    },
    {
      id: 'lib-2',
      category: 'Mẹo Học Tập & Tập Trung',
      categoryIcon: '💡',
      topicTitle: 'Bí Kíp Chống Buồn Ngủ',
      question: 'Phương pháp nào giúp bạn lấy lại 100% sự tập trung khi học bài bị xao nhãng hoặc buồn ngủ?',
      followUp: 'Bạn học hiệu quả nhất vào sáng sớm hay đêm muộn? Chia sẻ kinh nghiệm cho bạn bè nhé!',
      starsReward: 5,
      bgGradient: 'from-indigo-100 via-purple-50 to-indigo-200',
      badge: 'Deep Work 🧠',
    },
    {
      id: 'lib-3',
      category: 'Mục Tiêu & Động Lực',
      categoryIcon: '🎯',
      topicTitle: 'Cùng Nhau Chinh Phục',
      question: 'Mục tiêu lớn nhất hoặc kỳ thi sắp tới mà bạn muốn đạt kết quả thật cao là gì?',
      followUp: 'Chúng mình có thể hỗ trợ hoặc cùng nhắc nhở nhau điều gì để cùng về đích?',
      starsReward: 5,
      bgGradient: 'from-teal-100 via-emerald-50 to-teal-200',
      badge: 'Đồng Đội Học Tập 🏆',
    },
  ],
  home: [
    {
      id: 'home-1',
      category: 'Lắng Nghe Người Thân',
      categoryIcon: '🏠',
      topicTitle: 'Thời Ba Mẹ Bằng Tuổi Con',
      question: 'Hồi bằng tuổi con/cháu bây giờ, ba mẹ hoặc người lớn thích chơi trò gì và ước mơ làm nghề gì?',
      followUp: 'Thời chưa có điện thoại thông minh, mọi người liên lạc và hẹn gặp nhau như thế nào?',
      starsReward: 5,
      bgGradient: 'from-emerald-100 via-green-50 to-emerald-200',
      badge: 'Lắng Nghe 🌿',
    },
    {
      id: 'home-2',
      category: 'Bức Ảnh Gia Đình',
      categoryIcon: '🖼️',
      topicTitle: 'Bức Ảnh Cũ Nhất',
      question: 'Bức ảnh kỷ niệm cũ nhất trong album gia đình bạn từng xem được chụp ở đâu và có những ai?',
      followUp: 'Hãy cùng nhìn lại hoặc miêu tả lại nụ cười của mọi người trong bức ảnh đó!',
      starsReward: 5,
      bgGradient: 'from-amber-100 via-rose-50 to-amber-200',
      badge: 'Hoài Niệm Xưa 📷',
    },
  ],
};

interface Props {
  initialVenue?: VenueType;
  onSelectTopic?: (topic: IcebreakerCard) => void;
  compact?: boolean;
}

export const ContextualIcebreakerCardDeck: React.FC<Props> = ({
  initialVenue = 'cafe',
  onSelectTopic,
  compact = false,
}) => {
  const { addStars, showToast } = useApp();

  const [currentVenue, setCurrentVenue] = useState<VenueType>(initialVenue);
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [discussedCards, setDiscussedCards] = useState<string[]>([]);

  const deck = CONTEXT_DECKS[currentVenue] || CONTEXT_DECKS.cafe;
  const currentCard = deck[cardIndex % deck.length];
  const isDiscussed = discussedCards.includes(currentCard.id);

  const handleNextCard = () => {
    setIsShuffling(true);
    setIsFlipped(false);
    setTimeout(() => {
      setCardIndex((prev) => (prev + 1) % deck.length);
      setIsShuffling(false);
    }, 250);
  };

  const handleClaimDiscussionStars = () => {
    if (isDiscussed) return;
    setDiscussedCards((prev) => [...prev, currentCard.id]);
    addStars(currentCard.starsReward, `Hoàn thành chủ đề: ${currentCard.topicTitle}`);
    showToast(`Tuyệt vời! Cả bàn đã cùng thảo luận và nhận +${currentCard.starsReward} ⭐!`, 'success');
  };

  return (
    <div className={`bg-white border-[3px] border-[#2B2118] rounded-3xl p-4 sm:p-5 pop-shadow space-y-3.5 ${compact ? 'text-xs' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-[#DFB2FA] text-[#2B2118] border-2 border-[#2B2118] flex items-center justify-center font-black pop-shadow-sm text-lg">
            🎴
          </div>
          <div>
            <h3 className="font-heading font-black text-sm sm:text-base text-[#2B2118] flex items-center gap-1.5">
              <span>BỘ BÀI KHƠI GỢI CHỦ ĐỀ THEO BỐI CẢNH</span>
              <span className="text-[10px] bg-[#DFB2FA] text-[#2B2118] px-2 py-0.5 rounded-full border border-[#2B2118] font-bold">
                Icebreaker
              </span>
            </h3>
            <p className="text-[11px] text-stone-600 font-medium">
              Tự động gợi ý câu hỏi thảo luận phù hợp với vị trí Bluetooth bạn đang ngồi
            </p>
          </div>
        </div>

        {/* Venue Filter Tabs */}
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-2xl border-2 border-stone-300">
          <button
            onClick={() => {
              setCurrentVenue('cafe');
              setCardIndex(0);
              setIsFlipped(false);
            }}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
              currentVenue === 'cafe'
                ? 'bg-[#0ABAB5] text-white font-black pop-shadow-sm'
                : 'text-stone-600 hover:text-black'
            }`}
            title="Quán Cà Phê"
          >
            ☕ Cà Phê
          </button>
          <button
            onClick={() => {
              setCurrentVenue('dining');
              setCardIndex(0);
              setIsFlipped(false);
            }}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
              currentVenue === 'dining'
                ? 'bg-[#F9DCC4] text-[#2B2118] font-black pop-shadow-sm'
                : 'text-stone-600 hover:text-black'
            }`}
            title="Bàn Ăn Gia Đình"
          >
            🍽️ Bàn Ăn
          </button>
          <button
            onClick={() => {
              setCurrentVenue('library');
              setCardIndex(0);
              setIsFlipped(false);
            }}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
              currentVenue === 'library'
                ? 'bg-[#CFE3DC] text-[#2B2118] font-black pop-shadow-sm'
                : 'text-stone-600 hover:text-black'
            }`}
            title="Thư Viện / Tự Học"
          >
            📚 Tự Học
          </button>
          <button
            onClick={() => {
              setCurrentVenue('home');
              setCardIndex(0);
              setIsFlipped(false);
            }}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
              currentVenue === 'home'
                ? 'bg-[#DFB2FA] text-[#2B2118] font-black pop-shadow-sm'
                : 'text-stone-600 hover:text-black'
            }`}
            title="Phòng Khách Gia Đình"
          >
            🏠 Nhà
          </button>
        </div>
      </div>

      {/* Main Interactive Flip Card */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className={`relative w-full cursor-pointer select-none transition-all duration-300 rounded-3xl border-[3px] border-[#2B2118] p-5 sm:p-6 pop-shadow bg-gradient-to-br ${currentCard.bgGradient} ${
          isShuffling ? 'scale-95 opacity-50 rotate-1' : 'hover:-translate-y-0.5'
        }`}
      >
        <div className="space-y-3">
          {/* Card Top Pill */}
          <div className="flex items-center justify-between">
            <span className="bg-white text-[#2B2118] text-xs font-heading font-black px-3 py-1 rounded-full border-2 border-[#2B2118] pop-shadow-sm flex items-center gap-1.5">
              <span>{currentCard.categoryIcon}</span>
              <span>{currentCard.category}</span>
            </span>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono text-stone-600 font-bold">
                Thẻ #{cardIndex + 1}/{deck.length}
              </span>
              <span className="text-xs bg-[#2B2118] text-white px-2 py-0.5 rounded-full font-bold">
                +{currentCard.starsReward} ⭐
              </span>
            </div>
          </div>

          {/* Card Title & Main Question */}
          <div className="space-y-2 py-1">
            <h4 className="font-heading font-black text-lg sm:text-xl text-[#2B2118] leading-tight">
              {currentCard.topicTitle}
            </h4>
            <p className="font-body font-bold text-sm sm:text-base text-stone-800 leading-relaxed">
              "{currentCard.question}"
            </p>
          </div>

          {/* Follow up prompt or Tip (Revealed on flip / view) */}
          <div className="bg-white/80 border-2 border-[#2B2118] rounded-2xl p-3 space-y-1">
            <span className="font-heading font-black text-xs text-[#0ABAB5] block flex items-center gap-1">
              <span>💡</span> Gợi ý khơi gợi thêm câu chuyện:
            </span>
            <p className="text-xs font-medium text-stone-700 italic leading-snug">
              {currentCard.followUp}
            </p>
          </div>

          <div className="flex items-center justify-between text-[11px] text-stone-600 pt-1">
            <span className="font-bold flex items-center gap-1">
              <Sparkles size={12} className="text-amber-500" />
              <span>Chạm thẻ để lật hoặc đổi câu hỏi</span>
            </span>
            <span className="text-stone-500 italic">Bối cảnh: {currentCard.badge}</span>
          </div>
        </div>
      </div>

      {/* Card Controls & Actions */}
      <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
        <button
          onClick={handleNextCard}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-stone-50 text-[#2B2118] font-heading font-black text-xs sm:text-sm rounded-2xl border-2 border-[#2B2118] pop-shadow-sm transition-all active:translate-x-0.5 active:translate-y-0.5"
        >
          <Shuffle size={15} />
          <span>Rút Lá Bài Khác</span>
        </button>

        <button
          onClick={handleClaimDiscussionStars}
          disabled={isDiscussed}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl font-heading font-black text-xs sm:text-sm border-2 border-[#2B2118] transition-all pop-shadow-sm active:translate-x-0.5 active:translate-y-0.5 ${
            isDiscussed
              ? 'bg-emerald-100 text-emerald-800 cursor-default'
              : 'bg-[#0ABAB5] hover:bg-[#089e9a] text-white'
          }`}
        >
          {isDiscussed ? <CheckCircle2 size={16} /> : <Award size={16} />}
          <span>{isDiscussed ? 'Đã Nhận +5 ⭐ Cả Bàn' : '✨ Cả Bàn Đã Trò Chuyện (+5 ⭐)'}</span>
        </button>
      </div>
    </div>
  );
};
