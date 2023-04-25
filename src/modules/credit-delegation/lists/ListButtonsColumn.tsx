import { Box } from '@mui/material';
import { ReactNode } from 'react';
import { CREDIT_DELEGATION_LIST_COLUMN_WIDTHS } from 'src/utils/creditDelegationSortUtils';

interface ListButtonsColumnProps {
  children?: ReactNode;
  isColumnHeader?: boolean;
}

export const ListButtonsColumn = ({ children, isColumnHeader = false }: ListButtonsColumnProps) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        maxWidth: CREDIT_DELEGATION_LIST_COLUMN_WIDTHS.BUTTONS,
        minWidth: CREDIT_DELEGATION_LIST_COLUMN_WIDTHS.BUTTONS,
        flex: isColumnHeader ? 1 : 1,
        '.MuiButton-root': {
          ml: '6px',
        },
      }}
    >
      {children}
    </Box>
  );
};
