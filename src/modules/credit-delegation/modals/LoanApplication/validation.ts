import Ajv, { ErrorObject, JSONSchemaType } from 'ajv';
import ajvErrors from 'ajv-errors';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ coerceTypes: true, allErrors: true, $data: true });

ajvErrors(ajv /*, {singleError: true} */);

addFormats(ajv);

interface LoanApplicationData {
  email: string;
  name: string;
  state: string;
  productId: number;
  selectedEntities: Record<string, string>;
  amount: number;
  topUp: number;
  maxApr: number;
}

const schema: JSONSchemaType<LoanApplicationData> = {
  type: 'object',
  properties: {
    email: {
      type: 'string',
      format: 'email',
    },
    name: {
      type: 'string',
      minLength: 2,
    },
    state: {
      type: 'string',
      minLength: 2,
    },
    productId: {
      type: 'integer',
    },
    selectedEntities: {
      type: 'object',
      required: [],
    },
    amount: {
      type: 'number',
    },
    topUp: {
      type: 'number',
      minimum: 0,
    },
    maxApr: {
      type: 'number',
      maximum: 100,
      minimum: 0,
    },
  },
  required: ['email', 'name', 'state', 'productId', 'selectedEntities', 'amount', 'maxApr'],
  additionalProperties: true,
  errorMessage: {
    properties: {
      email: 'Please enter a valid email address',
      name: 'Please enter your name',
      state: 'Please select a state',
      productId: 'Please select a product',
      amount: 'Please enter a valid number',
      topUp: 'Please enter a number between 0 and the loan amount',
      maxApr: 'Please enter a value between 0 and 100',
    },
  },
};

export const getValidationFunction = (
  config:
    | {
        title: string;
        listId: string;
        options: string[];
      }[]
    | undefined
) => {
  const listIds = config?.map((config) => config.listId) ?? [];

  return ajv.compile({
    ...schema,
    properties: {
      ...schema.properties,
      selectedEntities: {
        type: 'object',
        required: listIds,
        properties:
          config?.reduce((acc, entity) => {
            acc[entity.listId] = {
              enum: entity.options,
              title: entity.title,
            };
            return acc;
          }, {} as Record<string, unknown>) ?? {},
      },
    },
  });
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
