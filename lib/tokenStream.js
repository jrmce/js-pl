'use strict';

module.exports = function TokenStream (input) {
    let current = null;
    const keywords = ' if then else lambda λ true false ';

    return {
        next: next,
        peek: peek,
        eof: eof,
        croak: input.croak
    };

    function isKeyword (x) {
        return keywords.indexOf(` ${x} `) >= 0;
    }

    function isDigit (ch) {
        return /[0-9]/i.test(ch);
    }

    function isIdStart (ch) {
        return /[a-zλ_]/i.test(ch);
    }

    function isId (ch) {
        return isIdStart(ch) || '?!-<>=0123456789'.indexOf(ch) >= 0;
    }

    function isOpChar (ch) {
        return '+-*/%=&|<>!'.indexOf(ch) >= 0;
    }

    function isPunc (ch) {
        return ',;(){}[]'.indexOf(ch) >= 0;
    }

    function isWhitespace (ch) {
        return ' \t\n'.indexOf(ch) >= 0;
    }

    function readWhile (predicate) {
        let str = '';

        while (!input.eof() && predicate(input.peek())) {
            str += input.next();
        }

        return str;
    }

    function readNumber () {
        let hasDot = false;
        const number = readWhile ((ch) => {
            if (ch === '.') {
                if (hasDot) {
                    return false;
                }

                hasDot = true;
                return true;
            }

            return isDigit(ch);
        });

        return {
            type: 'num',
            value: parseFloat(number)
        };
    }

    function readIdent () {
        const id = readWhile(isId);

        return {
            type: isKeyword(id) ? 'kw' : 'var',
            value: id
        };
    }

    function readEscaped (end) {
        let escaped = false;
        let str = '';

        input.next();

        while (!input.eof()) {
            const ch = input.next();

            if (escaped) {
                str += ch;
                escaped = false;
            } else if (ch === '\\') {
                escaped = true;
            } else if (ch === end) {
                break;
            } else {
                str += ch;
            }
        }

        return str;
    }

    function readString () {
        return {
            type: 'str',
            value: readEscaped('"')
        };
    }

    function skipComment () {
        readWhile((ch) => {
            return ch !== '\n';
        });

        input.next();
    }

    function readNext () {
        readWhile(isWhitepace);

        if (input.eof()) {
            return null;
        }

        const ch = input.peek();

        if (ch === '#') {
            skipComment();
            return readNext();
        }

        if (ch === '') {
            readString();
        }

        if (isDigit(ch)) {
            return readNumber();
        }

        if (isIdStart(ch)) {
            return readIdent();
        }

        if (isPunc(ch)) {
            return {
                type: 'punc',
                value: input.next()
            };
        }

        if (isOpChar(ch)) {
            return {
                type: 'op',
                value: readWhile(isOpChar)
            };
        }

        input.croak(`Can't handle character: ${ch}`);
    }

    function peek () {
        return current || (current = readNext());
    }

    function next () {
        const tok = current;

        current = null;
        return tok || readNext();
    }

    function eof () {
        return peek() === null;
    }
};
