import { logKeys } from '@/app/actions/keys';
import { toQueryString } from '@/lib/utils';
import { LogsParams, LogsResponse } from '@/types/api/log';
import { keepPreviousData, useQuery, UseQueryOptions } from '@tanstack/react-query';

async function fetchUseLogs(params: LogsParams): Promise<LogsResponse> {
  const query = toQueryString(params);
  const res = await fetch(`/api/logs?${query}`);
  const data = await res.json();
  return data;
}

export default function useLogs(
  { userId, currentPage = 1, pageSize = 12, sort }: Partial<LogsParams> = {},
  options?: Partial<UseQueryOptions<LogsResponse, Error>>
) {
  const params = {
    userId,
    currentPage,
    pageSize,
    sort,
  };
  return useQuery({
    queryKey: userId ? logKeys.listByUser(params) : logKeys.list(params),
    queryFn: () => fetchUseLogs(params),
    placeholderData: keepPreviousData,
    ...options,
  });
}
