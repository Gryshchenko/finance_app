module.exports = class Success<T> implements ISuccess<T> {
    constructor(public value: T) {}
};
