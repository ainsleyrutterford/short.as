const BASE = 52;
const ENCODING_ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
// 52^7 - 1
const MAX_POSSIBLE_NUM = 1028071702527;

/**
 * Returns the base52 encoding of a number. Pads with the string "a" to ensure that the
 * result always has a length of 7.
 */
export const encodeNumber = (num: number): string => {
  if (num > MAX_POSSIBLE_NUM) {
    console.warn("Encoded a number that was greater than what is representable in 7 characters");
  }

  // Padding with 'a's if the number is 0
  if (num === 0) return ENCODING_ALPHABET[0].repeat(7);

  let result = '';
  while (num > 0) {
    const remainder = num % BASE;
    result = ENCODING_ALPHABET[remainder] + result;
    num = Math.floor(num / BASE);
  }

  // Padding with 'a's if the length is less than 7
  return result.length < 7 ? 'a'.repeat(7 - result.length) + result : result;
};
