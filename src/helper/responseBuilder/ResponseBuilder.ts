import { ResponseStatusType } from 'types/ResponseStatusType';
import { IResponseError } from 'interfaces/IResponseError';

interface IResponse<T = unknown> {
    status: ResponseStatusType | null;
    data: T | {};
    errors: IResponseError[] | null;
}

module.exports = class ResponseBuilder<T = unknown> {
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

    public setStatus(status: ResponseStatusType): ResponseBuilder {
        this._response.status = status;
        return this;
    }
    public setErrors(errors: IResponseError[]): ResponseBuilder {
        this._response.errors = errors;
        return this;
    }

    public setError(errors: IResponseError): ResponseBuilder {
        this._response.errors?.push(errors);
        return this;
    }

    public setData(data: T): ResponseBuilder<T> {
        this._response.data = data;
        return this;
    }

    build(): IResponse {
        const response = this._response;
        this.reset();
        return response;
    }
};
