import { useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { useAuth } from "../context/AuthContext";

const inputClass =
  "w-full rounded bg-slate-700 border border-slate-600 px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500";

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [form, setForm] = useState({ email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    const result = resetPassword(form.email, form.password);
    if (result.ok) setDone(true);
    else setError(result.error);
  };

  if (done) {
    return (
      <AuthLayout title="Password updated">
        <p className="text-sm text-slate-300 mb-4">
          Your password was changed. You can log in with the new one.
        </p>
        <Link
          to="/login"
          className="block text-center rounded bg-blue-600 hover:bg-blue-500 px-4 py-2 font-medium"
        >
          Go to login
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot password"
      subtitle="Enter your email and choose a new password."
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Email"
          required
          className={inputClass}
        />
        <input
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          placeholder="New password"
          required
          className={inputClass}
        />
        <input
          name="confirm"
          type="password"
          value={form.confirm}
          onChange={handleChange}
          placeholder="Confirm new password"
          required
          className={inputClass}
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          className="w-full rounded bg-blue-600 hover:bg-blue-500 px-4 py-2 font-medium"
        >
          Reset password
        </button>
      </form>

      <p className="text-sm mt-4">
        <Link to="/login" className="text-blue-400 hover:text-blue-300">
          ? Back to login
        </Link>
      </p>
    </AuthLayout>
  );
}
