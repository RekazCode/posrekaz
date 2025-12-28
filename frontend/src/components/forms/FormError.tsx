interface FormErrorProps {
  message: string;
}

export function FormError({ message }: FormErrorProps) {
  return (
    <div
      className="flex items-center gap-2 p-3 rounded-lg mb-4"
      style={{
        backgroundColor: 'var(--color-error-50)',
        color: 'var(--color-error-700)',
      }}
      role="alert"
    >
      <svg
        className="w-5 h-5 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span className="text-sm">{message}</span>
    </div>
  );
}
