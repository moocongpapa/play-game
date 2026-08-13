import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Star, Calendar, ArrowRight, User } from 'lucide-react';
import { JellyButton } from '../components/JellyButton';
import { calculateAgeMonths, determineAgeGroup, getAgeGroupLabel, getAgeGroupEmoji, getAgeGroupDescription } from '../utils/ageEngine';
import { ChildProfile } from '../types';
import { speakText, playCorrectFanfare } from '../utils/soundEngine';

interface OnboardingScreenProps {
  onCompleteOnboarding: (profile: ChildProfile) => void;
  soundEnabled: boolean;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onCompleteOnboarding,
  soundEnabled,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState('');
  
  // Birth date select states
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear - 3);
  const [month, setMonth] = useState(1);
  const [day, setDay] = useState(1);
  
  const [computedProfile, setComputedProfile] = useState<ChildProfile | null>(null);

  const handleNextStep1 = () => {
    if (!name.trim()) {
      speakText('이름을 입력해주세요!', soundEnabled);
      return;
    }
    speakText(`${name}야 만나서 반가워! 생일이 언제인지 알려줄래?`, soundEnabled);
    setStep(2);
  };

  const handleCalculateAge = () => {
    const formattedMonth = String(month).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const birthDateStr = `${year}-${formattedMonth}-${formattedDay}`;
    
    const ageMonths = calculateAgeMonths(birthDateStr);
    const ageGroup = determineAgeGroup(ageMonths);
    
    const profile: ChildProfile = {
      name: name.trim(),
      birthDate: birthDateStr,
      ageMonths,
      ageGroup,
    };
    
    setComputedProfile(profile);
    playCorrectFanfare(soundEnabled);
    
    const label = getAgeGroupLabel(ageGroup);
    const emoji = getAgeGroupEmoji(ageGroup);
    speakText(`우와! ${name}는 ${ageMonths} 개월이구나! ${label} ${emoji} 동생들과 재미있게 놀아보자!`, soundEnabled);
    
    setStep(3);
  };

  const handleFinish = () => {
    if (computedProfile) {
      onCompleteOnboarding(computedProfile);
    }
  };

  const years = Array.from({ length: 7 }, (_, i) => currentYear - 6 + i); // 6 years range
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-[#FFF59D] via-[#FFE082] to-[#FFB74D] select-none overflow-hidden">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border-4 border-[#FFA000] shadow-2xl text-center flex flex-col justify-between min-h-[480px]">
        
        {/* Step progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                step === s ? 'bg-[#FF9E4A] w-6' : 'bg-amber-100 border border-amber-300'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="flex-1 flex flex-col justify-between"
            >
              <div>
                <div className="inline-flex p-3 rounded-full bg-amber-50 text-[#FF9E4A] mb-3 border border-amber-200">
                  <User className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black text-[#4A3E3D] mb-1">안녕! 네 이름은 뭐니?</h2>
                <p className="text-sm font-bold text-[#8C7B79] mb-6">
                  동물 친구들이 부를 수 있도록 이름을 입력해주세요.
                </p>

                <div className="relative max-w-xs mx-auto">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value.slice(0, 8))}
                    placeholder="이름 입력"
                    className="w-full px-5 py-4 rounded-2xl border-3 border-amber-200 focus:border-[#FF9E4A] focus:outline-none text-xl font-black text-center text-[#4A3E3D] placeholder-amber-200 bg-amber-50/30"
                  />
                </div>
              </div>

              <JellyButton
                variant="primary"
                size="lg"
                onClick={handleNextStep1}
                className="w-full mt-6"
              >
                반가워, 다음으로! <ArrowRight className="w-5 h-5 ml-1.5" />
              </JellyButton>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="flex-1 flex flex-col justify-between"
            >
              <div>
                <div className="inline-flex p-3 rounded-full bg-amber-50 text-[#FF9E4A] mb-3 border border-amber-200">
                  <Calendar className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black text-[#4A3E3D] mb-1">생일이 언제인가요?</h2>
                <p className="text-sm font-bold text-[#8C7B79] mb-6">
                  {name}의 나이에 맞춰 재미있는 놀이를 보여줄게요!
                </p>

                <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-[#8C7B79] mb-1">년도</label>
                    <select
                      value={year}
                      onChange={(e) => setYear(Number(e.target.value))}
                      className="px-2 py-3 rounded-xl border-2 border-amber-200 focus:outline-none focus:border-[#FF9E4A] text-base font-black text-[#4A3E3D] bg-white cursor-pointer"
                    >
                      {years.map((y) => (
                        <option key={y} value={y}>{y}년</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-[#8C7B79] mb-1">월</label>
                    <select
                      value={month}
                      onChange={(e) => setMonth(Number(e.target.value))}
                      className="px-2 py-3 rounded-xl border-2 border-amber-200 focus:outline-none focus:border-[#FF9E4A] text-base font-black text-[#4A3E3D] bg-white cursor-pointer"
                    >
                      {months.map((m) => (
                        <option key={m} value={m}>{m}월</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-[#8C7B79] mb-1">일</label>
                    <select
                      value={day}
                      onChange={(e) => setDay(Number(e.target.value))}
                      className="px-2 py-3 rounded-xl border-2 border-amber-200 focus:outline-none focus:border-[#FF9E4A] text-base font-black text-[#4A3E3D] bg-white cursor-pointer"
                    >
                      {days.map((d) => (
                        <option key={d} value={d}>{d}일</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <JellyButton
                variant="primary"
                size="lg"
                onClick={handleCalculateAge}
                className="w-full mt-6"
              >
                놀이 분석하기 <Sparkles className="w-5 h-5 ml-1.5" />
              </JellyButton>
            </motion.div>
          )}

          {step === 3 && computedProfile && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col justify-between"
            >
              <div>
                <div className="text-6xl mb-3 animate-bounce">
                  {getAgeGroupEmoji(computedProfile.ageGroup)}
                </div>
                <h2 className="text-2xl font-black text-[#4A3E3D] mb-1">
                  {computedProfile.name}이는 <span className="text-[#FF9E4A]">{getAgeGroupLabel(computedProfile.ageGroup)}</span>!
                </h2>
                <p className="text-base font-bold text-[#8C7B79] mb-6">
                  {computedProfile.ageMonths} 개월 ({getAgeGroupDescription(computedProfile.ageGroup)})
                </p>

                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-left max-w-xs mx-auto">
                  <div className="flex items-start gap-2">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-black text-amber-800 block">맞춤 학습 난이도 배정</span>
                      <p className="text-xs font-bold text-[#6D4C41] mt-0.5 break-keep">
                        {computedProfile.ageGroup === 'baby' && '가장 귀엽고 단순한 2지선다 퀴즈가 펼쳐집니다!'}
                        {computedProfile.ageGroup === 'sprout' && '재미있는 기초 인지, 수 세기와 3지선다 퍼즐을 시작해요!'}
                        {computedProfile.ageGroup === 'bloom' && '단어 퍼즐과 리듬 맞추기, 조금 더 어려운 4지선다 놀이에요!'}
                        {computedProfile.ageGroup === 'star' && '시간제한과 도전적인 심화 낱말/패턴 퍼즐이 시작됩니다!'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <JellyButton
                variant="primary"
                size="lg"
                onClick={handleFinish}
                className="w-full mt-6"
              >
                놀이터로 출발! 🚀
              </JellyButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
