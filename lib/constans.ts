export const PASSWORD_MIN_LENGTH = 4;
export const PASSWORD_REGEX = new RegExp(
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*?[#?!@$%^&*-]).+$/,
);
export const PASSWORD_REGEX_ERROR =
  "비번은 소문자, 대문, 숫자, 특문자를 포함해야 합니다.";
