import { FiX } from "react-icons/fi"
import { FaGithub } from "react-icons/fa"
import styles from "./styles.module.scss"
import { signIn, signOut, useSession } from "next-auth/react"

export function SingInButton() {
  const { data } = useSession()
  return data ? (
    <button
      className={styles.SignInButton}
      type="button"
      onClick={() => signOut()}
    >
      <FaGithub color={"#04d361"} />
      <span>{data.user.name}</span>
      <FiX color="#707080" className={styles.closeButton} />
    </button>
  ) : (
    <button
      type="button"
      className={styles.SignInButton}
      onClick={() => signIn("github")}
    >
      <FaGithub color={"#eba417"} />
      <span>Sign In with Github</span>
    </button>
  )
}
