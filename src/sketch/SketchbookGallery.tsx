import { useEffect, useState } from 'react';
import { ArrowLeft, Check, Download, ImagePlus, Paintbrush, Trash2 } from 'lucide-react';
import { deleteGallery, listGallery, type SavedArt } from './storage';
import type { Artwork } from './model';

export function SketchbookGallery({ savedId, revision, saving, onSave, onContinue, onDownload, onClose }: {
  savedId: string | null;
  revision: number;
  saving: boolean;
  onSave: () => void;
  onContinue: (art: Artwork) => void;
  onDownload: (art: Artwork) => void;
  onClose: () => void;
}) {
  const [items, setItems] = useState<SavedArt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [selected, setSelected] = useState<SavedArt | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    listGallery().then(artworks => {
      if (active) setItems(artworks);
    }).catch(() => {
      if (active) setError('그림을 불러오지 못했어요. 다시 눌러주세요.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [revision, retry]);

  const remove = async () => {
    if (!selected || deleting) return;
    setDeleting(true);
    try {
      await deleteGallery(selected.id);
      setItems(previous => previous.filter(item => item.id !== selected.id));
      setSelected(null);
      setConfirmDelete(false);
      setError('');
    } catch {
      setError('지우지 못했어요. 그림은 그대로 있어요.');
    } finally { setDeleting(false); }
  };

  if (selected) return <div className="sketch-gallery-detail">
    <button className="sketch-action sketch-back" onClick={() => { setSelected(null); setConfirmDelete(false); setError(''); }}>
      <ArrowLeft aria-hidden="true" /> 다른 그림 보기
    </button>
    <div className="sketch-exhibit-frame"><img src={selected.thumbnail} alt="선택한 작품" /></div>
    <div className="sketch-gallery-actions">
      <button className="sketch-action sketch-primary" onClick={() => onContinue(selected.artwork)}><Paintbrush aria-hidden="true" /> 이어 그리기</button>
      <button className="sketch-action" onClick={() => onDownload(selected.artwork)}><Download aria-hidden="true" /> 사진 받기</button>
    </div>
    {error && <p role="alert" className="sketch-error">{error}</p>}
    <details className="sketch-gallery-manage">
      <summary>작품 관리</summary>
      {confirmDelete ? <div className="sketch-delete-confirm">
        <p>이 그림을 전시회에서 지울까요?</p>
        <div className="sketch-gallery-actions">
          <button className="sketch-action" disabled={deleting} onClick={() => setConfirmDelete(false)}>그림 남기기</button>
          <button className="sketch-action sketch-danger" disabled={deleting} onClick={() => void remove()}><Trash2 aria-hidden="true" /> {deleting ? '지우는 중' : '지우기'}</button>
        </div>
      </div> : <button className="sketch-action sketch-danger" onClick={() => setConfirmDelete(true)}><Trash2 aria-hidden="true" /> 전시회에서 지우기</button>}
    </details>
  </div>;

  return <div className="sketch-gallery">
    {savedId && (loading || items.some(item => item.id === savedId)) && <div className="sketch-saved-banner" role="status"><Check aria-hidden="true" /><strong>멋진 그림을 전시했어요!</strong></div>}
    {loading ? <p role="status">그림을 가져오고 있어요…</p> : error ? <div role="alert" className="sketch-error">
      <p>{error}</p><button className="sketch-action" onClick={() => setRetry(value => value + 1)}>다시 불러오기</button>
    </div> : <>
      {items.length === 0 ? <div className="sketch-gallery-empty">
        <div className="sketch-empty-frame" aria-hidden="true"><ImagePlus /></div>
        <p>첫 그림을 여기에 걸어볼까?</p>
        <button className="sketch-action sketch-primary" disabled={saving} onClick={onSave}><ImagePlus aria-hidden="true" /> {saving ? '저장 중…' : '지금 그림 전시하기'}</button>
      </div> : <div className="sketch-gallery-grid">
        {items.map((item, index) => <button key={item.id} className={`sketch-exhibit${item.id === savedId ? ' is-new' : ''}`}
          aria-label={`${index + 1}번째 그림 크게 보기`} onClick={() => setSelected(item)}>
          <span className="sketch-exhibit-frame"><img src={item.thumbnail} alt="" loading="lazy" /></span>
          <span>{new Date(item.updatedAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}</span>
          {item.id === savedId && <span className="sketch-exhibit-check" aria-label="방금 저장한 그림"><Check /></span>}
        </button>)}
      </div>}
    </>}
    <button className="sketch-action sketch-gallery-return" onClick={onClose}><Paintbrush aria-hidden="true" /> 다시 그리러 가기</button>
    <p className="sketch-storage-note">전시회는 이 기기의 브라우저에 보관돼요. 사진 받기로 파일도 남길 수 있어요.</p>
  </div>;
}
