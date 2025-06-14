import { ArrowUpRightIcon } from '@/components/common/Icons';
import { Button } from '@/components/ui/button';
import { REGISTER_PATHS } from '@/constants/pathname';
import Link from 'next/link';
import InfoBanner from './InfoBanner';
import TypingText from './TypingText';

const InfoBanners = () => {
  return (
    <div className="grid grid-rows-2 web:grid-rows-1 web:grid-cols-2 web:gap-[30px]">
      <InfoBanner>
        <TypingText />
        <div className="flex items-center">
          <Button
            className="rounded-full !text-text-sm web:!text-text-md font-medium text-white"
            size={'lg'}
            asChild
          >
            <Link href={REGISTER_PATHS.MOOD}>나의 추천 코스 등록하기</Link>
          </Button>
          <Button className="rounded-full" size={'icon'} asChild>
            <Link href={REGISTER_PATHS.MOOD}>
              <ArrowUpRightIcon />
            </Link>
          </Button>
        </div>
      </InfoBanner>
      <InfoBanner className="border-t-0 web:border-t">
        <p className="web:px-5">
          내가 좋아하는 숨은 명소와 맛집을 공유하고, 다른 유저들이 여러분의 루트를 참고하며
          <br />
          &quot;내가 만든 코스로 누군가 즐거운 하루를 보냈구나!&quot; 하는 느낌!
          <br />
          상상만 해도 행복하지 않나요? 🥰
          <br />
          다른 유저들이 참고할 수 있도록 여러분만의 코스를 나눠보세요.
          <br />
          여러분이 만들어준 코스는 많은 사람들에게 새로운 영감을 줄 거예요!
        </p>
      </InfoBanner>
    </div>
  );
};

export default InfoBanners;
