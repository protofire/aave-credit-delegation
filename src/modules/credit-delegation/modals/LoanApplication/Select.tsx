import { MenuItem } from '@mui/material';
import { Input, InputProps } from './Input';

type SelectProps = InputProps & {
  disabled?: boolean;
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  fullWidth?: boolean;
  options: { value: string; label: string }[];
};

export const Select = (props: SelectProps) => {
  const { disabled, value, onChange, placeholder, label, fullWidth, options, ...rest } = props;

  return (
    <Input
      {...rest}
      value={value}
      onChange={onChange}
      label={label}
      fullWidth={fullWidth}
      autoFocus
      select
    >
      {options?.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </Input>
  );
};
