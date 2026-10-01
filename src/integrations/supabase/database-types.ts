import type { Database as GeneratedDatabase, Json } from './types';

/** The generated file describes Source. These reviewed extra RPC signatures are
 * used only by the same application's Azure-admitted pairing path. */
export type Database = Omit<GeneratedDatabase, 'public'> & {
  public: Omit<GeneratedDatabase['public'], 'Functions'> & {
    Functions: GeneratedDatabase['public']['Functions'] & {
      ensure_secure_partner_code: { Args: never; Returns: string };
      link_partner_by_code: { Args: { p_partner_code: string }; Returns: Json };
    };
  };
};
