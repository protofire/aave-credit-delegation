import { Box, Typography } from '@mui/material';
import { ReactNode } from 'react';
import { HintIcon } from 'src/modules/credit-delegation/lists/HintIcon';

interface ListHeaderTitleProps {
  sortName?: string;
  sortDesc?: boolean;
  sortKey?: string;
  setSortName?: (value: string) => void;
  setSortDesc?: (value: boolean) => void;
  onClick?: () => void;
  children: ReactNode;
  title?: string;
  hasHint?: boolean;
}

export const ListHeaderTitle = ({
  sortName,
  sortDesc,
  sortKey,
  setSortName,
  setSortDesc,
  onClick,
  children,
  title,
  hasHint,
}: ListHeaderTitleProps) => {
  const handleSorting = (name: string) => {
    setSortDesc && setSortDesc(false);
    setSortName && setSortName(name);
    if (sortName === name) {
      setSortDesc && setSortDesc(!sortDesc);
    }
  };

  return (
    <Typography
      component="div"
      variant="subheader2"
      color="text.secondary"
      noWrap
      title={title}
      onClick={() => (!!onClick ? onClick() : !!sortKey && handleSorting(sortKey))}
      sx={{
        cursor: !!onClick || !!sortKey ? 'pointer' : 'default',
        display: 'inline-flex',
        alignItems: 'center',
        maxWidth: '100%',
        overflow: 'hidden',
      }}
    >
      <Typography
        component="span"
        variant="subheader2"
        color="text.secondary"
        noWrap
        sx={{
          textOverflow: 'ellipsis',
        }}
      >
        {children}
      </Typography>

      {hasHint && <HintIcon key={sortKey} hintText={title || ''} />}

      {!!sortKey && (
        <Box sx={{ display: 'inline-flex', flexDirection: 'column', ml: 1 }}>
          <Box
            component="span"
            sx={(theme) => ({
              width: 0,
              height: 0,
              borderStyle: 'solid',
              borderWidth: '0 4px 4px 4px',
              borderColor: `transparent transparent ${
                sortName === sortKey && sortDesc
                  ? theme.palette.text.secondary
                  : theme.palette.divider
              } transparent`,
              mb: 0.5,
            })}
          />
          <Box
            component="span"
            sx={(theme) => ({
              width: 0,
              height: 0,
              borderStyle: 'solid',
              borderWidth: '4px 4px 0 4px',
              borderColor: `${
                sortName === sortKey && !sortDesc
                  ? theme.palette.text.secondary
                  : theme.palette.divider
              } transparent transparent transparent`,
            })}
          />
        </Box>
      )}
    </Typography>
  );
};
