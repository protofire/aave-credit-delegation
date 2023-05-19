import { XCircleIcon } from '@heroicons/react/solid';
import { Trans } from '@lingui/macro';
import { Box, CircularProgress, IconButton, InputBase, Typography } from '@mui/material';
import React, { ReactNode } from 'react';

export interface AddressInputProps {
  value: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  disableInput?: boolean;
  inputTitle?: ReactNode;
  loading?: boolean;
  error?: string;
}

export const AddressInput = ({
  value,
  onChange,
  disabled,
  disableInput,
  inputTitle,
  loading = false,
  error,
}: AddressInputProps) => {
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Typography color="text.secondary">
          {inputTitle ? inputTitle : <Trans>Address</Trans>}
        </Typography>
      </Box>

      <Box
        sx={(theme) => ({
          p: '8px 12px',
          border: `1px solid ${error ? theme.palette.error.main : theme.palette.divider}`,
          borderRadius: '6px',
          mb: 1,
        })}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
          {loading ? (
            <Box sx={{ flex: 1 }}>
              <CircularProgress color="inherit" size="16px" />
            </Box>
          ) : (
            <InputBase
              sx={{ flex: 1 }}
              placeholder="0xa6914..."
              disabled={disabled || disableInput}
              value={value}
              autoFocus
              onChange={(e) => {
                if (!onChange) return;

                onChange(e.target.value);
              }}
              inputProps={{
                'aria-label': 'amount input',
                style: {
                  fontSize: '21px',
                  lineHeight: '28,01px',
                  padding: 0,
                  height: '28px',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                },
              }}
              error={error !== undefined}
            />
          )}
          {value !== '' && !disableInput && (
            <IconButton
              sx={{
                minWidth: 0,
                p: 0,
                left: 8,
                zIndex: 1,
                color: 'text.muted',
                '&:hover': {
                  color: 'text.secondary',
                },
              }}
              onClick={() => {
                onChange && onChange('');
              }}
              disabled={disabled}
            >
              <XCircleIcon height={16} />
            </IconButton>
          )}
        </Box>
      </Box>
    </Box>
  );
};
