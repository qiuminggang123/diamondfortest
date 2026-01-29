import { useSession, signOut } from "next-auth/react";

export function useAuthStatus() {
  const { data: session, status } = useSession();
  return {
    isLoggedIn: !!session,
    user: session?.user,
    status,
    signOut,
  };
}
