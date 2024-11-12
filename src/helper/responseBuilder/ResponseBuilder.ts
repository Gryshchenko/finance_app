import { ResponseStatusType } from 'types/ResponseStatusType';
import { IResponseError } from 'interfaces/IResponseError';

export interface IResponse<T = unknown> {
    status: ResponseStatusType | null;
    data: T;
    errors: IResponseError[] | null;
}

export default class ResponseBuilder {
    protected _response: IResponse = {
        status: null,
        data: {},
        errors: [],
    };

    public constructor() {
        this.reset();
    }

    public reset() {
        this._response = {
            status: null,
            data: {},
            errors: [],
        };
    }

    public setStatus(status: ResponseStatusType): this {
        this._response.status = status;
        return this;
    }

    public setErrors(errors: IResponseError[]): this {
        this._response.errors = errors;
        return this;
    }

    public setError(errors: IResponseError): this {
        this._response.errors?.push(errors);
        return this;
    }

    public setData(data: unknown): this {
        this._response.data = data;
        return this;
    }

    build(): IResponse {
        const response = this._response;
        this.reset();
        return response;
    }
}
