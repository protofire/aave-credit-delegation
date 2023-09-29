import { ExternalLinkIcon } from '@heroicons/react/solid';
import { Trans } from '@lingui/macro';
import { Button, Link, ListItem, SvgIcon, Typography } from '@mui/material';
import { ListColumn } from 'src/components/lists/ListColumn';

import { ListButtonsColumn } from '../ListButtonsColumn';

export const BorrowerListItem = ({
  title,
  product,
  wording,
  creditLine,
}: {
  id: string;
  title: string;
  product: {
    id: string;
    title: string;
  };
  wording: string;
  details: string;
  creditLine?: string;
}) => {
  return (
    <ListItem>
      <ListColumn align="center">{product.title}</ListColumn>
      <ListColumn align="center">{title}</ListColumn>
      {/* <ListColumn align="center">{details ?? '--'}</ListColumn> */}
      <ListColumn align="center">{creditLine ?? '--'}</ListColumn>
      <ListButtonsColumn>
        <Button
          endIcon={
            <SvgIcon sx={{ width: 14, height: 14 }}>
              <ExternalLinkIcon />
            </SvgIcon>
          }
          component={Link}
          href={wording}
          variant="outlined"
          size="small"
          disabled={!wording}
        >
          <Typography variant="buttonS">
            <Trans>Wording</Trans>
          </Typography>
        </Button>
      </ListButtonsColumn>
    </ListItem>
  );
};
