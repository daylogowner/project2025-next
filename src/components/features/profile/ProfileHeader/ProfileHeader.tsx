import ClipboardButton from '@/components/common/Button/ClipboardButton';
import UserImage from '@/components/common/UserImage';
import { IUser, PublicUser } from '@/types/api/user';
import FollowButtons from './components/FollowButtons';
import ProfileActionButton from './components/ProfileActionButton';

interface ProfileHeaderProps {
  me: IUser;
  user: PublicUser;
  isMe: boolean;
}

export default function ProfileHeader({ me, user, isMe }: ProfileHeaderProps) {
  return (
    <section className="relative flex flex-col items-center justify-start w-full pb-7.5 web:pb-10">
      <div className="absolute top-0 right-[15px] web:right-0">
        <ClipboardButton />
      </div>
      <section>
        <UserImage imgSrc={String(user?.image_url)} />
      </section>
      <section className="gap-[6px] flex justify-center items-center my-3">
        {/* VerifiedLabelIcon 도입 시 h2 태그에 pl-3 추가 */}
        <h2 className="font-bold text-md web:text-xl">{user?.nickname}</h2>
        {/* <VerifiedLabelIcon className="w-[16.075px] h-[15.921px] web:w-[22px] web:h-[21px]" /> */}
      </section>
      <section className="flex gap-[15px] py-1 text-text-lg web:text-text-2xl">
        <FollowButtons isMe={isMe} userId={String(user?.user_id)} me={me} />
      </section>
      <section className="flex my-[7px] flex-col gap-[10px] web:gap-[15px] items-center text-light-300 font-medium text-center text-text-xs web:text-text-sm">
        <h3>
          {user?.description ? (
            user?.description
          ) : (
            <>
              소소한 하루, 특별한 순간들을 기록하는 공간 ☕️ <br /> 일상의 작은 행복부터 여행의
              찰나까지 🏞️
            </>
          )}
        </h3>
        <h3>{user?.insta_id || ''}</h3>
      </section>
      <ProfileActionButton
        me={me}
        userId={String(user?.user_id)}
        className="mt-[10px] min-h-0 web:mt-[15px] p-2 w-[50px] web:w-[60px] h-[24px] web:h-[28px] rounded-[60px] font-medium text-text-xs"
      />
    </section>
  );
}
