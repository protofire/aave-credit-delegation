import { Tooltip, TooltipProps } from '@mui/material';

interface OptionalTooltipProps extends Omit<TooltipProps, 'title'> {
  title?: React.ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children: React.ReactElement<any, any>;
}

export const OptionalTooltip = ({ title, children, ...props }: OptionalTooltipProps) => {
  return (
    <>
      {title !== undefined ? (
        <Tooltip title={title} arrow placement="top" {...props}>
          {children}
        </Tooltip>
      ) : (
        children
      )}
    </>
  );
};
