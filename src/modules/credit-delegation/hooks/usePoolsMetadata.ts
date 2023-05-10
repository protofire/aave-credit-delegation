import { useEffect, useState } from 'react';

export interface PoolMetadata {
  ChainId: string;
  EntityId: string;
  Type: string;
  Label: string;
  LogoUrl: string;
}

export const usePoolsMetadata = () => {
  const [metadata, setMetadata] = useState<PoolMetadata[]>();

  useEffect(() => {
    (async function () {
      const url = `${process.env.NEXT_PUBLIC_ATOMICA_API_URL}pool/label/all`;

      try {
        const response = await fetch(url);

        if (response.ok) {
          const json: PoolMetadata[] = await response.json();

          setMetadata(json);
        }
      } catch {}
    })();
  }, []);

  return metadata;
};
