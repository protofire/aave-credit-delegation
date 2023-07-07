import { ExternalLinkIcon } from '@heroicons/react/outline';
import { Trans } from '@lingui/macro';
import { Box, Button, SvgIcon, Typography } from '@mui/material';
import { DarkTooltip } from 'src/components/infoTooltips/DarkTooltip';
import { Link } from 'src/components/primitives/Link';

export const CreateMarketButton = () => {
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
          component={Link}
          href={
            'https://docs.google.com/forms/d/e/1FAIpQLSfbEtFJDDYTWxHdDLZYz_eFqdbZgDYpqJb9TFveQ-L-zRmB7g/viewform?usp=sf_link'
          }
          variant="outlined"
          size="small"
        >
          <Typography variant="buttonS">
            <Trans>Create Market</Trans>
          </Typography>
        </Button>
      </DarkTooltip>
    </Box>
  );
};
