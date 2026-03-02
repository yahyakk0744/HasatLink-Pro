import { useState, useEffect, useCallback } from 'react';
import {
  getCanInstall,
  getIsInstalled,
  subscribe,
  promptInstall as doPromptInstall,
} from '../utils/pwaInstallManager';

export function usePWAInstall() {
  const [canInstall, setCanInstall] = useState(getCanInstall);
  const [isInstalled, setIsInstalled] = useState(getIsInstalled);

  useEffect(() => {
    return subscribe(() => {
      setCanInstall(getCanInstall());
      setIsInstalled(getIsInstalled());
    });
  }, []);

  const promptInstall = useCallback(() => doPromptInstall(), []);

  return { canInstall, isInstalled, promptInstall };
}
