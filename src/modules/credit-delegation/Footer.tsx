import { Box, Typography } from '@mui/material';
import { Link } from 'src/components/primitives/Link';
import { uiConfig } from 'src/uiConfig';

export const Footer = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'end',
        mt: 5,
        mb: 3,
        color: 'text.secondary',
        flexGrow: 1,
      }}
    >
      <Typography
        sx={{
          fontSize: '12px',
          fontWeight: 500,
          lineHeight: '17px',
          mr: 2,
        }}
      >
        Developped by
      </Typography>

      <Link
        href="https://protofire.io/"
        aria-label="Go to homepage"
        sx={{
          lineHeight: 0,
          mr: 3,
          transition: '0.3s ease all',
          '&:hover': { opacity: 0.7 },
        }}
      >
        <img src={uiConfig.protofireLogo} alt="An SVG of an eye" height={20} />
      </Link>
    </Box>
  );
};
