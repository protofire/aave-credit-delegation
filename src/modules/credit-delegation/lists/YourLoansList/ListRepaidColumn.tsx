import { Trans } from '@lingui/macro';
import { Update } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';

import { ListColumn } from '../../../../components/lists/ListColumn';
import { FormattedNumber } from '../../../../components/primitives/FormattedNumber';
import { OptionalTooltip } from '../../OptionalTooltip';
import { LoanStatus } from '../../types';

interface ListRepaidColumnProps {
  original: string | number;
  repaid: string | number;
  remaining: string | number;
  remainingUsd?: string;
  repaidUsd?: string;
  originalUsd?: string;
  disabled?: boolean;
  status?: LoanStatus;
}

export const ListRepaidColumn = ({
  remaining,
  remainingUsd,
  repaid,
  repaidUsd,
  original,
  originalUsd,
  disabled,
  status,
}: ListRepaidColumnProps) => {
  if (status === LoanStatus.Active) {
    return (
      <ListColumn>
        <OptionalTooltip
          title={
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FormattedNumber
                value={remainingUsd || 0}
                symbol="USD"
                variant="secondary14"
                sx={{ mb: '2px' }}
                symbolsColor="common.white"
                compact={false}
              />
            </Box>
          }
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="secondary12" style={{ whiteSpace: 'pre' }}>
              <Trans>Remaining </Trans>{' '}
            </Typography>
            <FormattedNumber
              value={remaining}
              variant="secondary14"
              sx={{ mb: '2px' }}
              color={disabled ? 'text.disabled' : 'text.main'}
              data-cy={`nativeAmount`}
            />
          </Box>
        </OptionalTooltip>
        <Box
          style={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <OptionalTooltip
            title={
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FormattedNumber
                  value={repaidUsd || 0}
                  symbol="USD"
                  variant="secondary14"
                  sx={{ mb: '2px' }}
                  symbolsColor="common.white"
                  compact={false}
                />
              </Box>
            }
          >
            <Box style={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="secondary12" style={{ whiteSpace: 'pre' }}>
                <Trans>Repaid </Trans>{' '}
              </Typography>
              <FormattedNumber
                value={repaid}
                variant="secondary12"
                sx={{ mb: '2px' }}
                color={disabled ? 'text.disabled' : 'text.main'}
                data-cy={`subAmount`}
              />
            </Box>
          </OptionalTooltip>

          <OptionalTooltip
            title={
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FormattedNumber
                  value={originalUsd || 0}
                  symbol="USD"
                  variant="secondary14"
                  sx={{ mb: '2px' }}
                  symbolsColor="common.white"
                  compact={false}
                />
              </Box>
            }
          >
            <Box style={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="secondary12" style={{ whiteSpace: 'pre' }}>
                {' '}
                <Trans> of </Trans>{' '}
              </Typography>
              <FormattedNumber
                value={original}
                variant="secondary12"
                sx={{ mb: '2px' }}
                color={disabled ? 'text.disabled' : 'text.main'}
                data-cy={`subAmount`}
              />
            </Box>
          </OptionalTooltip>
        </Box>
      </ListColumn>
    );
  }

  if (status === LoanStatus.Declined) {
    return (
      <ListColumn>
        <OptionalTooltip
          title={
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FormattedNumber
                value={remainingUsd || 0}
                symbol="USD"
                variant="secondary14"
                sx={{ mb: '2px' }}
                symbolsColor="common.white"
                compact={false}
              />
            </Box>
          }
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FormattedNumber
              value={remaining}
              variant="secondary14"
              sx={{ mb: '2px' }}
              color={disabled ? 'text.disabled' : 'text.main'}
              data-cy={`nativeAmount`}
            />
          </Box>
        </OptionalTooltip>
      </ListColumn>
    );
  }

  return (
    <ListColumn>
      <OptionalTooltip
        title={
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FormattedNumber
              value={remainingUsd || 0}
              symbol="USD"
              variant="secondary14"
              sx={{ mb: '2px' }}
              symbolsColor="common.white"
              compact={false}
            />
          </Box>
        }
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Update color="warning" sx={{ fontSize: '20px', mr: 1.5 }} />
          <Typography variant="secondary12" style={{ whiteSpace: 'pre' }}>
            <Trans>Requested</Trans>{' '}
          </Typography>
          <FormattedNumber
            value={remaining}
            variant="secondary14"
            sx={{ mb: '2px' }}
            color={disabled ? 'text.disabled' : 'text.main'}
            data-cy={`nativeAmount`}
          />
        </Box>
      </OptionalTooltip>
    </ListColumn>
  );
};
