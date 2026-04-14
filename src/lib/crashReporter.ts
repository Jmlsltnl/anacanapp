import { supabase } from '@/integrations/supabase/client';

interface CrashReport {
  error_message: string;
  error_stack?: string;
  component_stack?: string;
  url?: string;
  user_agent?: string;
  app_version?: string;
  platform?: string;
  extra_data?: Record<string, unknown>;
}

// Dedupe: skip if same message was reported in last 30s
let lastReport = { message: '', time: 0 };
const DEDUPE_MS = 30_000;

const detectPlatform = (): string => {
  const ua = navigator.userAgent || '';
  if (/android/i.test(ua)) return 'android';
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  return 'web';
};

async function sendCrashReport(report: CrashReport) {
  const now = Date.now();
  if (report.error_message === lastReport.message && now - lastReport.time < DEDUPE_MS) return;
  lastReport = { message: report.error_message, time: now };

  try {
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('crash_reports').insert({
      user_id: user?.id || null,
      error_message: report.error_message.slice(0, 2000),
      error_stack: report.error_stack?.slice(0, 5000) || null,
      component_stack: report.component_stack?.slice(0, 3000) || null,
      url: report.url || window.location.href,
      user_agent: report.user_agent || navigator.userAgent,
      app_version: report.app_version || import.meta.env.VITE_APP_VERSION || 'unknown',
      platform: report.platform || detectPlatform(),
      extra_data: report.extra_data || null,
    } as any);
  } catch {
    // Silent fail — crash reporter must never crash the app
  }
}

export function initCrashReporter() {
  // Global JS errors
  window.addEventListener('error', (event) => {
    if (!event.error && !event.message) return;
    sendCrashReport({
      error_message: event.message || event.error?.message || 'Unknown error',
      error_stack: event.error?.stack,
      extra_data: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        type: 'uncaught_error',
      },
    });
  });

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const message = reason instanceof Error ? reason.message : String(reason || 'Unhandled promise rejection');
    sendCrashReport({
      error_message: message,
      error_stack: reason instanceof Error ? reason.stack : undefined,
      extra_data: { type: 'unhandled_rejection' },
    });
  });
}

// For ErrorBoundary usage
export function reportComponentCrash(error: Error, componentStack?: string) {
  sendCrashReport({
    error_message: error.message,
    error_stack: error.stack,
    component_stack: componentStack,
    extra_data: { type: 'react_error_boundary' },
  });
}
