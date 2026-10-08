import type { HabitatKind } from '../../data/habitatFriends';

export function HabitatBackdrop({ kind }: { kind: HabitatKind }) {
  return <svg className="habitat-backdrop" viewBox="0 0 900 640" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    {kind === 'aquarium' ? <>
      <path d="M140 -10 L360 -10 L630 640 H540Z M490 -10 H610 L760 640 H710Z" fill="#f9fff3" opacity=".1" />
      <path d="M0 565 Q190 520 405 570 Q650 525 900 552 V640 H0Z" fill="#e3e7c7" /><path d="M0 593 Q233 556 430 601 Q750 555 900 592 V640 H0Z" fill="#eee6c9" />
      <g fill="none" strokeLinecap="round">
        <path d="M70 600 Q110 540 82 491 Q38 430 78 374 M102 603 Q117 555 137 529 Q168 480 136 446 M53 602 Q17 560 36 507" stroke="#84bcb0" strokeWidth="18" />
        <path d="M802 602 Q779 542 816 495 Q851 438 813 411 M836 606 Q848 559 865 541 Q891 508 870 470 M770 601 Q760 551 737 528" stroke="#96c7b8" strokeWidth="15" />
        <path d="M701 610 V539 M701 584 Q670 585 672 563 M701 568 Q732 569 731 545 M681 567 L678 546 M720 561 L724 527" stroke="#d6a4ac" strokeWidth="12" />
        <path d="M178 609 V559 M178 590 Q150 585 153 567 M178 577 Q196 576 198 558" stroke="#d5b6c8" strokeWidth="11" />
      </g>
      <g fill="#b9cac1"><ellipse cx="70" cy="620" rx="65" ry="18" /><ellipse cx="831" cy="621" rx="74" ry="21" /></g>
      <path d="M394 611 Q396 573 426 582 Q450 597 444 612Z" fill="#d7c8b7" stroke="#bcae9b" strokeWidth="2" /><path d="M418 606 L410 588 M423 606 L425 584 M427 607 L439 594" stroke="#f9efd5" strokeWidth="3" />
      <g fill="#c3b695" opacity=".6"><ellipse cx="307" cy="612" rx="9" ry="4" /><ellipse cx="526" cy="627" rx="6" ry="3" /><ellipse cx="584" cy="588" rx="9" ry="4" /></g>
      <g fill="none" stroke="#edfbf3" strokeWidth="3" opacity=".3"><circle cx="52" cy="276" r="13" /><circle cx="846" cy="341" r="9" /><circle cx="740" cy="120" r="6" /></g>
    </> : <>
      <path d="M0 480 Q230 390 473 487 Q713 390 900 446 V640 H0Z" fill="#d8dfb0" /><path d="M0 552 Q256 433 562 574 Q710 478 900 500 V640 H0Z" fill="#c8d8a2" />
      <path d="M306 640 Q459 535 347 467" fill="none" stroke="#eddfb9" strokeWidth="56" opacity=".85" />
      <g fill="#9fbc8b" stroke="#86a378" strokeWidth="2"><path d="M21 640 Q8 532 75 501 Q97 567 21 640Z M32 608 Q79 527 131 569 Q108 621 32 608Z" /><path d="M842 640 Q792 549 815 488 Q877 519 842 640Z M850 596 Q858 521 899 513 V582Z" /></g>
      <g stroke="#92a97c" strokeWidth="5" fill="none" strokeLinecap="round"><path d="M125 590 V539 M753 588 V527 M667 618 V583" /></g>
      {[{x:125,y:530,c:'#e7b7ae'},{x:753,y:519,c:'#e3c48d'},{x:667,y:579,c:'#c6b5d3'}].map(flower => <g key={flower.x} transform={`translate(${flower.x} ${flower.y})`} fill={flower.c}><circle cx="-13" cy="0" r="12" /><circle cx="13" cy="0" r="12" /><circle cx="0" cy="-13" r="12" /><circle cx="0" cy="13" r="12" /><circle r="9" fill="#fff0bf" /></g>)}
      <g transform="translate(210 602)"><path d="M-8 4 L-11 25 Q0 30 11 25 L7 3" fill="#f3e6c8" /><path d="M-27 4 Q-20 -30 0 -23 Q23 -26 28 4Z" fill="#d9a194" stroke="#b4897d" strokeWidth="2" /><circle cx="-8" cy="-10" r="5" fill="#fff0d9" /><circle cx="14" cy="-4" r="4" fill="#fff0d9" /></g>
      <g fill="#e6ecc7" opacity=".65"><ellipse cx="93" cy="187" rx="37" ry="16" transform="rotate(-35 93 187)" /><ellipse cx="789" cy="237" rx="37" ry="16" transform="rotate(35 789 237)" /></g>
      <g fill="#ecdda5"><circle cx="83" cy="611" r="3" /><circle cx="495" cy="596" r="4" /><circle cx="724" cy="608" r="3" /></g>
    </>}
  </svg>;
}
