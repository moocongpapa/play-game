import {StrictMode} from 'react';
import {MotionConfig} from 'motion/react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './native-play.css';
import './components/PlayExperience.css';
import './play-readability.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user"><App /></MotionConfig>
  </StrictMode>,
);
