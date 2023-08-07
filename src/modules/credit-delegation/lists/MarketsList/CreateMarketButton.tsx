import { ExternalLinkIcon } from '@heroicons/react/outline';
import { Trans } from '@lingui/macro';
import { Box, Button, SvgIcon, Typography } from '@mui/material';
import { DarkTooltip } from 'src/components/infoTooltips/DarkTooltip';
import { useModalContext } from 'src/hooks/useModal';

export const CreateMarketButton = () => {
  const { openLoanApplication } = useModalContext();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: { xs: 'flex-start', xsm: 'center' },
        justifyContent: 'space-between',
        flexDirection: { xs: 'column-reverse', xsm: 'row' },
        px: { xs: 4, xsm: 6 },
        py: 2,
        pl: { xs: '18px', xsm: '27px' },
      }}
    >
      <div />
      <DarkTooltip title="Apply Now: Assess eligibility and create a market.">
        <Button
          endIcon={
            <SvgIcon sx={{ width: 14, height: 14 }}>
              <ExternalLinkIcon />
            </SvgIcon>
          }
          onClick={openLoanApplication}
          variant="outlined"
          size="small"
        >
          <Typography variant="buttonS">
            <Trans>Apply for a loan</Trans>
          </Typography>
        </Button>
      </DarkTooltip>
    </Box>
  );
};
