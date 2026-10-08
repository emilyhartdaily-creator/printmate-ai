import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ClearCart from './ClearCart';

const STEPS = [
  { label: 'Order placed', detail: 'Payment received', state: 'done' as const },
  {
    label: 'Sent to nearest print partner',
    detail: 'Routing to the closest printer',
    state: 'current' as const,
  },
  { label: 'Printing', detail: 'Your design comes to life', state: 'todo' as const },
  { label: 'Shipped', detail: 'Tracking on its way', state: 'todo' as const },
];

export default function OrderSuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string };
}) {
  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <ClearCart />
      <main className="mx-auto max-w-2xl px-4 py-12">
        <div className="card text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
            <svg
              className="h-8 w-8 text-emerald-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="section-title font-display mt-4">
            <span className="gradient-text">Payment successful</span>
          </h1>
          <div className="mt-3 inline-block">
            <span className="badge">Test mode — no real charge</span>
          </div>
          <p className="mt-4 text-muted">
            Thanks for your order! A confirmation email with your receipt is on
            its way.
            {searchParams.session_id && (
              <span className="mt-1 block text-xs opacity-70">
                Session {searchParams.session_id.slice(0, 24)}…
              </span>
            )}
          </p>

          <div className="mt-8 text-left">
            <h2 className="font-display text-lg font-bold">Order tracking</h2>
            <ol className="mt-4 space-y-0">
              {STEPS.map((step, i) => (
                <li key={step.label} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                        step.state === 'done'
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                          : step.state === 'current'
                            ? 'border-brand-500 bg-brand-500/20 text-brand-600'
                            : 'border-line bg-surface text-muted'
                      }`}
                    >
                      {step.state === 'done' ? (
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <span className="text-xs font-bold">{i + 1}</span>
                      )}
                    </div>
                    {i < STEPS.length - 1 && (
                      <div
                        className={`w-0.5 flex-1 py-1 ${
                          step.state === 'done' ? 'bg-emerald-500/50' : 'bg-line'
                        }`}
                        style={{ minHeight: '28px' }}
                      />
                    )}
                  </div>
                  <div className="pb-6">
                    <p
                      className={`font-semibold ${
                        step.state === 'todo' ? 'text-muted' : ''
                      }`}
                    >
                      {step.label}
                      {step.state === 'current' && (
                        <span className="badge ml-2">in progress</span>
                      )}
                    </p>
                    <p className="text-sm text-muted">{step.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <p className="mt-2 text-sm text-muted">
            You will receive email updates as your order moves through each step.
          </p>

          <a href="/" className="btn-primary mt-6 inline-flex">
            Continue shopping
          </a>
        </div>
      </main>
      <Footer />
    </div>
  );
}
