import { useRef, useEffect } from 'react';

// Hook customizado para obter o valor anterior de uma prop ou estado
export function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}
