import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

/** Native modal semantics keep focus and touches inside the open picker. */
export function SketchbookDialog({ title, onClose, children }: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const element = dialog.current!;
    element.showModal();
    return () => element.close();
  }, []);

  return <dialog ref={dialog} className="sketch-dialog" aria-labelledby={titleId}
    onCancel={event => { event.preventDefault(); onClose(); }}>
    <header className="sketch-dialog-heading">
      <h2 id={titleId}>{title}</h2>
      <button type="button" className="sketch-close" onClick={onClose} aria-label="닫고 그리기" autoFocus>
        <X aria-hidden="true" />
      </button>
    </header>
    <div className="sketch-dialog-scroll" data-scroll-region>{children}</div>
  </dialog>;
}
