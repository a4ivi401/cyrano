import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { SettingsView } from './components/settings/SettingsView';
import { OverlayView } from './components/overlay/OverlayView';
import './index.css';

const App: React.FC = () => {
  const [route, setRoute] = useState<string>(() => window.location.hash || '#/');

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash || '#/');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const isOverlay = route.includes('/overlay');

  useEffect(() => {
    if (isOverlay) {
      document.documentElement.classList.add('overlay-active');
      document.body.classList.add('overlay-active');
      const root = document.getElementById('root');
      if (root) root.classList.add('overlay-active');
    } else {
      document.documentElement.classList.remove('overlay-active');
      document.body.classList.remove('overlay-active');
      const root = document.getElementById('root');
      if (root) root.classList.remove('overlay-active');
    }
  }, [isOverlay]);

  return (
    <React.StrictMode>
      {isOverlay ? <OverlayView /> : <SettingsView />}
    </React.StrictMode>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(<App />);
}
