import { logKeys } from '@/app/actions/keys';
import { getLog } from '@/app/actions/log';
import { getUser } from '@/app/actions/user';
import { PenBlackIcon, TableIcon } from '@/components/common/Icons';
import ExtraActionButton from '@/components/features/detail-log/ExtraActionButton';
import LogAuthorIntro from '@/components/features/detail-log/LogAuthorIntro';
import LogBookmarkWithCount from '@/components/features/detail-log/LogBookmarkWithCount';
import LogContentSection from '@/components/features/detail-log/LogContentSection';
import LogThumbnail from '@/components/features/detail-log/LogThumbnail';
import { Link } from '@/i18n/navigation';
import { getQueryClient } from '@/lib/utils';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { notFound } from 'next/navigation';
export interface LogIdParams {
  logId: string;
}
interface LogDetailPageProps {
  params: Promise<LogIdParams>;
}

const LogDetailPage = async ({ params }: LogDetailPageProps) => {
  const { logId } = await params;
  const result = await getLog(logId);

  if (!result.success) {
    notFound();
  }
  const { data: logData } = result;
  const user = await getUser();
  const isAuthor = user?.user_id === logData.user_id;

  const queryClient = getQueryClient();

  //queryClient.setQueryData(logKeys.detail(logId), result);

  await queryClient.prefetchQuery({
    queryKey: logKeys.detail(logId),
    queryFn: () => getLog(logId),
  });
  const dehydratedState = dehydrate(queryClient);
  return (
    <HydrationBoundary state={dehydratedState}>
      <div>
        <LogThumbnail logData={logData} isAuthor={isAuthor} />
        <main className="flex flex-col px-4 web:px-[50px] pb-[200px]">
          <LogAuthorIntro
            userId={logData.user_id}
            userNickname={String(logData.users.nickname)}
            userImgUrl={String(logData.users.image_url)}
            logDescription={logData.description ?? ''}
          />
          <LogContentSection logId={logId} />
        </main>

        <div className="flex flex-col items-center gap-2 fixed z-10 bottom-10 web:right-[50px] right-4">
          {isAuthor ? (
            <ExtraActionButton className="w-11 h-11">
              <Link href={`/${logData.log_id}/edit`}>
                <PenBlackIcon />
              </Link>
            </ExtraActionButton>
          ) : (
            <LogBookmarkWithCount logId={logData.log_id} />
          )}
          <ExtraActionButton className="w-11 h-11" asChild>
            <Link href={`/log/${logData.log_id}/placeCollect`}>
              <TableIcon />
            </Link>
          </ExtraActionButton>
        </div>
      </div>
    </HydrationBoundary>
  );
};

export default LogDetailPage;
