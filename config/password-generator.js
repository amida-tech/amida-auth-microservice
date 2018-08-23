import uuid from 'uuid';

const lowerLetters = 'abcdefghijklmnopqrstuvwxyz';
const upperLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const numbers = '1234567890';
const symbols = '!@#$%^';

function charInsert(password, insert) {
    const position = Math.floor(Math.random() * password.length);
    return [password.slice(0, position), insert, password.slice(position)].join('');
}

export default function passGenerator() {
    let password = uuid.v4();
    password = charInsert(password, lowerLetters[Math.floor(Math.random() * lowerLetters.length)]);
    password = charInsert(password, upperLetters[Math.floor(Math.random() * upperLetters.length)]);
    password = charInsert(password, numbers[Math.floor(Math.random() * numbers.length)]);
    password = charInsert(password, symbols[Math.floor(Math.random() * symbols.length)]);
    return password;
}
