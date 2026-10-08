import { Cloud, Moon, Star, Sun, Flag, Heart, Sparkles } from 'lucide-react';
import { CharacterAvatar } from '../CharacterAvatar';
import { ToyArtwork } from '../ToyArtwork';
import { BasketArt, FaceEyes, FaceMouth, LandscapeArt, SeatArt, WingArt } from './DevelopmentArt';
import type { CharacterId, GameId } from '../../types';
import './DevelopmentThumbnail.css';
export function DevelopmentThumbnail({gameId,buddy}:{gameId:GameId;buddy:CharacterId}){
  return <div className={`development-thumbnail thumb-${gameId}`}>
    {gameId==='path_tracing'?<><svg className="thumb-road" viewBox="0 0 300 180"><path d="M30 142 C20 10 200 179 252 39" stroke="#fff1c9" strokeWidth="28" fill="none" strokeLinecap="round"/><path d="M30 142 C20 10 200 179 252 39" stroke="#d6a8cf" strokeWidth="9" fill="none" strokeLinecap="round"/></svg><span className="thumb-tracer"><CharacterAvatar id={buddy} size="sm" mood="still"/></span><Flag className="thumb-flag" fill="#e6b98d"/><Star className="thumb-trace-star" fill="#f2d998"/></>:
    gameId==='fruit_harvest'?<><LandscapeArt orchard/>{['🍎','🍊','🍑'].map((fruit,i)=><span className={`thumb-fruit fruit-${i}`} key={fruit}><ToyArtwork emoji={fruit}/></span>)}<span className="thumb-basket"><BasketArt/></span></>:
    gameId==='symmetry_puzzle'?<><span className="thumb-wing left"><WingArt side="left"/></span><span className="thumb-wing right"><WingArt silhouette/></span><span className="thumb-wing piece"><WingArt/></span><Sparkles className="thumb-magic"/></>:
    gameId==='size_ordering'?<div className="thumb-bears">{[0,1,2].map(i=><span key={i} style={{width:`${21+i*7}%`}}><ToyArtwork emoji="🧸"/><SeatArt/></span>)}</div>:
    gameId==='day_night_weather'?<><span className="thumb-night"/><Sun className="thumb-sun" fill="#eec980"/><Moon className="thumb-moon" fill="#f2dfa5"/><Cloud className="thumb-cloud" fill="#fff8e7"/><span className="thumb-weather-friend"><CharacterAvatar id={buddy} size="sm" mood="still"/></span></>:
    gameId==='goodnight_sleep'?<><span className="thumb-bed"><CharacterAvatar id={buddy} size="sm" mood="still"/><span><Star fill="currentColor"/><Star fill="currentColor"/></span></span><Moon className="thumb-moon" fill="#f1dea3"/><span className="thumb-teddy"><ToyArtwork emoji="🧸"/></span></>:
    gameId==='emotion_face'?<><svg viewBox="0 0 300 258" className="thumb-face"><ellipse cx="150" cy="141" rx="105" ry="92" fill="#fae6c5" stroke="#d5b89b" strokeWidth="9"/><FaceEyes kind="sparkle"/><FaceMouth kind="laugh"/></svg><Heart className="thumb-heart" fill="#dbaac6"/></>:
    <><span className="thumb-paint paint-a"/><span className="thumb-paint paint-b"/><span className="thumb-paint paint-c"/><Sparkles className="thumb-paint-spark"/><span className="thumb-paint-pots"><i/><i/><i/></span></>}
  </div>;
}
