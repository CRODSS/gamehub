/**
 * Validates email format
 */
export const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validates password strength
 */
export const validatePassword = (password: string): boolean => {
    return password.length >= 6;
};

/**
 * Validates nickname
 */
export const validateNickname = (nickname: string): boolean => {
    return nickname.length >= 3 && nickname.length <= 20;
};

/**
 * Gets validation error message for email
 */
export const getEmailError = (email: string, t: (key: string) => string): string | null => {
    if (!email) {
        return t('validation.emailRequired');
    }
    if (!validateEmail(email)) {
        return t('validation.emailInvalid');
    }
    return null;
};

/**
 * Gets validation error message for password
 */
export const getPasswordError = (password: string, t: (key: string) => string): string | null => {
    if (!password) {
        return t('validation.passwordRequired');
    }
    if (!validatePassword(password)) {
        return t('validation.passwordMinLength');
    }
    return null;
};

/**
 * Gets validation error message for nickname
 */
export const getNicknameError = (nickname: string, t: (key: string) => string): string | null => {
    if (!nickname) {
        return t('validation.nicknameRequired');
    }
    if (nickname.length < 3) {
        return t('validation.nicknameMinLength');
    }
    if (nickname.length > 20) {
        return t('validation.nicknameMaxLength');
    }
    return null;
};
