import { TokenMetadataType } from '@aave/contract-helpers';
import { Trans } from '@lingui/macro';
import { Box, Menu, MenuItem, Typography } from '@mui/material';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { CircleIcon } from 'src/components/CircleIcon';
import { WalletIcon } from 'src/components/icons/WalletIcon';
import { Base64Token, TokenIcon } from 'src/components/primitives/TokenIcon';
import { ERC20TokenType } from 'src/libs/web3-data-provider/Web3Provider';

interface AddTokenDropdownProps {
  downToSM: boolean;
  switchNetwork: (chainId: number) => Promise<void>;
  addERC20Token: (args: ERC20TokenType) => Promise<boolean>;
  currentChainId: number;
  connectedChainId: number;
  asset?: TokenMetadataType;
  aTokenAddress?: string;
}

export const AddTokenDropdown = ({
  downToSM,
  switchNetwork,
  addERC20Token,
  currentChainId,
  connectedChainId,
  asset,
  aTokenAddress,
}: AddTokenDropdownProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [changingNetwork, setChangingNetwork] = useState(false);
  const [underlyingBase64, setUnderlyingBase64] = useState('');
  const [aTokenBase64, setATokenBase64] = useState('');
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  // The switchNetwork function has no return type, so to detect if a user successfully switched networks before adding token to wallet, check the selected vs connected chain id
  useEffect(() => {
    if (changingNetwork && currentChainId === connectedChainId && asset) {
      addERC20Token({
        address: asset.address,
        decimals: asset.decimals,
        symbol: asset.symbol,
        image: !/_/.test(asset.symbol) ? underlyingBase64 : undefined,
      });
      setChangingNetwork(false);
    }
  }, [
    currentChainId,
    connectedChainId,
    changingNetwork,
    addERC20Token,
    underlyingBase64,
    asset?.address,
    asset?.decimals,
    asset?.symbol,
    asset,
  ]);

  return (
    <>
      {/* Load base64 token symbol for adding underlying and aTokens to wallet */}
      {asset?.symbol && !/_/.test(asset.symbol) && (
        <>
          <Base64Token
            symbol={asset.symbol}
            onImageGenerated={setUnderlyingBase64}
            aToken={false}
          />
          <Base64Token symbol={asset.symbol} onImageGenerated={setATokenBase64} aToken={true} />
        </>
      )}
      <Box onClick={handleClick}>
        <CircleIcon tooltipText="Add token to wallet" downToSM={downToSM}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              '&:hover': {
                '.Wallet__icon': { opacity: '0 !important' },
                '.Wallet__iconHover': { opacity: '1 !important' },
              },
              cursor: 'pointer',
            }}
          >
            <WalletIcon sx={{ width: '14px', height: '14px', '&:hover': { stroke: '#F1F1F3' } }} />
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
          key="underlying"
          value="underlying"
          divider
          onClick={() => {
            if (currentChainId !== connectedChainId) {
              switchNetwork(currentChainId).then(() => {
                setChangingNetwork(true);
              });
            } else if (asset) {
              addERC20Token({
                address: asset.address,
                decimals: asset.decimals,
                symbol: asset.symbol,
                image: !/_/.test(asset.symbol) ? underlyingBase64 : undefined,
              });
            }
            handleClose();
          }}
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
              key="atoken"
              value="atoken"
              onClick={() => {
                if (currentChainId !== connectedChainId) {
                  switchNetwork(currentChainId).then(() => {
                    setChangingNetwork(true);
                  });
                } else if (asset) {
                  addERC20Token({
                    address: aTokenAddress,
                    decimals: asset.decimals,
                    symbol: `a${asset.symbol}`,
                    image: !/_/.test(asset.symbol) ? aTokenBase64 : undefined,
                  });
                }

                handleClose();
              }}
            >
              <TokenIcon
                symbol={asset?.symbol ?? 'default'}
                sx={{ fontSize: '20px' }}
                aToken={true}
              />
              <Typography variant="subheader1" sx={{ ml: 3 }} noWrap data-cy={`assetName`}>
                {`a${asset?.symbol}`}
              </Typography>
            </MenuItem>
          </>
        )}
      </Menu>
    </>
  );
};
