import { TokenMetadataType } from '@aave/contract-helpers';
import { ExternalLinkIcon } from '@heroicons/react/outline';
import { Trans } from '@lingui/macro';
import { Box, Menu, MenuItem, SvgIcon, Typography } from '@mui/material';
import * as React from 'react';
import { useState } from 'react';
import { CircleIcon } from 'src/components/CircleIcon';
import { TokenIcon } from 'src/components/primitives/TokenIcon';
import { useProtocolDataContext } from 'src/hooks/useProtocolDataContext';

interface TokenLinkDropdownProps {
  downToSM: boolean;
  borrowingEnabled?: boolean;
  stableBorrowRateEnabled?: boolean;
  asset?: TokenMetadataType;
  aTokenAddress?: string;
  variableDebtTokenAddress?: string;
  stableDebtTokenAddress?: string;
}

export const TokenLinkDropdown = ({
  downToSM,
  borrowingEnabled = false,
  stableBorrowRateEnabled = false,
  asset,
  aTokenAddress,
  variableDebtTokenAddress,
  stableDebtTokenAddress,
}: TokenLinkDropdownProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { currentNetworkConfig } = useProtocolDataContext();
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const showDebtTokenHeader = borrowingEnabled || stableBorrowRateEnabled;

  return (
    <>
      <Box onClick={handleClick}>
        <CircleIcon tooltipText={'View token contracts'} downToSM={downToSM}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              color: '#A5A8B6',
              '&:hover': { color: '#F1F1F3' },
              cursor: 'pointer',
            }}
          >
            <SvgIcon sx={{ fontSize: '14px' }}>
              <ExternalLinkIcon />
            </SvgIcon>
          </Box>
        </CircleIcon>
      </Box>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
        keepMounted={true}
        data-cy="addToWaletSelector"
      >
        <Box sx={{ px: 4, pt: 3, pb: 2 }}>
          <Typography variant="secondary12" color="text.secondary">
            <Trans>Underlying token</Trans>
          </Typography>
        </Box>

        <MenuItem
          component="a"
          href={currentNetworkConfig.explorerLinkBuilder({
            address: asset?.address,
          })}
          target="_blank"
          divider
        >
          <TokenIcon symbol={asset?.symbol ?? 'default'} sx={{ fontSize: '20px' }} />
          <Typography variant="subheader1" sx={{ ml: 3 }} noWrap data-cy={`assetName`}>
            {asset?.symbol}
          </Typography>
        </MenuItem>

        {!!aTokenAddress && (
          <>
            <Box sx={{ px: 4, pt: 3, pb: 2 }}>
              <Typography variant="secondary12" color="text.secondary">
                <Trans>Aave aToken</Trans>
              </Typography>
            </Box>

            <MenuItem
              component="a"
              href={currentNetworkConfig.explorerLinkBuilder({
                address: aTokenAddress,
              })}
              target="_blank"
              divider={showDebtTokenHeader}
            >
              <TokenIcon
                symbol={asset?.symbol ?? 'default'}
                aToken={true}
                sx={{ fontSize: '20px' }}
              />
              <Typography variant="subheader1" sx={{ ml: 3 }} noWrap data-cy={`assetName`}>
                {'a' + asset?.symbol}
              </Typography>
            </MenuItem>
            {showDebtTokenHeader && (
              <Box sx={{ px: 4, pt: 3, pb: 2 }}>
                <Typography variant="secondary12" color="text.secondary">
                  <Trans>Aave debt token</Trans>
                </Typography>
              </Box>
            )}
            {borrowingEnabled && (
              <MenuItem
                component="a"
                href={currentNetworkConfig.explorerLinkBuilder({
                  address: variableDebtTokenAddress,
                })}
                target="_blank"
              >
                <TokenIcon symbol="default" sx={{ fontSize: '20px' }} />
                <Typography variant="subheader1" sx={{ ml: 3 }} noWrap data-cy={`assetName`}>
                  {'Variable debt ' + asset?.symbol}
                </Typography>
              </MenuItem>
            )}
            {stableBorrowRateEnabled && (
              <MenuItem
                component="a"
                href={currentNetworkConfig.explorerLinkBuilder({
                  address: stableDebtTokenAddress,
                })}
                target="_blank"
              >
                <TokenIcon symbol="default" sx={{ fontSize: '20px' }} />
                <Typography variant="subheader1" sx={{ ml: 3 }} noWrap data-cy={`assetName`}>
                  {'Stable debt ' + asset?.symbol}
                </Typography>
              </MenuItem>
            )}
          </>
        )}
      </Menu>
    </>
  );
};
