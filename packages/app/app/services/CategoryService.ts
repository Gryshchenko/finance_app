import { ICategory, ICategoryStats, IGetStatsProperties, IStatsResponse } from '@tenpercent/shared';

import { ApiAbstract } from '@/services/api/apiAbstract';
import { GeneralApiProblem, GeneralApiProblemKind } from '@/services/api/apiProblem';
import { ValidationError } from '@/utils/errors/ValidationError';
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
        return this.withErrorHandler(async () => {
            this._logger.info('Start fetching categorys');
            const userId = this._authService.userId;
            const response = await this.authGet(`/user/${userId}/category/${categoryId}`);
            if (response.kind === GeneralApiProblemKind.Ok) {
                this._logger.info(`Fetching account successfully: ${(response.data as ICategory)?.categoryId}`);
            } else {
                this._logger.info(`Fetching account failed: ${response.kind}`);
            }
            return response;
        });
    }

    public async doGetCategoriesWithStats({ from, to, period }: IGetStatsProperties): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: IStatsResponse<ICategoryStats>;
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => {
            if (!from || !to || !period) {
                throw new ValidationError({ message: `Invalid params: from: ${from}, to: ${to}, period: ${period}` });
            }
            this._logger.info(`Start fetching categories with stats from`);
            const userId = this._authService.userId;
            const response = await this.authGet(`/user/${userId}/categories/stats?from=${from}&to=${to}&period=${period}`);
            if (response.kind === GeneralApiProblemKind.Ok) {
                this._logger.info(`Fetching categories with stats successfully: ${(response.data as ICategory[])?.length}`);
            } else {
                this._logger.info(`Fetching categories with stats failed: ${response.kind}`);
            }
            return response;
        });
    }

    public async doGetCategories(): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: ICategory[];
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => {
            this._logger.info(`Start fetching categories from`);
            const userId = this._authService.userId;
            const response = await this.authGet(`/user/${userId}/categories`);
            if (response.kind === GeneralApiProblemKind.Ok) {
                this._logger.info(`Fetching categories successfully: ${(response.data as ICategory[])?.length}`);
            } else {
                this._logger.info(`Fetching categories failed: ${response.kind}`);
            }
            return response;
        });
    }

    public async doPatchCategory(
        id: number,
        body: { categoryName: string; iconId?: string; budget?: number | null },
    ): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: undefined;
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => {
            this._logger.info('Start patch category');
            const userId = this._authService.userId;
            const response = await this.authPatch(`/user/${userId}/category/${id}`, {
                categoryName: String(body.categoryName),
                iconId: body.iconId ? String(body.iconId) : undefined,
                budget: body.budget ?? undefined,
            });
            if (response.kind === GeneralApiProblemKind.Ok) {
                this._logger.info(`Patch category successfully: ${(response.data as [])?.length}`);
            } else {
                this._logger.info(`Patch category failed: ${response.kind}`);
            }
            return response;
        });
    }

    public async doCreateCategory(body: {
        categoryName: string;
        currencyCode: string;
        iconId: string;
        budget?: number | null;
    }): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: ICategory | undefined;
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => {
            this._logger.info('Start create category');
            const userId = this._authService.userId;
            const response = await this.authPost(`/user/${userId}/category`, {
                categoryName: String(body.categoryName),
                currencyCode: body.currencyCode,
                iconId: String(body.iconId),
                budget: body.budget ?? undefined,
            });
            if (response.kind === GeneralApiProblemKind.Ok) {
                this._logger.info(`Create category successfully: ${(response?.data as ICategory)?.categoryId}`);
            } else {
                this._logger.info(`Create category failed: ${response.kind}`);
            }
            return response;
        });
    }

    public async doDeleteCategory(
        categoryId: number,
        { keepData }: { keepData: boolean },
    ): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: ICategory | undefined;
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => {
            this._logger.info(`Start deleting category ${categoryId}`);
            const userId = this._authService.userId;
            const response = await this.authDelete(`/user/${userId}/category/${categoryId}`, { keepData });
            if (response.kind === GeneralApiProblemKind.Ok) {
                this._logger.info(`Delete category successfully id: ${categoryId}`);
            } else {
                this._logger.info(`Delete category failed: ${response.kind}`);
            }
            return response;
        });
    }
}
