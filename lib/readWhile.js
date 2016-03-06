'use strict';

module.exports = function readWhile (predicate) {
    let str = '';

    while (!input.eof() && predicate(input.peek())) {
        str += input.next();
    }

    return str;
};
