import { ISuccess } from '../../interfaces/ISuccess';

export default class Success<T> implements ISuccess<T> {
    constructor(public value: T) {}
}
