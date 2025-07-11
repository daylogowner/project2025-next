'use client';
import { Header3 } from '@/components/common/Header';
import PlaceForm from '@/components/features/log/common/PlaceForm';
import ConfirmRegistrationDialog from '@/components/features/log/register/ConfirmRegistrationDialog';
import PhotoTextSection from '@/components/features/log/register/PhotoTextSection';
import TitledInput from '@/components/features/log/register/TitledInput';
import { Form } from '@/components/ui/form';
import { REGISTER_PATHS } from '@/constants/pathname';
import useLogCreateMutation from '@/hooks/mutations/log/useLogCreateMutation';
import { useRouter } from '@/i18n/navigation';
import { trackLogCreateEvent } from '@/lib/analytics';
import { LogFormSchema } from '@/lib/zod/logSchema';
import { useLogCreationStore } from '@/stores/logCreationStore';
import { LogFormValues } from '@/types/log';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';

const initialPlace = {
  placeName: '',
  category: '',
  location: '',
  description: '',
  placeImages: [],
};

const LogPage = () => {
  const router = useRouter();
  const country = useLogCreationStore((state) => state.country);
  const city = useLogCreationStore((state) => state.city);
  const sigungu = useLogCreationStore((state) => state.sigungu);
  const hydrated = useLogCreationStore((state) => state.hydrated);
  const { mutate, isPending } = useLogCreateMutation();

  const t = useTranslations('Register.LogPage');

  useEffect(() => {
    if (!hydrated) return;
    if (!country || !city || !sigungu) router.replace(REGISTER_PATHS.MOOD);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);
  const form = useForm({
    resolver: zodResolver(LogFormSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      logTitle: '',
      thumbnail: undefined,
      logDescription: '',
      places: [initialPlace],
      tags: {
        mood: useLogCreationStore.getState().mood,
        activity: useLogCreationStore.getState().activity,
      },
      address: {
        country: useLogCreationStore.getState().country,
        city: useLogCreationStore.getState().city,
        sigungu: useLogCreationStore.getState().sigungu,
      },
    },
  });
  const { fields, append, remove, swap } = useFieldArray<LogFormValues>({
    control: form.control,
    name: 'places',
  });

  const handleAddNewPlace = () => {
    if (fields.length >= 10) {
      toast.info(t('maxPlaceError'));
      return;
    }
    append(initialPlace);
  };
  const handleDeletePlace = (idx: number) => remove(idx);
  const handleMovePlaceUp = (idx: number) => {
    if (idx <= 0) return;
    swap(idx, idx - 1);
  };
  const handleMovePlaceDown = (idx: number) => {
    if (idx >= fields.length - 1) return;
    swap(idx, idx + 1);
  };

  const onSubmit = async (values: LogFormValues) => {
    // GA 이벤트 추적 - 로그 등록 시작
    trackLogCreateEvent('start');

    // console.log(values);
    mutate({ values });
  };

  return (
    <div className="flex flex-col h-full">
      <Header3 onAddNewPlace={handleAddNewPlace} />
      <Form {...form}>
        <main className="grow bg-white pt-[54px]">
          <TitledInput />
          <PhotoTextSection thumbnail />
          <div className="flex flex-col gap-2">
            {fields.map((field, idx) => (
              <PlaceForm
                key={field.id}
                idx={idx}
                onDeletePlace={handleDeletePlace}
                onMoveUpPlace={handleMovePlaceUp}
                onMoveDownPlace={handleMovePlaceDown}
              />
            ))}
          </div>
        </main>
      </Form>

      {/* footer */}
      <div className="text-[13px] w-full h-9 rounded-md flex items-center justify-center bg-error-50 text-red-500 my-2.5">
        {t('deleteWarning')}
      </div>

      <ConfirmRegistrationDialog
        logTitle={form.getValues('logTitle')}
        disabled={!form.formState.isValid || form.formState.isSubmitting || isPending}
        loading={isPending}
        onSubmitLogForm={form.handleSubmit(onSubmit)}
      />
    </div>
  );
};

export default LogPage;
