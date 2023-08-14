import { TextField, TextFieldProps } from '@mui/material';

export type InputProps = Omit<TextFieldProps, 'onChange'> & {
  disabled?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  fullWidth?: boolean;
};

export const Input = (props: InputProps) => {
  const { disabled, value, onChange, placeholder, label, fullWidth, ...rest } = props;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    onChange?.(value);
  };

  return (
    <TextField
      {...rest}
      label={label}
      placeholder={placeholder}
      disabled={disabled}
      value={value}
      autoFocus
      onChange={handleChange}
      fullWidth={fullWidth}
    />
  );
};
