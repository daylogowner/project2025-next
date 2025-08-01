import CarouselSection from '@/components/features/home/CarouselSection/CarouselSection';
import InfoBanners from '@/components/features/home/InfoBanner/InfoBanners';
import LatestLogContentSection from '@/components/features/home/LatestLogContentSection/LatestLogContentSection';
import LatestPlaceContentSection from '@/components/features/home/LatestPlaceContentSection/LatestPlaceContentSection';

interface MainPageProps {
  searchParams: Promise<{ logPage: string; popularityPage: string; placePage: string }>;
}

const MainPage = async ({ searchParams }: MainPageProps) => {
  const { popularityPage, logPage, placePage } = await searchParams;

  /* 참고: logPage는 URL 쿼리스트링에서 파싱되기 때문에 타입은 string이지만 값이 항상 보장되진 않음
  예: logPage=NaN, logPage=abc, logPage= 등 → Number() 처리 후 NaN으로 바뀜 */
  const parsedPopularityPage = Number(popularityPage);
  const currentPopularityPage =
    isNaN(parsedPopularityPage) || parsedPopularityPage < 1 ? 1 : parsedPopularityPage;

  const parsedLogPage = Number(logPage);
  const currentLogPage = isNaN(parsedLogPage) || parsedLogPage < 1 ? 1 : parsedLogPage;

  const parsedPlacePage = Number(placePage);
  const currentPlacePage = isNaN(parsedPlacePage) || parsedPlacePage < 1 ? 1 : parsedPlacePage;

  return (
    <main className="h-full">
      {/* <Login /> */}
      {/* <Hero /> */}
      <InfoBanners />
      <div className="pt-[60px] pb-[140px] px-4 web:px-[50px] space-y-20">
        <LatestPlaceContentSection currentPage={currentPlacePage} />
        <CarouselSection currentPage={currentPopularityPage} />
        <LatestLogContentSection currentPage={currentLogPage} />
      </div>
    </main>
  );
};

export default MainPage;
