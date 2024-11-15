export enum HttpCode {
    // Successful responses (2xx)

    /** The request has succeeded. */
    OK = 200,

    /** The request has succeeded, and a new resource has been created as a result. Typically used for POST or PUT requests. */
    CREATED = 201,

    /** The request has been received but not yet acted upon. It is typically used for asynchronous processing. */
    ACCEPTED = 202,

    /** The request has succeeded, but there is no content to send in the response. */
    NO_CONTENT = 204,

    // Client errors (4xx)

    /** The server could not understand the request due to invalid syntax. */
    BAD_REQUEST = 400,

    /** The client must authenticate itself to get the requested response. */
    UNAUTHORIZED = 401,

    /** The client does not have access rights to the content. */
    FORBIDDEN = 403,

    /** The server can not find the requested resource. */
    NOT_FOUND = 404,

    /** The request conflicts with the current state of the server. Often used for duplicate entries. */
    CONFLICT = 409,

    /** The request was well-formed but was unable to be followed due to semantic errors. Often used for validation errors. */
    UNPROCESSABLE_ENTITY = 422,

    // Server errors (5xx)

    /** The server has encountered a situation it does not know how to handle. */
    INTERNAL_SERVER_ERROR = 500,

    /** The request method is not supported by the server and cannot be handled. */
    NOT_IMPLEMENTED = 501,

    /** The server was acting as a gateway or proxy and received an invalid response from the upstream server. */
    BAD_GATEWAY = 502,

    /** The server is not ready to handle the request, often due to maintenance or overload. */
    SERVICE_UNAVAILABLE = 503,

    /** The server was acting as a gateway or proxy and did not receive a timely response from the upstream server. */
    GATEWAY_TIMEOUT = 504,
}
