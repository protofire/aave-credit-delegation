import { Trans } from '@lingui/macro';

import { TextWithTooltip, TextWithTooltipProps } from '../../../../components/TextWithTooltip';

export const RepayTypeTooltip = ({ ...rest }: TextWithTooltipProps) => {
  return (
    <TextWithTooltip {...rest}>
      <Trans>
        Allows you to choose which debt to pay <b>principal</b> or <b>interest</b>, where principal
        is the amount you borrowed and have to pay, and interest is what the lender charges for
        lending you the money. You can find the values in the agreement.
      </Trans>
    </TextWithTooltip>
  );
};
