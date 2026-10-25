import { Outlet } from 'react-router-dom';
import { Sun, Moon, Store } from 'lucide-react';
import { useUIStore } from '../../store';

export function AuthLayout() {
  const { theme, setTheme } = useUIStore();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIwOS0xLjc5MS00LTQtNHMtNCAxLjc5MS00IDQgMS43OTEgNCA0IDQgNC0xLjc5MSA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className="mb-8">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shadow-lg">
              <Store className="w-9 h-9 text-white" />
            </div>
          </div>

          <h1 className="text-4xl xl:text-5xl font-bold text-white mb-2">
            Avora
          </h1>
          <p className="text-xl text-white/90 font-medium mb-2">
            Cổng Nhà Bán
          </p>
          <p className="text-lg text-white/75 max-w-md">
            Quản lý cửa hàng trực tuyến, theo dõi đơn hàng, phân tích doanh số và phát triển kinh doanh trên nền tảng thương mại điện tử.
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-secondary-500/30 rounded-full blur-3xl"></div>
      </div>

      {/* Right side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative">
        {/* Theme toggle */}
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="btn-ghost btn-icon"
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </button>
        </div>

        <div className="w-full max-w-md">
          {/* Logo for mobile */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Store className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
              Avora
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Cổng Nhà Bán
            </p>
          </div>

          <div className="card p-8">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
