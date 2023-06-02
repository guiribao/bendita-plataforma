type LoginWrapperProps = {
  children: React.ReactNode;
};

export default function LoginWrapper({ children }: LoginWrapperProps) {
  return (
    <div className='flex items-center min-h-screen p-6 bg-gray-50 dark:bg-gray-900'>
      <div className='flex-1 h-full max-w-4xl mx-auto overflow-hidden bg-white rounded-lg shadow-xl dark:bg-gray-800'>
        {children}
      </div>
    </div>
  );
}
