import { logKeys, placeKeys } from '@/app/actions/keys';
import { revalidateLogs } from '@/app/actions/log';
import { revalidatePlaces } from '@/app/actions/place';
import ErrorTemplate from '@/components/common/ErrorTemplate';
import { getTranslations } from 'next-intl/server';

export default async function NotFound() {
  const t = await getTranslations('NotFoundPage');
  return (
    <ErrorTemplate
      message={t('logMessage')}
      invalidateKeys={[logKeys.all[0], placeKeys.all[0]]}
      onMountEffect={() => {
        revalidateLogs();
        revalidatePlaces();
      }}
    />
  );
}
