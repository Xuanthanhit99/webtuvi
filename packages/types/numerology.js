const MASTER_NUMBERS = [11, 22, 33];
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MIN_BIRTH_YEAR = 1900;

function isMasterNumber(value) {
  return MASTER_NUMBERS.includes(value);
}

function digitsOf(value) {
  return Math.abs(Math.trunc(value))
    .toString(10)
    .split('')
    .map((digit) => Number(digit));
}

function reduceToCoreNumber(input) {
  if (!Number.isInteger(input) || input < 0) {
    throw new Error(`reduceToCoreNumber: input must be a non-negative integer, got ${input}.`);
  }

  const steps = [];
  let current = input;
  while (current > 9 && !isMasterNumber(current)) {
    const digits = digitsOf(current);
    const to = digits.reduce((sum, digit) => sum + digit, 0);
    steps.push({ from: current, digits, to });
    current = to;
  }
  return { value: current, isMasterNumber: isMasterNumber(current), steps };
}

class BirthDateValidationError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'BirthDateValidationError';
    this.code = code;
  }
}

function normalizeBirthDate(input, now = new Date()) {
  const match = ISO_DATE_PATTERN.exec(input.trim());
  if (!match) {
    throw new BirthDateValidationError('NUMEROLOGY_INVALID_DATE_FORMAT', 'Birth date must be in YYYY-MM-DD format.');
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const asUtcDate = new Date(Date.UTC(year, month - 1, day));
  const isRealCalendarDate =
    asUtcDate.getUTCFullYear() === year && asUtcDate.getUTCMonth() === month - 1 && asUtcDate.getUTCDate() === day;
  if (!isRealCalendarDate) {
    throw new BirthDateValidationError('NUMEROLOGY_INVALID_CALENDAR_DATE', 'That is not a real calendar date.');
  }

  const startOfTodayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (asUtcDate.getTime() > startOfTodayUtc.getTime()) {
    throw new BirthDateValidationError('NUMEROLOGY_FUTURE_DATE_NOT_ALLOWED', 'Birth date cannot be in the future.');
  }

  if (year < MIN_BIRTH_YEAR) {
    throw new BirthDateValidationError('NUMEROLOGY_DATE_TOO_OLD', `Birth year must be ${MIN_BIRTH_YEAR} or later.`);
  }

  return { iso: `${match[1]}-${match[2]}-${match[3]}`, year, month, day };
}

function calculateLifePathFromDateParts(date) {
  const components = [
    { component: 'MONTH', input: date.month, reduction: reduceToCoreNumber(date.month) },
    { component: 'DAY', input: date.day, reduction: reduceToCoreNumber(date.day) },
    { component: 'YEAR', input: date.year, reduction: reduceToCoreNumber(date.year) },
  ];
  const total = components.reduce((sum, component) => sum + component.reduction.value, 0);
  const finalReduction = reduceToCoreNumber(total);
  return {
    type: 'LIFE_PATH',
    value: finalReduction.value,
    isMasterNumber: finalReduction.isMasterNumber,
    breakdown: { normalizedDate: date.iso, components, total, finalReduction },
  };
}

function calculateLifePathNumber(birthDate, options = {}) {
  return calculateLifePathFromDateParts(normalizeBirthDate(birthDate, options.now));
}

module.exports = {
  BirthDateValidationError,
  MASTER_NUMBERS,
  MIN_BIRTH_YEAR,
  calculateLifePathFromDateParts,
  calculateLifePathNumber,
  digitsOf,
  isMasterNumber,
  normalizeBirthDate,
  reduceToCoreNumber,
};
