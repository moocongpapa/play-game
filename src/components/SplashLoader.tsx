import React, { useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { BuddyVideo } from './BuddyVideo';
import { CharacterAvatar } from './CharacterAvatar';

interface SplashLoaderProps {
  onFinish: () => void;
  childName: string;
}

export const SplashLoader: React.FC<SplashLoaderProps> = ({ onFinish, childName }) => {
  useEffect(() => {
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      window.clearTimeout(fallback);
      onFinish();
    };
    // All essential controls are inline SVG. Only the optional landscape is warming up.
    const fallback = window.setTimeout(finish, 1600);
    const image = new Image();
    image.onload = finish;
    image.onerror = finish;
    image.src = '/art/playground-meadow.jpg';
    if (image.complete) finish();
    return () => { finished = true; window.clearTimeout(fallback); image.onload = null; image.onerror = null; };
  }, [onFinish]);
  return <div className="splash-world" role="status" aria-live="polite">
    <div className="splash-cloud one" /><div className="splash-cloud two" />
    <div className="splash-title"><Sparkles /><span>{childName}의 작은 놀이숲</span></div>
    <h1>{childName}야, 어서 와!</h1>
    <div className="splash-friends"><CharacterAvatar id="jelly" size="lg" mood="waving" /><BuddyVideo id="ggomi" /><CharacterAvatar id="rano" size="lg" mood="waving" /></div>
    <div className="splash-wait"><span /><span /><span /><p>친구들을 만나러 가요</p></div>
  </div>;
};
