/**
 * Creates a Mongoose number path constrained to a safe whole integer.
 */
export function safeIntegerField({ min = 0, required = false, defaultValue } = {}) {
  return {
    type: Number,
    min,
    ...(required ? { required: true } : {}),
    ...(defaultValue === undefined ? {} : { default: defaultValue }),
    validate: {
      validator: Number.isSafeInteger,
      message: 'Value must be a safe whole integer',
    },
  };
}

/**
 * Creates a Mongoose number path whose value is an integer amount in paise.
 */
export function paiseField(options = {}) {
  return safeIntegerField(options);
}
