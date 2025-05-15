'use server';

import { createClient } from '@/lib/supabase/server';
import { LogFormValues, NewLog, NewPlace, NewPlaceImage } from '@/types/schema/log';
import { parseFormData } from '@/utils/formatLog';
import { uploadFile } from './storage';

/* 로그 등록 */
export async function createLog(formData: FormData) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('유저 없음');

    const logId = crypto.randomUUID();
    console.time('📦 FormData 파싱');
    const parseResult = parseFormData<LogFormValues>(formData);
    console.timeEnd('📦 FormData 파싱');

    /* 썸네일 업로드 */
    console.time('🖼️ 썸네일 업로드');
    const thumbnailUploadResult = await uploadThumbnail(parseResult.thumbnail, logId);
    console.timeEnd('🖼️ 썸네일 업로드');
    if (!thumbnailUploadResult?.success) throw new Error(thumbnailUploadResult?.msg);

    /* 장소 이미지 업로드 */
    console.time('📍 장소 이미지 업로드');
    const { placeDataList, placeImageDataList } = await uploadPlaces(parseResult.places, logId);
    console.timeEnd('📍 장소 이미지 업로드');

    const logData = {
      log_id: logId,
      title: parseResult.logTitle,
      description: parseResult.logDescription,
      thumbnail_url: thumbnailUploadResult.fullPath,
    };
    console.time('🗃️ DB 삽입');
    await insertLogToDB({ logData, placeDataList, placeImageDataList });
    console.timeEnd('🗃️ DB 삽입');
    console.timeEnd('🕒 전체 createLog 실행 시간');

    return { success: true, data: logId };
  } catch (e) {
    console.error(e);
    return { success: false, msg: '로그 등록 실패' };
  }
}

/* 썸네일 업로드 */
async function uploadThumbnail(thumbnail: Blob, logId: string) {
  return await uploadFile('thumbnails', thumbnail, {
    folder: logId,
    subfolder: '',
    filename: `${logId}.webp`,
  });
}

/* 장소 이미지 업로드 */
async function uploadPlaces(places: LogFormValues['places'], logId: string) {
  const placeDataList: NewPlace[] = [];
  const placeImageDataList: NewPlaceImage[] = [];

  // 장소 개수만큼 이미지 생성
  for (let placeIdx = 0; placeIdx < places.length; placeIdx++) {
    const { placeName, description, location, category, placeImages } = places[placeIdx];
    const placeId = crypto.randomUUID();

    placeDataList.push({
      place_id: placeId,
      log_id: logId,
      name: placeName,
      description: description,
      address: location,
      category: category,
    });

    const uploads = placeImages.map(async ({ file, order }, imgIdx) => {
      const uploadResult = await uploadFile('places', file, {
        folder: logId,
        subfolder: placeId,
        filename: `${imgIdx}.webp`,
      });
      if (!uploadResult?.success) throw new Error(uploadResult?.msg);

      return {
        image_path: uploadResult.fullPath as string,
        order,
        place_id: placeId,
      };
    });

    const uploadedImages = await Promise.all(uploads);
    placeImageDataList.push(...uploadedImages);
  }

  return { placeDataList, placeImageDataList };
}

/* 테이블에 데이터 삽입 */
async function insertLogToDB({
  logData,
  placeDataList,
  placeImageDataList,
}: {
  logData: NewLog;
  placeDataList: NewPlace[];
  placeImageDataList: NewPlaceImage[];
}) {
  const supabase = await createClient();

  const { error: logError } = await supabase.from('log').insert(logData);
  if (logError) {
    console.error(logError);
    throw new Error('로그 테이블 업데이트 실패');
  }

  const { error: placeError } = await supabase.from('place').insert(placeDataList);
  if (placeError) {
    console.error(placeError);
    throw new Error('장소 테이블 업데이트 실패');
  }

  const { error: imageError } = await supabase.from('place_images').insert(placeImageDataList);
  if (imageError) {
    console.error(imageError);
    throw new Error('장소 이미지 테이블 업데이트 실패');
  }
}
