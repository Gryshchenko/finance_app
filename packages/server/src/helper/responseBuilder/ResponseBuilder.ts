import { IResponse, IResponseError, ResponseStatusType } from 'tenpercent/shared';

export default class ResponseBuilder {
    protected _response: IResponse = {
        status: undefined,
        data: {},
        errors: [],
    };

    public constructor() {
        this.reset();
    }

    public reset() {
        this._response = {
            status: undefined,
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
