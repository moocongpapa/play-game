import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Lock, X } from 'lucide-react';
import { JellyButton } from './JellyButton';

interface ParentalGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ParentalGateModal: React.FC<ParentalGateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [pressProgress, setPressProgress] = useState(0);
  const [pressInterval, setPressInterval] = useState<number | null>(null);

  const handleTouchStart = () => {
    let current = 0;
    const interval = window.setInterval(() => {
      current += 10;
      setPressProgress(current);
      if (current >= 100) {
        clearInterval(interval);
        setPressInterval(null);
        setPressProgress(0);
        onSuccess();
      }
    }, 150);
    setPressInterval(interval);
  };

  const handleTouchEnd = () => {
    if (pressInterval) {
      clearInterval(pressInterval);
      setPressInterval(null);
    }
    setPressProgress(0);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="relative w-full max-w-md bg-[#FFF9E6] rounded-3xl p-6 border-4 border-[#FFA000] shadow-2xl text-center"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-amber-100 hover:bg-amber-200 text-[#4A3E3D] cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="inline-flex p-4 rounded-full bg-amber-100 text-[#FF9E4A] mb-3">
            <Shield className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-black text-[#4A3E3D] mb-2">부모님 확인 (Parental Gate)</h2>
          <p className="text-base font-bold text-[#8C7B79] mb-6">
            아이가 실수로 설정을 변경하지 않도록<br />
            아래 버튼을 <span className="text-[#FF9E4A] font-black">3초 동안 꾹</span> 눌러주세요.
          </p>

          <div className="relative mb-6">
            <motion.button
              onMouseDown={handleTouchStart}
              onMouseUp={handleTouchEnd}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="w-full py-5 px-6 rounded-2xl bg-gradient-to-r from-[#FFB366] to-[#FF9E4A] text-white font-black text-xl shadow-lg cursor-pointer select-none active:scale-98 transition-transform overflow-hidden relative"
            >
              <div
                className="absolute inset-0 bg-[#E07A26] transition-all"
                style={{ width: `${pressProgress}%` }}
              />
              <span className="relative z-10 flex items-center justify-center gap-2">
                <Lock className="w-6 h-6" /> 꾹 누르고 있기 ({Math.floor(pressProgress / 33)}초)
              </span>
            </motion.button>
          </div>

          <JellyButton variant="white" size="sm" onClick={onClose} className="w-full">
            닫기
          </JellyButton>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
