import { useEffect, useState } from 'react';

const getCurrentSeconds = () => +new Date() / 1000;
const initTimestamp = getCurrentSeconds();

export const useInterval = (interval: number): [number, number] => {
  const [currentTimestamp, setCurrentTimestamp] = useState<number>(getCurrentSeconds());

  useEffect(() => {
    const h = setInterval(() => {
      setCurrentTimestamp(getCurrentSeconds());
    }, interval);
    return () => clearInterval(h);
  }, []);

  return [currentTimestamp, initTimestamp];
};
