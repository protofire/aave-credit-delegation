import { Trans } from '@lingui/macro';
import { TextWithTooltip, TextWithTooltipProps } from 'src/components/TextWithTooltip';

export const LendingCapacityTooltip = ({ ...rest }: TextWithTooltipProps) => {
  return (
    <TextWithTooltip {...rest}>
      <Trans>
        You can lend any token in AAVE using your credit line. The value of your credit line is
        calculated in US dollars and depends on the value of the collateral you have deposited.
      </Trans>
    </TextWithTooltip>
  );
};
