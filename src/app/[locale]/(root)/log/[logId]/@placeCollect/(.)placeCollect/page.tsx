import { LogIdParams } from '@/app/[locale]/(root)/log/[logId]/page';
import { getLog } from '@/app/actions/log';
import XButton from '@/components/common/Button/XButton';
import PlaceCard from '@/components/common/Card/PlaceCard.tsx/PlaceCard';
import { ModalContent, ModalHeader } from '@/components/common/Modal';
import { PlaceWithImages } from '@/types/api/log';
interface PlaceCollectProps {
  params: Promise<LogIdParams>;
}
export default async function PlaceCollect({ params }: PlaceCollectProps) {
  const { logId } = await params;
  const result = await getLog(logId);
  if (!result.success) {
    return null;
  }
  const { place: places, address } = result.data;
  return (
    <ModalContent className="web:h-[600px]">
      <ModalHeader className="justify-between p-0 pb-4">
        <h3 className="font-bold text-text-2xl">소개된 장소</h3>
        <XButton />
      </ModalHeader>
      <section className="grid grid-cols-3 w-full gap-x-[5px] gap-y-5 overflow-y-auto scrollbar-hide">
        {places.map((place: PlaceWithImages, idx: number) => (
          <PlaceCard key={idx} place={place} address={address[0]} vertical modal />
        ))}
      </section>
    </ModalContent>
  );
}
