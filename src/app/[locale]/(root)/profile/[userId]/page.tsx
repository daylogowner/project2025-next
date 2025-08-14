import { getPublicUser, getUser } from '@/app/actions/user';
import ProfileHeader from '@/components/features/profile/ProfileHeader/ProfileHeader';
import ProfileTabSection from '@/components/features/profile/ProfileTabContent/ProfileTabSection';
import { SITE_URL } from '@/constants/pathname';
import { getStoragePublicImage } from '@/utils/getStorageImage';
import { Metadata, ResolvingMetadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

interface ProfilepageProps {
  params: Promise<{ userId: string }>;
}

export async function generateMetadata(
  { params }: ProfilepageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { userId } = await params;
  const t = await getTranslations('NotFoundPage');
  const locale = await getLocale();
  const ogLocale = locale === 'ko' ? 'ko_KR' : 'en_US';

  // 게시물 데이터 가져오기
  const user = await getPublicUser(userId);
  if (!user?.user_id) {
    return {
      title: t('title'),
      description: t('userMessage'),
    };
  }

  const title = user.nickname || '';
  const description = user.description || '';
  const rawPath = user.image_url;
  const thumbnail = rawPath ? getStoragePublicImage(rawPath) : '/favicons/android-icon-192x192.png';

  // 부모 메타데이터 이미지 가져오기
  const previousImages = (await parent).openGraph?.images || [];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/profile/${userId}`,
      siteName: 'Placesurf',
      images: [{ url: thumbnail }, ...previousImages],
      type: 'article',
      locale: ogLocale,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [{ url: thumbnail }],
    },
  };
}

export default async function Page({ params }: ProfilepageProps) {
  const { userId } = await params;
  const me = await getUser();
  const isMe = me?.user_id === userId;

  const user = isMe ? me : await getPublicUser(userId);

  if (!user) {
    return notFound();
  }
  return (
    <main className="pt-7.5 web:pt-15 mx-4 web:mx-12.5 mb-35 web:mb-25">
      <ProfileHeader me={me} user={user} isMe={isMe} />
      <ProfileTabSection me={me} userId={userId} />
    </main>
  );
}
