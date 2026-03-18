import { ICategory } from 'tenpercent/shared';
import { ErrorCode } from 'tenpercent/shared';

import { ApiAbstract } from '@/services/api/apiAbstract';
import { GeneralApiProblem, GeneralApiProblemKind } from '@/services/api/apiProblem';
import { AuthService } from '@/services/AuthService';
import { Logger } from '@/utils/logger/Logger';

export class CategoryService extends ApiAbstract {
    protected readonly _logger: Logger = Logger.Of('CategoryService');

    private static _instance: CategoryService;

    public static instance(): CategoryService {
        return CategoryService._instance || (CategoryService._instance = new CategoryService());
    }

    public async doGetCategory(categoryId: number): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: ICategory | undefined;
          }
        | GeneralApiProblem
    > {
        try {
            this._logger.info('Start fetching categorys');
            const userId = this._authService.userId;
            const response = await this.authGet(`/user/${userId}/category/${categoryId}`);
            if (response.kind === GeneralApiProblemKind.Ok) {
                this._logger.info(`Fetching account successfully: ${(response.data as ICategory)?.categoryId}`);
            } else {
                this._logger.info(`Fetching account failed: ${response.kind}`);
            }
            return response;
        } catch (e) {
            if (__DEV__ && e instanceof Error) {
                this._logger.error(`Bad data: ${e.message}\n}`, e.stack);
            }
            return {
                kind: GeneralApiProblemKind.BadData,
                status: undefined,
                data: undefined,
                errors: [
                    {
                        errorCode: ErrorCode.CLIENT_UNKNOWN_ERROR,
                    },
                ],
            };
        }
    }

    public async doGetCategories(): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: ICategory[];
          }
        | GeneralApiProblem
    > {
        try {
            this._logger.info(`Start fetching categories from`);
            const userId = this._authService.userId;
            const response = await this.authGet(`/user/${userId}/categories`);
            if (response.kind === GeneralApiProblemKind.Ok) {
                this._logger.info(`Fetching categories successfully: ${(response.data as ICategory[])?.length}`);
            } else {
                this._logger.info(`Fetching categories failed: ${response.kind}`);
            }
            return response;
        } catch (e) {
            if (__DEV__ && e instanceof Error) {
                this._logger.error(`Bad data: ${e.message}\n}`, e.stack);
            }
            return {
                kind: GeneralApiProblemKind.BadData,
                status: undefined,
                data: undefined,
                errors: [
                    {
                        errorCode: ErrorCode.CLIENT_UNKNOWN_ERROR,
                    },
                ],
            };
        }
    }

    public async doPatchCategory(
        id: number,
        body: { categoryName: string; iconId?: string },
    ): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: undefined;
          }
        | GeneralApiProblem
    > {
        try {
            this._logger.info('Start patch category');
            const userId = this._authService.userId;
            const response = await this.authPatch(`/user/${userId}/category/${id}`, {
                categoryName: String(body.categoryName),
                iconId: body.iconId ? String(body.iconId) : undefined,
            });
            if (response.kind === GeneralApiProblemKind.Ok) {
                this._logger.info(`Patch category successfully: ${(response.data as [])?.length}`);
            } else {
                this._logger.info(`Patch category failed: ${response.kind}`);
            }
            return response;
        } catch (e) {
            if (__DEV__ && e instanceof Error) {
                this._logger.error(`Bad data: ${e.message}\n}`, e.stack);
            }
            return {
                kind: GeneralApiProblemKind.BadData,
                status: undefined,
                data: undefined,
                errors: [
                    {
                        errorCode: ErrorCode.CLIENT_UNKNOWN_ERROR,
                    },
                ],
            };
        }
    }

    public async doCreateCategory(body: { categoryName: string; currencyId: number; iconId: string }): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: ICategory | undefined;
          }
        | GeneralApiProblem
    > {
        try {
            this._logger.info('Start create category');
            const userId = this._authService.userId;
            const response = await this.authPost(`/user/${userId}/category`, {
                categoryName: String(body.categoryName),
                currencyId: Number(body.currencyId),
                iconId: String(body.iconId),
            });
            if (response.kind === GeneralApiProblemKind.Ok) {
                this._logger.info(`Create category successfully: ${(response?.data as ICategory)?.categoryId}`);
            } else {
                this._logger.info(`Create category failed: ${response.kind}`);
            }
            return response;
        } catch (e) {
            if (__DEV__ && e instanceof Error) {
                this._logger.error(`Bad data: ${e.message}\n}`, e.stack);
            }
            return {
                kind: GeneralApiProblemKind.BadData,
                status: undefined,
                data: undefined,
                errors: [
                    {
                        errorCode: ErrorCode.CLIENT_UNKNOWN_ERROR,
                    },
                ],
            };
        }
    }

    public async doDeleteCategory(categoryId: number): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: ICategory | undefined;
          }
        | GeneralApiProblem
    > {
        try {
            this._logger.info(`Start deleting category ${categoryId}`);
            const userId = this._authService.userId;
            const response = await this.authDelete(`/user/${userId}/category/${categoryId}`);
            if (response.kind === GeneralApiProblemKind.Ok) {
                this._logger.info(`Delete category successfully id: ${categoryId}`);
            } else {
                this._logger.info(`Delete category failed: ${response.kind}`);
            }
            return response;
        } catch (e) {
            if (__DEV__ && e instanceof Error) {
                this._logger.error(`Bad data: ${e.message}\n}`, e.stack);
            }
            return {
                kind: GeneralApiProblemKind.BadData,
                status: undefined,
                data: undefined,
                errors: [
                    {
                        errorCode: ErrorCode.CLIENT_UNKNOWN_ERROR,
                    },
                ],
            };
        }
    }
}
