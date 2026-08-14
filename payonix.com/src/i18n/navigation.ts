import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Lightweight wrappers around Next.js' navigation APIs that are aware of the
// routing configuration above (locale-prefixed + localized pathnames).
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
