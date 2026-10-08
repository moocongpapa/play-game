export const PLAY_THEMES = [
  { id: 'picnic', name: '과일 소풍', sky: '#FCEACF', items: [
    { id: 'apple', name: '사과', emoji: '🍎' }, { id: 'banana', name: '바나나', emoji: '🍌' },
    { id: 'grape', name: '포도', emoji: '🍇' }, { id: 'orange', name: '귤', emoji: '🍊' },
    { id: 'pear', name: '배', emoji: '🍐' }, { id: 'peach', name: '복숭아', emoji: '🍑' },
    { id: 'cherries', name: '체리', emoji: '🍒' }, { id: 'strawberry', name: '딸기', emoji: '🍓' },
  ] },
  { id: 'forest', name: '숲속 친구들', sky: '#E0F0DC', items: [
    { id: 'rabbit', name: '토끼', emoji: '🐰' }, { id: 'bear', name: '곰', emoji: '🐻' },
    { id: 'dog', name: '강아지', emoji: '🐶' }, { id: 'cat', name: '고양이', emoji: '🐱' },
    { id: 'turtle', name: '거북이', emoji: '🐢' }, { id: 'butterfly', name: '나비', emoji: '🦋' },
    { id: 'dino', name: '공룡', emoji: '🦖' }, { id: 'lion', name: '사자', emoji: '🦁' },
  ] },
  { id: 'journey', name: '출발! 여행', sky: '#E1EDF9', items: [
    { id: 'car', name: '자동차', emoji: '🚗' }, { id: 'train', name: '기차', emoji: '🚂' },
    { id: 'plane', name: '비행기', emoji: '✈️' }, { id: 'rocket', name: '로켓', emoji: '🚀' },
    { id: 'bus', name: '버스', emoji: '🚌' }, { id: 'firetruck', name: '소방차', emoji: '🚒' },
    { id: 'police', name: '경찰차', emoji: '🚓' }, { id: 'star', name: '별', emoji: '⭐' },
  ] },
  { id: 'dream', name: '바다와 하늘', sky: '#E9E4F6', items: [
    { id: 'penguin', name: '펭귄', emoji: '🐧' }, { id: 'fish', name: '물고기', emoji: '🐟' },
    { id: 'turtle', name: '거북이', emoji: '🐢' }, { id: 'duck', name: '오리', emoji: '🦆' },
    { id: 'moon', name: '달', emoji: '🌙' }, { id: 'sun', name: '해', emoji: '☀️' },
    { id: 'cloud', name: '구름', emoji: '☁️' }, { id: 'heart', name: '하트', emoji: '💖' },
  ] },
];

export const EMOTION_SCENES: Record<string, { id: string; text: string; emoji: string }[]> = {
  happy: [
    { id: 'birthday', text: '생일 케이크를 받아서 기뻐요!', emoji: '🎂' },
    { id: 'butterfly', text: '나비 친구가 와서 기뻐요!', emoji: '🦋' },
    { id: 'picnic', text: '소풍을 가서 기뻐요!', emoji: '🍎' },
  ],
  sad: [
    { id: 'toy', text: '곰인형을 잃어버려서 슬퍼요.', emoji: '🧸' },
    { id: 'home', text: '친구와 헤어져서 슬퍼요.', emoji: '🐰' },
    { id: 'balloon', text: '풍선이 날아가서 슬퍼요.', emoji: '🎈' },
  ],
  angry: [
    { id: 'car', text: '차례를 빼앗겨서 화가 나요.', emoji: '🚗' },
    { id: 'sand', text: '만든 성이 무너져서 화가 나요.', emoji: '🏰' },
    { id: 'toy', text: '장난감을 가져가서 화가 나요.', emoji: '🚂' },
  ],
  surprised: [
    { id: 'gift', text: '깜짝 선물을 보고 놀랐어요!', emoji: '🎁' },
    { id: 'dino', text: '커다란 공룡을 보고 놀랐어요!', emoji: '🦖' },
    { id: 'rocket', text: '로켓이 날아가서 놀랐어요!', emoji: '🚀' },
  ],
  scared: [
    { id: 'night', text: '캄캄한 밤이라 조금 무서워요.', emoji: '🌙' },
    { id: 'thunder', text: '천둥이 쳐서 조금 무서워요.', emoji: '☁️' },
    { id: 'lion', text: '큰 소리를 듣고 조금 무서워요.', emoji: '🦁' },
  ],
  tired: [
    { id: 'moon', text: '밤이 되어 졸려요.', emoji: '🌙' },
    { id: 'walk', text: '오래 걸어서 피곤해요.', emoji: '🐢' },
    { id: 'play', text: '신나게 놀고 쉬고 싶어요.', emoji: '⚽' },
  ],
  shy: [
    { id: 'friend', text: '처음 만난 친구 앞에서 부끄러워요.', emoji: '🐧' },
    { id: 'song', text: '노래를 들려주려니 부끄러워요.', emoji: '⭐' },
    { id: 'flower', text: '칭찬을 받아서 볼이 빨개졌어요.', emoji: '🌸' },
  ],
  excited: [
    { id: 'trip', text: '기차 여행을 가서 신나요!', emoji: '🚂' },
    { id: 'balloon', text: '풍선 놀이를 해서 신나요!', emoji: '🎈' },
    { id: 'dance', text: '친구와 춤추니 신나요!', emoji: '🐰' },
  ],
  love: [
    { id: 'hug', text: '따뜻하게 안아주고 싶어요. 사랑해요!', emoji: '💖' },
    { id: 'puppy', text: '강아지 친구를 사랑해요!', emoji: '🐶' },
    { id: 'family', text: '우리 가족을 사랑해요!', emoji: '❤️' },
  ],
};
