import { CheckIcon, ExclamationCircleIcon } from '@heroicons/react/outline';
import { Box, SvgIcon } from '@mui/material';
import { NoData } from 'src/components/primitives/NoData';

import { ListItemActiveBadge } from './ListItemActiveBadge';

export const ListItemActive = ({ isActive }: { isActive: boolean }) => {
  const CollateralStates = () => {
    if (isActive) {
      return (
        <SvgIcon sx={{ color: 'success.main', fontSize: { xs: '20px', xsm: '24px' } }}>
          <CheckIcon />
        </SvgIcon>
      );
    } else if (!isActive) {
      return (
        <SvgIcon sx={{ color: 'warning.main', fontSize: { xs: '20px', xsm: '24px' } }}>
          <ExclamationCircleIcon />
        </SvgIcon>
      );
    } else {
      return <NoData variant="main14" color="text.secondary" />;
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {isActive ? (
        <CollateralStates />
      ) : (
        <ListItemActiveBadge>
          <CollateralStates />
        </ListItemActiveBadge>
      )}
    </Box>
  );
};
