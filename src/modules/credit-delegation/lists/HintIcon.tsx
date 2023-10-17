import { Trans } from '@lingui/macro';
import { useMemo } from 'react';
import { TextWithTooltip, TextWithTooltipProps } from 'src/components/TextWithTooltip';

import { useHints } from '../hooks/useHints';

interface HintIconProps extends TextWithTooltipProps {
  hintText: string;
}

export const HintIcon = ({ hintText, ...rest }: HintIconProps) => {
  const { hints } = useHints();

  const hint = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return hints?.find((hint) => hint.name === hintText);
  }, [hintText, hints]);

  return (
    <TextWithTooltip {...rest} iconSize={12} fontSize={12}>
      <Trans>{hint?.description}</Trans>
    </TextWithTooltip>
  );
};
