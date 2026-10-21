export function isValidEmail(email: string): boolean {
  const normalizedEmail = email.trim();

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
}

export function isRequired(value: string): boolean {
  return value.trim().length > 0;
}

export function passwordsMatch(
  password: string,
  confirmPassword: string,
): boolean {
  return password === confirmPassword;
}
