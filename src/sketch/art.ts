import { extraTemplates } from './art-extra';
export type Region = { id: string; d: string; fixed?: string };
export type Template = {
  id: string;
  name: string;
  category: string;
  emoji: string;
  regions: Region[];
  lines: string[];
};
const ellipse = (x: number, y: number, rx: number, ry: number) =>
  `M ${x - rx} ${y} a ${rx} ${ry} 0 1 0 ${rx * 2} 0 a ${rx} ${ry} 0 1 0 ${-rx * 2} 0 Z`;
const box = (x: number, y: number, w: number, h: number, r = 15) =>
  `M ${x + r} ${y} H ${x + w - r} Q ${x + w} ${y} ${x + w} ${y + r} V ${y + h - r} Q ${x + w} ${y + h} ${x + w - r} ${y + h} H ${x + r} Q ${x} ${y + h} ${x} ${y + h - r} V ${y + r} Q ${x} ${y} ${x + r} ${y} Z`;
const reg = (id: string, d: string, fixed?: string): Region => ({
  id,
  d,
  fixed,
});
const eye = (x: number, y: number) =>
  reg(`eye-${x}`, ellipse(x, y, 5, 7), '#51493f');
function animal(id: string, name: string, emoji: string): Template {
  const ears =
    id === 'rabbit'
      ? [
          reg('ear-left', ellipse(249, 106, 28, 70)),
          reg('ear-right', ellipse(351, 106, 28, 70)),
          reg('inner-left', ellipse(249, 110, 11, 46)),
          reg('inner-right', ellipse(351, 110, 11, 46)),
        ]
      : id === 'cat'
        ? [
            reg('ear-left', 'M 212 182 L 206 90 L 276 143 Z'),
            reg('ear-right', 'M 325 143 L 394 90 L 388 182 Z'),
          ]
        : id === 'dog'
          ? [
              reg('ear-left', ellipse(200, 210, 35, 75)),
              reg('ear-right', ellipse(400, 210, 35, 75)),
            ]
          : [
              reg('ear-left', ellipse(220, 133, 36, 37)),
              reg('ear-right', ellipse(380, 133, 36, 37)),
              reg('inner-left', ellipse(220, 133, 19, 20)),
              reg('inner-right', ellipse(380, 133, 19, 20)),
            ];
  const regions = [
    reg('body', ellipse(300, 311, 83, 81)),
    reg('left-foot', ellipse(244, 372, 38, 22)),
    reg('right-foot', ellipse(356, 372, 38, 22)),
    ...ears,
    reg('face', ellipse(300, 218, 109, 95)),
    reg('belly', ellipse(300, 328, 46, 43)),
    eye(263, 207),
    eye(337, 207),
    reg('nose', ellipse(300, 228, 10, 7)),
    reg('cheek-left', ellipse(238, 235, 15, 9)),
    reg('cheek-right', ellipse(362, 235, 15, 9)),
  ];
  const lines = [
    'M 300 235 V 243 Q 288 256 278 243 M 300 243 Q 312 256 322 243',
  ];
  if (id === 'cat')
    lines.push(
      'M 223 225 L 188 216 M 222 238 L 186 240 M 377 225 L 411 216 M 378 238 L 414 240',
    );
  if (id === 'tiger') {
    regions.push(
      reg('stripe-top', 'M 283 125 L 300 164 L 317 125 Z'),
      reg('stripe-left', 'M 197 198 L 231 213 L 193 223 Z'),
      reg('stripe-right', 'M 403 198 L 369 213 L 407 223 Z'),
    );
  }
  return { id, name, category: '동물', emoji, regions, lines };
}
const fruits: Template[] = [
  {
    id: 'apple',
    name: '사과',
    category: '과일',
    emoji: '🍎',
    regions: [
      reg('stem', box(293, 68, 14, 68, 5)),
      reg('leaf', 'M 305 102 Q 326 48 385 65 Q 369 122 305 102 Z'),
      reg(
        'fruit',
        'M 300 147 C 193 80 139 196 166 277 C 186 353 244 383 300 353 C 356 383 414 353 434 277 C 461 196 407 80 300 147 Z',
      ),
      eye(264, 245),
      eye(336, 245),
    ],
    lines: ['M 281 273 Q 300 294 319 273', 'M 213 179 Q 190 199 191 226'],
  },
  {
    id: 'strawberry',
    name: '딸기',
    category: '과일',
    emoji: '🍓',
    regions: [
      reg(
        'fruit',
        'M 182 146 C 137 214 220 340 300 384 C 380 340 463 214 418 146 Q 360 107 300 135 Q 240 107 182 146 Z',
      ),
      reg(
        'leaves',
        'M 300 143 L 238 104 L 247 145 L 178 147 L 229 182 L 280 162 L 300 203 L 321 162 L 371 182 L 422 147 L 353 145 L 362 104 Z',
      ),
      ...[
        [217, 218],
        [267, 213],
        [331, 214],
        [382, 218],
        [243, 273],
        [358, 273],
        [282, 325],
        [318, 325],
      ].map(([x, y], i) => reg('seed' + i, ellipse(x, y, 5, 9))),
      eye(277, 265),
      eye(323, 265),
    ],
    lines: ['M 285 288 Q 300 303 315 288'],
  },
  {
    id: 'banana',
    name: '바나나',
    category: '과일',
    emoji: '🍌',
    regions: [
      reg(
        'fruit',
        'M 179 116 C 135 254 236 395 372 347 Q 449 323 454 255 L 430 238 C 390 329 224 258 213 128 Z',
      ),
      reg('tip', 'M 179 116 L 188 90 L 217 98 L 213 128 Z'),
      reg('right-tip', 'M 430 238 L 433 213 L 461 219 L 454 255 Z'),
      eye(290, 296),
      eye(344, 307),
    ],
    lines: ['M 204 158 Q 200 290 377 320', 'M 303 326 Q 320 344 334 330'],
  },
  {
    id: 'grapes',
    name: '포도',
    category: '과일',
    emoji: '🍇',
    regions: [
      reg('stem', box(294, 58, 12, 67, 5)),
      reg('leaf', 'M 303 107 Q 362 39 406 90 Q 377 150 303 107 Z'),
      ...[
        [300, 343],
        [265, 282],
        [335, 282],
        [230, 217],
        [300, 220],
        [370, 217],
        [257, 154],
        [343, 154],
      ].map(([x, y], i) => reg('grape' + i, ellipse(x, y, 45, 44))),
      eye(282, 218),
      eye(318, 218),
    ],
    lines: ['M 287 238 Q 300 250 313 238'],
  },
];
function vehicle(id: string, name: string, emoji: string): Template {
  if (id === 'plane')
    return {
      id,
      name,
      emoji,
      category: '탈것',
      regions: [
        reg(
          'wings',
          'M 271 199 L 109 272 Q 98 287 119 292 L 282 267 L 287 337 L 231 367 L 232 385 L 300 370 L 368 385 L 369 367 L 313 337 L 318 267 L 481 292 Q 502 287 491 272 L 329 199 Z',
        ),
        reg(
          'body',
          'M 300 70 C 259 70 266 263 281 340 L 319 340 C 334 263 341 70 300 70 Z',
        ),
        reg(
          'window',
          'M 281 143 Q 300 120 319 143 L 317 176 Q 300 164 283 176 Z',
        ),
      ],
      lines: ['M 288 218 V 242 M 312 218 V 242', 'M 287 293 H 313'],
    };
  const regions = [
    reg('body', box(100, 172, 392, 159, 30)),
    reg('front-window', box(380, 190, 89, 70, 12)),
    reg('wheel-left', ellipse(185, 333, 39, 39)),
    reg('wheel-right', ellipse(407, 333, 39, 39)),
    reg('hub-left', ellipse(185, 333, 17, 17)),
    reg('hub-right', ellipse(407, 333, 17, 17)),
  ];
  const lines = ['M 108 284 H 482', 'M 427 295 H 457'];
  if (id === 'bus') {
    for (let i = 0; i < 3; i++)
      regions.push(reg('window' + i, box(122 + i * 80, 190, 63, 63, 10)));
    regions.push(reg('sign', box(260, 141, 82, 31, 10)));
  }
  if (id === 'police') {
    regions[0] = reg(
      'body',
      'M 104 231 L 171 216 L 208 144 Q 218 131 242 131 H 350 Q 374 131 389 160 L 426 216 H 467 Q 494 216 494 245 V 316 H 104 Z',
    );
    regions[1] = reg('window-left', 'M 222 151 H 287 V 210 H 190 Z');
    regions.push(
      reg('window-right', 'M 307 151 H 351 L 390 210 H 307 Z'),
      reg('light-left', box(267, 107, 35, 25, 5)),
      reg('light-right', box(302, 107, 35, 25, 5)),
      reg(
        'badge',
        'M 294 240 L 305 260 L 327 264 L 311 280 L 315 301 L 294 291 L 273 301 L 277 280 L 261 264 L 283 260 Z',
      ),
    );
  }
  if (id === 'firetruck') {
    regions.push(reg('ladder', box(121, 120, 251, 42, 5)));
    lines.push(
      'M 148 121 V 161 M 186 121 V 161 M 224 121 V 161 M 262 121 V 161 M 300 121 V 161 M 338 121 V 161',
    );
    regions.push(
      reg('door', box(126, 199, 211, 63, 10)),
      reg('siren', box(410, 147, 30, 25, 5)),
    );
  }
  if (id === 'train') {
    regions[0] = reg('engine', box(230, 194, 244, 130, 20));
    regions[1] = reg('cab', box(112, 135, 155, 187, 13));
    regions.push(
      reg('window', box(134, 158, 109, 74, 10)),
      reg('chimney', box(367, 138, 46, 57, 8)),
      reg('roof', box(99, 118, 184, 22, 8)),
      reg('nose', 'M 474 269 L 521 325 H 474 Z'),
      reg('wheel-middle', ellipse(295, 333, 32, 32)),
      reg('smoke-one', ellipse(390, 95, 24, 20)),
      reg('smoke-two', ellipse(438, 61, 31, 25)),
    );
  }
  return { id, name, emoji, category: '탈것', regions, lines };
}
const characters: Template[] = [
  {
    id: 'fairy',
    name: '귀여운 요정',
    emoji: '🧚',
    category: '친구들',
    regions: [
      reg(
        'wing-left',
        'M 283 239 C 157 100 115 241 205 272 C 115 330 217 381 282 274 Z',
      ),
      reg(
        'wing-right',
        'M 317 239 C 443 100 485 241 395 272 C 485 330 383 381 318 274 Z',
      ),
      reg('left-leg', box(272, 323, 20, 60, 10)),
      reg('right-leg', box(308, 323, 20, 60, 10)),
      reg('hair', ellipse(300, 168, 66, 72)),
      reg('face', ellipse(300, 183, 51, 52)),
      reg('dress', 'M 282 231 H 318 L 361 329 Q 300 351 239 329 Z'),
      reg(
        'crown',
        'M 256 113 L 250 79 L 279 96 L 300 62 L 321 96 L 350 79 L 344 113 Z',
      ),
      eye(281, 179),
      eye(319, 179),
      reg(
        'star',
        'M 438 186 L 447 205 L 468 208 L 453 223 L 457 244 L 438 234 L 419 244 L 423 223 L 408 208 L 429 205 Z',
      ),
    ],
    lines: [
      'M 288 205 Q 300 216 312 205',
      'M 329 252 L 395 282 L 438 235',
      'M 269 252 L 232 281',
    ],
  },
  {
    id: 'dinosaur',
    name: '아기 공룡',
    emoji: '🦕',
    category: '친구들',
    regions: [
      reg(
        'spikes',
        'M 272 124 L 304 96 L 321 135 L 356 133 L 353 177 L 389 198 L 367 226 L 400 257 L 376 279 L 414 304 L 391 327 Z',
      ),
      reg(
        'body',
        'M 260 116 C 180 93 137 144 164 198 Q 182 226 248 218 L 226 283 C 145 278 115 242  90 236 Q 86 319 192 341 Q 209 385 263 370 Q 310 397 357 365 C 430 326 381 254 336 235 C 363 163 333 105 260 116 Z',
      ),
      reg('belly', ellipse(300, 305, 46, 51)),
      reg('foot-left', ellipse(250, 366, 36, 20)),
      reg('foot-right', ellipse(345, 363, 36, 20)),
      eye(234, 159),
      eye(286, 159),
      reg('spot-one', ellipse(180, 306, 10, 12)),
      reg('spot-two', ellipse(205, 322, 8, 9)),
    ],
    lines: [
      'M 244 186 Q 260 203 278 186',
      'M 279 272 Q 263 294 245 279',
      'M 154 278 Q 169 295 187 296',
    ],
  },
];
export const templates: Template[] = [
  animal('rabbit', '토끼', '🐰'),
  animal('bear', '곰', '🐻'),
  animal('cat', '고양이', '🐱'),
  animal('dog', '강아지', '🐶'),
  animal('tiger', '호랑이', '🐯'),
  ...fruits,
  vehicle('police', '경찰차', '🚓'),
  vehicle('firetruck', '소방차', '🚒'),
  vehicle('plane', '비행기', '✈️'),
  vehicle('train', '기차', '🚂'),
  vehicle('bus', '버스', '🚌'),
  ...characters,
  ...extraTemplates,
];
export function templateSvg(t: Template, fills: Record<string, string> = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450"><g stroke="#51493f" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">${t.regions.map((r) => `<path d="${r.d}" fill="${r.fixed || fills[r.id] || '#fff'}"/>`).join('')}${t.lines.map((d) => `<path d="${d}" fill="none"/>`).join('')}</g></svg>`;
}
export function templateUrl(t: Template) {
  return (
    'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(templateSvg(t))
  );
}
