import { InformationCircleIcon } from '@heroicons/react/outline';
import { Trans } from '@lingui/macro';
import { Box, SvgIcon, Typography, TypographyProps } from '@mui/material';
import { ReactNode } from 'react';
import { ContentWithTooltip } from 'src/components/ContentWithTooltip';

interface ListItemActiveBadgeProps {
  children: ReactNode;
}

const contentSx = {
  display: 'inline-flex',
  alignItems: 'center',
  p: '2px',
  mt: '2px',
  cursor: 'pointer',
  '&:hover': { opacity: 0.6 },
};

const InfoIcon = () => (
  <SvgIcon
    sx={{
      ml: '3px',
      color: 'text.muted',
      fontSize: '14px',
    }}
  >
    <InformationCircleIcon />
  </SvgIcon>
);

const IsolatedEnabledBadge = ({ typographyProps }: { typographyProps?: TypographyProps }) => {
  return (
    <ContentWithTooltip
      withoutHover
      tooltipContent={
        <Trans>
          Your position is inactive, you are not currently earning yield because you don&apos;t
          liquidity in this pool
        </Trans>
      }
    >
      <Box sx={contentSx}>
        <Typography variant="secondary12" color="text.secondary" {...typographyProps}>
          <Trans>Inactive</Trans>
        </Typography>
        <InfoIcon />
      </Box>
    </ContentWithTooltip>
  );
};

export const ListItemActiveBadge = ({ children }: ListItemActiveBadgeProps) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: { xs: 'flex-end', xsm: 'center' },
        justifyContent: 'center',
        flexDirection: 'column',
      }}
    >
      {children}
      <IsolatedEnabledBadge />
    </Box>
  );
};
