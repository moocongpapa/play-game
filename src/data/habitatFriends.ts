export type HabitatKind = 'garden' | 'aquarium';
export interface HabitatFriend {
  id: string; name: string; color: string; motion: 'crawl' | 'flutter' | 'hop' | 'swim' | 'float';
  speed: number; greeting: string; reaction: string; large?: boolean;
}
export const GARDEN_FRIENDS: readonly HabitatFriend[] = [
  { id: 'ladybug', name: '무당벌레', color: '#e99793', motion: 'crawl', speed: 9, greeting: '빨간 날개에 동글동글 점이 있어!', reaction: '뽈뽈, 안녕!' },
  { id: 'butterfly', name: '나비', color: '#b6a5d9', motion: 'flutter', speed: 17, greeting: '팔랑팔랑! 꽃을 만나러 가자!', reaction: '팔랑팔랑!' },
  { id: 'caterpillar', name: '애벌레', color: '#adc787', motion: 'crawl', speed: 7, greeting: '꼬물꼬물! 나뭇잎이 좋아!', reaction: '꼬물꼬물!' },
  { id: 'bee', name: '꿀벌', color: '#e7c16d', motion: 'flutter', speed: 19, greeting: '윙윙! 달콤한 꽃을 찾았어!', reaction: '윙윙, 반가워!' },
  { id: 'snail', name: '달팽이', color: '#d1ac8d', motion: 'crawl', speed: 5, greeting: '내 등에 동그란 집이 있어! 천천히 같이 가자!', reaction: '느릿느릿~' },
  { id: 'beetle', name: '풍뎅이', color: '#90bca5', motion: 'crawl', speed: 10, greeting: '반짝이는 초록 날개! 씩씩하게 걸어 보자!', reaction: '영차, 영차!' },
  { id: 'ant', name: '개미', color: '#bd9589', motion: 'crawl', speed: 14, greeting: '작은 발로 총총총! 함께 산책하자!', reaction: '총총총!' },
  { id: 'cricket', name: '귀뚜라미', color: '#b7c991', motion: 'hop', speed: 13, greeting: '긴 뒷다리로 폴짝! 높이 뛰어볼까?', reaction: '폴짝, 폴짝!' },
];
export const AQUARIUM_FRIENDS: readonly HabitatFriend[] = [
  { id: 'clownfish', name: '흰동가리', color: '#edb182', motion: 'swim', speed: 17, greeting: '주황 옷에 하얀 줄무늬! 뻐끔뻐끔, 안녕!', reaction: '뻐끔뻐끔!' },
  { id: 'bluefish', name: '파랑물고기', color: '#8eb9d6', motion: 'swim', speed: 22, greeting: '파란 몸에 노란 꼬리! 살랑살랑 헤엄쳐!', reaction: '살랑살랑!' },
  { id: 'angelfish', name: '줄무늬물고기', color: '#e8c97f', motion: 'swim', speed: 13, greeting: '예쁜 지느러미를 펼치고 둥실둥실!', reaction: '둥실둥실!' },
  { id: 'pufferfish', name: '복어', color: '#d5c189', motion: 'float', speed: 10, greeting: '동글동글, 풍선처럼 귀여운 복어야!', reaction: '동글, 통통!' },
  { id: 'shark', name: '상어', color: '#96b5c6', motion: 'swim', speed: 20, greeting: '나는 상어! 멋진 지느러미로 슝 헤엄쳐!', reaction: '슝! 안녕!' , large: true },
  { id: 'whale', name: '고래', color: '#a1b9d9', motion: 'swim', speed: 10, greeting: '커다란 몸으로 느긋하게! 고래 친구야!', reaction: '느긋느긋~', large: true },
  { id: 'octopus', name: '문어', color: '#c2a5d8', motion: 'float', speed: 10, greeting: '여덟 팔로 흔들흔들! 반가워!', reaction: '흔들흔들!' },
  { id: 'squid', name: '오징어', color: '#e4afab', motion: 'swim', speed: 16, greeting: '길쭉한 몸에 팔랑 지느러미! 쏙쏙 헤엄쳐!', reaction: '쏙쏙, 안녕!' },
  { id: 'jellyfish', name: '해파리', color: '#c9b8dd', motion: 'float', speed: 6, greeting: '투명한 우산처럼 몽실몽실 떠다녀!', reaction: '몽실몽실~' },
  { id: 'turtle', name: '바다거북', color: '#a4c39c', motion: 'swim', speed: 9, greeting: '튼튼한 등껍질! 넓은 바다를 함께 헤엄치자!', reaction: '유유히~' },
  { id: 'seahorse', name: '해마', color: '#e2ba89', motion: 'float', speed: 7, greeting: '돌돌 말린 꼬리! 해마라고 해!', reaction: '꼬리 돌돌!' },
  { id: 'ray', name: '가오리', color: '#b3bacf', motion: 'swim', speed: 12, greeting: '넓은 지느러미를 날개처럼 훨훨!', reaction: '훨훨, 안녕!' },
];
export const HABITAT_FRIENDS = { garden: GARDEN_FRIENDS, aquarium: AQUARIUM_FRIENDS } as const;
export const MAX_HABITAT_FRIENDS = 18;
