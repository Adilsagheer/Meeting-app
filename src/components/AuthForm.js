// AuthForm component for login/signup
import { useState } from "react";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import Skeleton from "@/components/Skeleton";

export default function AuthForm({ onAuth }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      let userCred;
      if (isLogin) {
        userCred = await signInWithEmailAndPassword(auth, email, password);
      } else {
        userCred = await createUserWithEmailAndPassword(auth, email, password);
      }
      localStorage.setItem("user", JSON.stringify(userCred.user));
      onAuth(userCred.user);
      // Redirect to intended meeting if present
      const redirectUrl = localStorage.getItem("redirectAfterAuth");
      if (redirectUrl) {
        localStorage.removeItem("redirectAfterAuth");
        router.push(redirectUrl);
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Skeleton type="form" />;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto mt-10 p-6 bg-white dark:bg-zinc-900 rounded shadow">
      <h2 className="text-xl font-bold mb-2 text-blue-700 dark:text-blue-300">{isLogin ? "Login" : "Sign Up"}</h2>
      <input
        className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-zinc-800 dark:text-white dark:border-zinc-700"
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
      />
      <div className="relative">
        <input
          className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 pr-10 dark:bg-zinc-800 dark:text-white dark:border-zinc-700"
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-300"
          tabIndex={-1}
          onClick={() => setShowPassword((v) => !v)}
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <button className="w-full bg-blue-600 dark:bg-blue-700 text-white p-2 rounded hover:bg-blue-700 dark:hover:bg-blue-800 transition" type="submit">
        {isLogin ? "Login" : "Sign Up"}
      </button>
      <button
        type="button"
        className="w-full text-blue-600 dark:text-blue-300 underline mt-2"
        onClick={() => setIsLogin(!isLogin)}
      >
        {isLogin ? "Create an account" : "Already have an account? Login"}
      </button>
    </form>
  );
}
