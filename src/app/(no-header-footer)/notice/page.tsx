import NoticeHeader from '@/components/features/notice/NoticeHeader';

export default function NoticePage() {
  return (
    <main className="flex justify-center w-full">
      <div className="max-w-[724px] w-full">
        <NoticeHeader title="공지사항" />
        {/* <NoticeList /> */}
      </div>
    </main>
  );
}
