export interface PaginatedResult<T> {
    items: T[]
    total: number
    page: number
    pageSize: number
}

export interface PaginatedApiResponse<T> {
    items: T[]
    total: number
    page: number
    pageSize: number
}

