import { RefreshIcon } from '@heroicons/react/outline';
import { Trans } from '@lingui/macro';
import { Box, IconButton, Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';

interface SignatureInputProps {
  onChange?: (imgURL: string) => void;
  value?: string;
  disabled?: boolean;
}

export const SignatureInput = ({ onChange, value, disabled }: SignatureInputProps) => {
  const sigCanvas = useRef<SignatureCanvas | null>(null);

  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    if (value === '' && !isEmpty) {
      sigCanvas.current?.clear();
      setIsEmpty(true);
    } else if (value !== '' && isEmpty) {
      setIsEmpty(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, isEmpty, sigCanvas.current]);

  useEffect(() => {
    if (disabled) {
      sigCanvas.current?.off();
    } else {
      sigCanvas.current?.on();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, sigCanvas.current]);

  const handleEnd = () => {
    onChange?.(sigCanvas.current?.toDataURL('image/png') ?? '');
  };

  const handleClearClick = () => {
    onChange?.('');
  };

  return (
    <Box
      sx={(theme) => ({
        border: `1px solid ${theme.palette.grey[300]}`,
        display: 'flex',
        justifyContent: 'center',
        position: 'relative',
      })}
    >
      <Typography sx={{ position: 'absolute', top: 0, left: 5 }} color="gray">
        <Trans>Signature</Trans>
      </Typography>
      {!isEmpty && (
        <IconButton sx={{ position: 'absolute', bottom: 0, right: 5 }} onClick={handleClearClick}>
          <RefreshIcon height={16} />
        </IconButton>
      )}
      <SignatureCanvas
        ref={sigCanvas}
        penColor="blue"
        canvasProps={{ height: 100, width: 400 }}
        onEnd={handleEnd}
      />
    </Box>
  );
};
