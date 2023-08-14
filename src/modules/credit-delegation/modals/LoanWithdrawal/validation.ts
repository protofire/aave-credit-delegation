import Ajv, { ErrorObject, JSONSchemaType } from 'ajv';
import ajvErrors from 'ajv-errors';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ coerceTypes: true, allErrors: true, $data: true });

ajvErrors(ajv /*, {singleError: true} */);

addFormats(ajv);

interface LoanApplicationData {
  amount: number;
  name: string;
  company: string;
  title: string;
  signature: string;
}

export const schema: JSONSchemaType<LoanApplicationData> = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      minLength: 2,
    },
    company: {
      type: 'string',
    },
    title: {
      type: 'string',
    },
    signature: {
      type: 'string',
      minLength: 1,
    },
    amount: {
      type: 'number',
      exclusiveMinimum: 0,
    },
  },
  required: ['name', 'signature', 'amount'],
  additionalProperties: true,
  errorMessage: {
    properties: {
      name: 'Please enter your name',
      signature: 'Please use your mouse to sign',
      amount: 'Please enter a valid amount',
    },
  },
};

export const hasError = (
  errors: ErrorObject<string, Record<string, unknown>, unknown>[],
  name: string,
  filter?: Record<string, string>
) => {
  return errors.some((error) => {
    if (filter) {
      return (
        error.instancePath === `/${name}` &&
        Object.keys(filter).every((key) => error.params[key] === filter[key])
      );
    }

    return error.instancePath === `/${name}`;
  });
};

export const getErrorMessage = (
  errors: ErrorObject<string, Record<string, unknown>, unknown>[],
  name: string,
  filter?: Record<string, string>
) => {
  const msg = errors.find((error) => {
    if (filter) {
      return (
        error.instancePath === `/${name}` &&
        Object.keys(filter).every((key) => error.params[key] === filter[key])
      );
    }

    return error.instancePath === `/${name}`;
  })?.message;

  if (msg) {
    return msg.charAt(0).toUpperCase() + msg.slice(1);
  }

  return '';
};

export const validate = ajv.compile(schema);
