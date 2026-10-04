export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Student Project Intelligence</h1>
          <p className="text-sm text-slate-300 mt-1">
            Know what's going wrong, why, and what to do next.
          </p>
        </div>
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold">{title}</h2>
          {subtitle && <p className="text-sm text-slate-300 mt-1 mb-4">{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}