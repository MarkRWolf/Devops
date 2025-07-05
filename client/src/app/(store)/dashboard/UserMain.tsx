import { User } from "@/lib/user/user";
import UserClient from "./UserClient";

interface UserProps {
  user: User;
}

const UserMain = (props: UserProps) => {
  return (
    <main className="text-center space-y-4 py-10">
      <UserClient user={props.user} />
    </main>
  );
};
export default UserMain;
