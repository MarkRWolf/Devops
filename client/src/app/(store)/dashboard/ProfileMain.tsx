import { User } from "@/lib/user/user";
import ProfileClient from "./ProfileClient";

interface UserProps {
  user: User;
}

const ProfileMain = (props: UserProps) => {
  const user = props.user;
  return (
    <main className="space-y-4 py-10">
      <h1 className="text-center text-xl font-bold">Hi, {user.username}</h1>
      <ProfileClient user={props.user} />
    </main>
  );
};
export default ProfileMain;
