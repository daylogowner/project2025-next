'use client';

import { LogRegisterHeader } from '@/components/common/Header';
import { PlusSemiboldIcon } from '@/components/common/Icons';
import PlaceForm from '@/components/features/log/common/PlaceForm';
import ConfirmRegistrationDialog from '@/components/features/log/register/ConfirmRegistrationDialog';
import TitledInput from '@/components/features/log/register/TitledInput';
import { Form } from '@/components/ui/form';
import { REGISTER_PATHS } from '@/constants/pathname';
import useLogCreateMutation from '@/hooks/mutations/log/useLogCreateMutation';
import { INITIAL_PLACE, usePlacesHandlers } from '@/hooks/usePlacesHandlers';
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

const LogPage = () => {
  const router = useRouter();
  const { mutate, isPending } = useLogCreateMutation();
  const t = useTranslations('Register.LogPage');
  const tToast = useTranslations('Toast.logCreate');
  const country = useLogCreationStore((state) => state.country);
  const city = useLogCreationStore((state) => state.city);
  const sigungu = useLogCreationStore((state) => state.sigungu);
  const mood = useLogCreationStore((state) => state.mood);
  const activity = useLogCreationStore((state) => state.activity);
  const hydrated = useLogCreationStore((state) => state.hydrated);

  // 로그 등록 완료 여부(로그 제출 중에 태그가 초기화되는 것을 방지)
  const submitted = useLogCreationStore((state) => state.submitted);

  const form = useForm<LogFormValues>({
    resolver: zodResolver(LogFormSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      logTitle: '',
      places: [INITIAL_PLACE],
      tags: {
        mood,
        activity,
      },
      address: {
        country,
        city,
        sigungu,
      },
    },
  });

  // 주소 누락 시, 주소 등록 페이지로 이동
  useEffect(() => {
    const isAddressMissing = !country || !city || !sigungu;

    if (hydrated && isAddressMissing && !submitted) {
      toast.error(tToast('locationMissing'));
      router.replace(REGISTER_PATHS.LOCATION);
    }
  }, [hydrated, country, city, sigungu, submitted, router, tToast]);

  const { fields, append, remove, swap } = useFieldArray<LogFormValues>({
    control: form.control,
    name: 'places',
  });

  // 장소 관련 핸들러
  const { handleAddNewPlace, handleDeletePlace, handleMovePlaceUp, handleMovePlaceDown } =
    usePlacesHandlers(fields, append, remove, swap);

  const onSubmit = async (values: LogFormValues) => {
    trackLogCreateEvent('start');

    // console.log(values, { values });
    mutate(values);
  };

  return (
    <div className="flex flex-col">
      <LogRegisterHeader onAddNewPlace={handleAddNewPlace} />
      <Form {...form}>
        <main className="grow bg-white pt-[66px]">
          <TitledInput />
          <div className="flex flex-col">
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
          <div className="flex justify-center mt-4 mb-4">
            <button
              className="flex items-center justify-center gap-1.5 font-semibold text-text-md
             bg-black text-white rounded-full px-4 py-2
             hover:bg-light-900 hover:text-white"
              onClick={handleAddNewPlace}
            >
              <PlusSemiboldIcon className="fill-light-500" />
              {t('addPlace')}
            </button>
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
