import crypto from "crypto";

const DEFAULT_CHARSET = "123456789qwertyuiopasdfghjklzxcvbnm";

export function generateId(length: number = 10, charset: string = DEFAULT_CHARSET): string {
    if (length <= 0) {
        throw new Error("Length must be a positive integer");
    }

    const charsetLength = charset.length;
    if (charsetLength === 0) {
        throw new Error("Charset must not be empty");
    }

    let result = "";
    const randomValues = crypto.randomBytes(length);

    for (let i = 0; i < length; i++) {
        result += charset[randomValues[i] % charsetLength];
    }

    return result;
}

console.log(generateId()); 
console.log(generateId(5)); 
console.log(generateId(15, "abcdef123456")); 
