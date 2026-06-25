import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';

/**
 * Returns the list of disabled tool IDs for the current language,
 * and a helper to check if a specific tool is disabled.
 * Admins bypass all restrictions — nothing is disabled for them.
 */
export function useDisabledTools() {
  const { disabledTools } = useLanguage();
  const { isAdmin } = useAuth();

  // Admins see everything
  if (isAdmin) {
    return {
      disabledTools: [] as string[],
      isToolDisabled: (_toolId: string) => false,
    };
  }

  return {
    disabledTools,
    isToolDisabled: (toolId: string) => disabledTools.includes(toolId),
  };
}
