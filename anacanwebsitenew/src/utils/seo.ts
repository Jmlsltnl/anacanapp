import { SITE } from '@/config/site';
import { LANGUAGES, getLanguage, DEFAULT_LANG } from '@/config/languages';
import { pagePath, type PageKey } from '@/config/pages';
import { useTranslations } from '@/i18n';

const abs = (site: URL | string, path: string) => new URL(path, site).href;

/** Organization node — identical on every page (stable @id). */
export function organizationLd(site: URL) {
  return {
    '@type': 'Organization',
    '@id': abs(site, '/#organization'),
    name: SITE.name,
    legalName: SITE.legalName,
    url: abs(site, '/'),
    logo: {
      '@type': 'ImageObject',
      '@id': abs(site, '/#logo'),
      url: abs(site, '/icon-512.png'),
      width: 512,
      height: 512,
      caption: SITE.name,
    },
    email: SITE.email,
    foundingDate: String(SITE.foundingYear),
    address: {
      '@type': 'PostalAddress',
      addressLocality: SITE.city,
      addressCountry: SITE.country,
    },
    contactPoint: {
      '@type': 'ContactPoint',
      email: SITE.email,
      contactType: 'customer support',
      availableLanguage: LANGUAGES.map((l) => l.englishName),
    },
    sameAs: [
      SITE.app.appStoreUrl,
      SITE.app.playStoreUrl,
      ...Object.values(SITE.socials).filter(Boolean),
    ],
  };
}

/** WebSite node with per-language name. */
export function websiteLd(site: URL, lang: string) {
  const t = useTranslations(lang);
  return {
    '@type': 'WebSite',
    '@id': abs(site, '/#website'),
    url: abs(site, '/'),
    name: SITE.name,
    description: t('meta.home.description'),
    publisher: { '@id': abs(site, '/#organization') },
    inLanguage: LANGUAGES.map((l) => l.bcp47),
  };
}

/** MobileApplication node describing the Anacan app itself. */
export function appLd(site: URL, lang: string) {
  const t = useTranslations(lang);
  return {
    '@type': ['MobileApplication', 'SoftwareApplication'],
    '@id': abs(site, '/#app'),
    name: SITE.name,
    description: t('meta.home.description'),
    operatingSystem: SITE.app.operatingSystems.join(', '),
    applicationCategory: SITE.app.category,
    installUrl: [SITE.app.appStoreUrl, SITE.app.playStoreUrl],
    downloadUrl: [SITE.app.appStoreUrl, SITE.app.playStoreUrl],
    author: { '@id': abs(site, '/#organization') },
    inLanguage: LANGUAGES.map((l) => l.bcp47),
    offers: [
      {
        '@type': 'Offer',
        price: '0',
        priceCurrency: SITE.app.pricing.monthly.currency,
        category: 'free',
        description: 'Free tier',
      },
      {
        '@type': 'Offer',
        price: SITE.app.pricing.monthly.amount,
        priceCurrency: SITE.app.pricing.monthly.currency,
        category: 'subscription',
        description: 'Premium monthly',
      },
      {
        '@type': 'Offer',
        price: SITE.app.pricing.yearly.amount,
        priceCurrency: SITE.app.pricing.yearly.currency,
        category: 'subscription',
        description: 'Premium yearly',
      },
    ],
  };
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export function breadcrumbLd(site: URL, items: BreadcrumbItem[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: abs(site, item.path),
    })),
  };
}

export interface ArticleLdInput {
  title: string;
  description: string;
  path: string;
  lang: string;
  pubDate: Date;
  updatedDate?: Date;
  image: string;
  section: string;
  tags: string[];
  authorName: string;
  wordCount?: number;
}

export function articleLd(site: URL, a: ArticleLdInput) {
  return {
    '@type': 'BlogPosting',
    '@id': abs(site, `${a.path}#article`),
    mainEntityOfPage: { '@type': 'WebPage', '@id': abs(site, a.path) },
    headline: a.title,
    description: a.description,
    image: abs(site, a.image),
    datePublished: a.pubDate.toISOString(),
    dateModified: (a.updatedDate ?? a.pubDate).toISOString(),
    inLanguage: getLanguage(a.lang).bcp47,
    articleSection: a.section,
    keywords: a.tags.join(', '),
    wordCount: a.wordCount,
    author: {
      '@type': 'Organization',
      name: a.authorName,
      url: abs(site, '/'),
    },
    publisher: { '@id': abs(site, '/#organization') },
  };
}

/** hreflang alternate URL set for a static page. */
export function pageAlternates(site: URL, key: PageKey) {
  const alternates = LANGUAGES.map((l) => ({
    hreflang: l.bcp47,
    href: abs(site, pagePath(key, l.code)),
  }));
  alternates.push({ hreflang: 'x-default', href: abs(site, pagePath(key, DEFAULT_LANG)) });
  return alternates;
}
