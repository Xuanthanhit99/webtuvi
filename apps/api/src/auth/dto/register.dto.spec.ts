import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { RegisterDto } from './register.dto';

async function validateDto(data: Partial<RegisterDto>) {
  const instance = plainToInstance(RegisterDto, data);
  return validate(instance);
}

describe('RegisterDto validation', () => {
  const valid: Partial<RegisterDto> = {
    email: 'alex@example.com',
    displayName: 'Alex',
    password: 'Sup3r$ecret',
    confirmPassword: 'Sup3r$ecret',
    acceptedTerms: true,
  };

  it('passes with valid data', async () => {
    const errors = await validateDto(valid);
    expect(errors).toHaveLength(0);
  });

  it('rejects a password shorter than 8 characters', async () => {
    const errors = await validateDto({ ...valid, password: 'Ab1!', confirmPassword: 'Ab1!' });
    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });

  it('rejects a password with no number or symbol', async () => {
    const errors = await validateDto({ ...valid, password: 'alllowercase', confirmPassword: 'alllowercase' });
    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });

  it('rejects mismatched confirmPassword', async () => {
    const errors = await validateDto({ ...valid, confirmPassword: 'Different1!' });
    expect(errors.some((e) => e.property === 'confirmPassword')).toBe(true);
  });

  it('rejects an invalid email', async () => {
    const errors = await validateDto({ ...valid, email: 'not-an-email' });
    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });

  it('rejects acceptedTerms: false', async () => {
    const errors = await validateDto({ ...valid, acceptedTerms: false });
    expect(errors.some((e) => e.property === 'acceptedTerms')).toBe(true);
  });
});
