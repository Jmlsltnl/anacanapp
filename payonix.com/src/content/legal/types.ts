export interface LegalSection {
  heading?: string;
  paragraphs?: string[];
  items?: string[];
}

export interface LegalDoc {
  title: string;
  /** ISO date shown as "last updated" on the page. */
  updated: string;
  intro?: string[];
  sections: LegalSection[];
}
