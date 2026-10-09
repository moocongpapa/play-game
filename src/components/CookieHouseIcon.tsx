/** Decorative artwork; the containing button supplies its accessible name. */
export function CookieHouseIcon({ className = '' }: { className?: string }) {
  return <img src="/art/cookie-house.svg" width={96} height={96} alt="" aria-hidden="true" draggable={false} className={`cookie-house-icon ${className}`} />;
}
