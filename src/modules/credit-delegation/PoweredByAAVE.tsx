import { Box, Typography } from '@mui/material';
import { Link } from 'src/components/primitives/Link';
import { uiConfig } from 'src/uiConfig';

export const PoweredByAAVE = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        background: (theme) => theme.palette.gradients.aaveGradient,
        backgroundClip: 'text',
        textFillColor: 'transparent',
      }}
    >
      <Typography
        sx={{
          fontSize: '14px',
          fontWeight: 400,
          lineHeight: '20px',
          mr: 2,
        }}
      >
        Powered by
      </Typography>
      <Link
        href="https://app.aave.com/"
        aria-label="Go to homepage"
        sx={{
          lineHeight: 0,
          mr: 3,
          transition: '0.3s ease all',
          '&:hover': { opacity: 0.7 },
        }}
      >
        <img src={uiConfig.aaveLogo} alt="An SVG of an eye" height={20} />
      </Link>
    </Box>
  );
};
