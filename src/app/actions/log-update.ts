'use server';
import { createClient } from '@/lib/supabase/server';
import { LogEditFormValues } from '@/types/log';
import { parseFormData } from '@/utils/formatLog';
import { SupabaseClient } from '@supabase/supabase-js';
import { revalidateTag } from 'next/cache';
import { deleteFilesInFolder, getListAllFilesInFolder } from './storage';
import { globalTags } from './tags';

export async function updateLog(formData: FormData, logId: string) {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('유저 없음');

    const parseResult = parseFormData<LogEditFormValues>(formData);

    await performDatabaseUpdates(supabase, logId, parseResult);

    // Storage 작업은 DB 작업 후 수행
    await performStorageOperations(supabase, user.id, logId, parseResult);

    // 캐시 무효화
    invalidateCache();

    return { success: true };
  } catch (error) {
    console.error('로그 수정 실패:', error);
    return { success: false, msg: error instanceof Error ? error.message : '로그 수정 실패' };
  }
}

async function performDatabaseUpdates(
  supabase: SupabaseClient,
  logId: string,
  parseResult: LogEditFormValues
) {
  // 1. 로그 데이터 업데이트
  if (parseResult.logTitle) {
    const { error: logError } = await supabase
      .from('log')
      .update({ title: parseResult.logTitle })
      .eq('log_id', logId);

    if (logError) throw new Error('로그 테이블 업데이트 실패');
  }

  // 2. 태그 업데이트
  if (parseResult.tags) {
    await updateTags(supabase, logId, parseResult.tags);
  }

  // 3. 장소 데이터 업데이트
  if (Array.isArray(parseResult.places) && parseResult.places.length > 0) {
    await updatePlaces(supabase, parseResult.places);
  }

  // 4. 장소 삭제
  if (parseResult.deletedPlace?.length) {
    await deletePlacesFromDB(supabase, parseResult.deletedPlace);
  }

  // 5. 장소 이미지 삭제
  if (parseResult.deletedPlaceImages?.length) {
    await deletePlaceImagesFromDB(supabase, parseResult.deletedPlaceImages);
  }
}

async function performStorageOperations(
  supabase: SupabaseClient,
  userId: string,
  logId: string,
  parseResult: LogEditFormValues
) {
  // 장소 삭제 시 Storage에서 이미지 삭제
  if (parseResult.deletedPlace?.length) {
    await deletePlacesFromStorage(userId, logId, parseResult.deletedPlace);
  }

  // 장소 이미지 삭제 시 Storage에서 파일 삭제
  if (parseResult.deletedPlaceImages?.length) {
    await deletePlaceImagesFromStorage(supabase, parseResult.deletedPlaceImages);
  }
}

// 태그 업데이트 함수
async function updateTags(supabase: SupabaseClient, logId: string, tags: any) {
  const upsertTagsByCategory = async (category: 'mood' | 'activity') => {
    const categoryTags = tags[category];
    if (!categoryTags?.length) return;

    // 기존 태그 삭제
    const { error: deleteError } = await supabase
      .from('log_tag')
      .delete()
      .eq('log_id', logId)
      .eq('category', category);

    if (deleteError) throw new Error(`${category} 태그 삭제 실패`);

    // 새 태그 추가
    const newTags = categoryTags.map((tag: string) => ({
      log_id: logId,
      tag,
      category,
    }));

    const { error: insertError } = await supabase.from('log_tag').insert(newTags);

    if (insertError) throw new Error(`${category} 태그 삽입 실패`);
  };

  await Promise.all([upsertTagsByCategory('mood'), upsertTagsByCategory('activity')]);
}

// 장소 업데이트 함수
async function updatePlaces(supabase: SupabaseClient, places: any[]) {
  const updatePromises = places.map(async (place) => {
    const placeData: Record<string, any> = {};
    if (place.placeName) placeData.name = place.placeName;
    if (place.description) placeData.description = place.description;
    if (place.category) placeData.category = place.category;
    if (place.location) placeData.address = place.location;
    if (place.order) placeData.order = place.order;
    placeData.updated_at = new Date();

    const { error: placeError } = await supabase
      .from('place')
      .update(placeData)
      .eq('place_id', place.id);

    if (placeError) throw new Error(`장소 ${place.id} 업데이트 실패`);

    // 이미지 순서 업데이트
    if (place.placeImages?.length) {
      await updateImageOrders(supabase, place.placeImages);
    }
  });

  await Promise.all(updatePromises);
}

// 이미지 순서 업데이트 함수
async function updateImageOrders(supabase: SupabaseClient, placeImages: any[]) {
  const updatePromises = placeImages.map(async (image: any, index: number) => {
    const { error } = await supabase
      .from('place_images')
      .update({ order: index + 1 })
      .eq('place_image_id', image.place_image_id);

    if (error) throw new Error(`이미지 ${image.place_image_id} 순서 업데이트 실패`);
  });

  await Promise.all(updatePromises);
}

// DB에서 장소 삭제
async function deletePlacesFromDB(supabase: SupabaseClient, placeIds: string[]) {
  const deletePromises = placeIds.map(async (placeId) => {
    const { error } = await supabase.from('place').delete().eq('place_id', placeId);

    if (error) throw new Error(`장소 ${placeId} 삭제 실패`);
  });

  await Promise.all(deletePromises);
}

// Storage에서 장소 이미지 삭제(장소 삭제로 전체 삭제)
async function deletePlacesFromStorage(userId: string, logId: string, placeIds: string[]) {
  const deletePromises = placeIds.map(async (placeId) => {
    const folderPath = `${userId}/${logId}/${placeId}`;
    const files = await getListAllFilesInFolder(folderPath, 'places');
    if (files && files.length > 0) {
      await deleteFilesInFolder(folderPath, files, 'places');
    }
  });

  await Promise.allSettled(deletePromises);
}

// DB에서 장소 이미지 삭제
async function deletePlaceImagesFromDB(supabase: SupabaseClient, imageIds: number[]) {
  const { error } = await supabase.from('place_images').delete().in('place_image_id', imageIds);
  if (error) throw new Error('place_images 삭제 실패');
}

// Storage에서 장소 이미지 삭제
async function deletePlaceImagesFromStorage(supabase: SupabaseClient, imageIds: number[]) {
  // 삭제할 이미지 정보 조회
  const { data: deletedImages, error: fetchError } = await supabase
    .from('place_images')
    .select('image_path')
    .in('place_image_id', imageIds);

  if (fetchError) throw new Error('삭제할 이미지 정보 조회 실패');

  // Storage에서 실제 파일 삭제
  if (deletedImages?.length) {
    // console.log('삭제할 이미지들:', deletedImages);
    const deletePromises = deletedImages.map(async (image: { image_path: string }) => {
      const relativePath = image.image_path.replace(/^places\//, ''); // 버킷이름까지 들어있어서 제거
      console.log('삭제 시도:', relativePath);
      const { error } = await supabase.storage.from('places').remove([relativePath]);
      if (error) {
        console.warn('Storage 이미지 삭제 실패:', relativePath, error);
      } else {
        console.log('Storage 이미지 삭제 성공:', relativePath);
      }
    });

    await Promise.allSettled(deletePromises);
  }
}

function invalidateCache() {
  const tagsToInvalidate = [globalTags.logAll, globalTags.placeAll, globalTags.searchAll];

  tagsToInvalidate.forEach((tag) => revalidateTag(tag));
}
