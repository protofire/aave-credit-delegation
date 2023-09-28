import { SxProps, Typography, useMediaQuery, useTheme } from '@mui/material';
import { ReactNode } from 'react';

import { ListWrapper } from '../../../components/lists/ListWrapper';
import { ListHeader } from './ListHeader';
import { ListItemLoader } from './ListItemLoader';
import { MobileListItemLoader } from './MobileListItemLoader';

interface ListLoaderProps {
  title: ReactNode;
  withTopMargin?: boolean;
  head: ReactNode[];
  sx?: SxProps;
}

export const ListLoader = ({ title, withTopMargin, head, sx }: ListLoaderProps) => {
  const theme = useTheme();
  const downToXSM = useMediaQuery(theme.breakpoints.down('xsm'));

  return (
    <ListWrapper
      sx={sx}
      titleComponent={
        <Typography component="div" variant="h3" sx={{ mr: 4 }}>
          {title}
        </Typography>
      }
      withTopMargin={withTopMargin}
    >
      <>
        {!downToXSM && <ListHeader head={head} />}
        {!downToXSM ? (
          <>
            <ListItemLoader />
            <ListItemLoader />
          </>
        ) : (
          <MobileListItemLoader />
        )}
      </>
    </ListWrapper>
  );
};
