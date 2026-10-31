import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import QRCode from 'qrcode';

export const VoucherModal: React.FC = () => {
  const { redeemedVoucher, setRedeemedVoucher } = useApp();
  const [dataUrl, setDataUrl] = useState<string>('');

  const voucherCode = React.useMemo(() => {
    return `CM-VOUCHER-${Math.floor(100000 + Math.random() * 900000)}`;
  }, [redeemedVoucher]);

  useEffect(() => {
    if (!redeemedVoucher) return;
    let isMounted = true;
    
    // Generate ISO/IEC 18004 scannable QR code DataURL
    QRCode.toDataURL(voucherCode, {
      margin: 2,
      width: 280,
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
        console.error('Voucher QR generation error:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [redeemedVoucher, voucherCode]);

  if (!redeemedVoucher) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl border-[3px] border-[#2B2118] pop-shadow p-6 text-[#2B2118] text-center animate-pop-in">
        <div className="w-16 h-16 rounded-2xl bg-[#CFE3DC] border-2 border-[#2B2118] flex items-center justify-center text-4xl mx-auto mb-3 pop-shadow-sm">
          {redeemedVoucher.icon}
        </div>

        <span className="text-xs font-black uppercase tracking-wider text-[#0ABAB5] bg-[#0ABAB5]/10 px-3 py-1 rounded-full border border-[#0ABAB5]/20">
          Voucher Căng-tin Trường
        </span>

        <h3 className="font-heading font-black text-xl mt-2 mb-1">
          {redeemedVoucher.name}
        </h3>
        <p className="text-xs text-stone-500 mb-4">
          Đã trừ {redeemedVoucher.cost} ⭐ và tích hợp trực tiếp vào Thẻ Học Sinh.
        </p>

        {/* Real Scannable ISO-Standard QR Code */}
        <div className="bg-[#F8EFE8] border-2 border-dashed border-[#2B2118] rounded-2xl p-4 mb-4 flex flex-col items-center">
          <div className="w-36 h-36 bg-white border-2 border-[#2B2118] p-1.5 rounded-xl flex items-center justify-center mb-2 overflow-hidden pop-shadow-sm">
            {dataUrl ? (
              <img
                src={dataUrl}
                alt={`Mã Voucher: ${voucherCode}`}
                className="w-full h-full object-contain rounded-lg"
              />
            ) : (
              <span className="text-xs font-mono text-stone-400">Đang tạo mã...</span>
            )}
          </div>
          <span className="text-[11px] font-mono-code font-bold text-stone-700 bg-white px-2.5 py-1 rounded-lg border border-stone-300">
            {voucherCode}
          </span>
        </div>

        <button
          onClick={() => setRedeemedVoucher(null)}
          className="w-full py-2.5 bg-[#0ABAB5] hover:bg-[#089e9a] text-white font-heading font-black text-sm rounded-xl border-2 border-[#2B2118] pop-shadow btn-press transition-all"
        >
          Tuyệt Vời, Cảm Ơn!
        </button>
      </div>
    </div>
  );
};
