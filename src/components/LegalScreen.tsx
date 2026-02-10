import { useState } from 'react';
import { ArrowLeft, FileText, Shield, Scale, AlertTriangle, CreditCard, Database, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLegalDocuments, LegalDocument } from '@/hooks/useLegalDocuments';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import MarkdownContent from '@/components/MarkdownContent';

interface LegalScreenProps {
  onBack: () => void;
  initialDocument?: string;
}

const documentIcons: Record<string, any> = {
  terms_of_service: FileText,
  privacy_policy: Shield,
  gdpr_ccpa: Scale,
  disclaimer: AlertTriangle,
  refund_policy: CreditCard,
  data_usage: Database,
};

const documentOrder = [
  'terms_of_service',
  'privacy_policy',
  'gdpr_ccpa',
  'disclaimer',
  'refund_policy',
  'data_usage',
];

const LegalScreen = ({ onBack, initialDocument }: LegalScreenProps) => {
  useScrollToTop();
  
  const { data: documents = [], isLoading } = useLegalDocuments();
  const [selectedDoc, setSelectedDoc] = useState<LegalDocument | null>(null);

  // If initial document is provided, find and show it
  useState(() => {
    if (initialDocument && documents.length > 0) {
      const doc = documents.find(d => d.document_type === initialDocument);
      if (doc) setSelectedDoc(doc);
    }
  });

  const sortedDocuments = [...documents].sort((a, b) => {
    const indexA = documentOrder.indexOf(a.document_type);
    const indexB = documentOrder.indexOf(b.document_type);
    return indexA - indexB;
  });

  if (selectedDoc) {
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="flex items-center gap-3 p-4 border-b bg-card" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}>
          <Button variant="ghost" size="icon" onClick={() => setSelectedDoc(null)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">{selectedDoc.title_az || selectedDoc.title}</h1>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="max-w-3xl mx-auto">
            <div className="mb-4 text-sm text-muted-foreground">
              Versiya: {selectedDoc.version} | Son yenilənmə: {new Date(selectedDoc.updated_at).toLocaleDateString('az-AZ')}
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <MarkdownContent content={selectedDoc.content_az || selectedDoc.content} />
            </div>
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center gap-3 p-4 border-b bg-card" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}>
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Hüquqi Sənədlər</h1>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            sortedDocuments.map((doc) => {
              const Icon = documentIcons[doc.document_type] || FileText;
              return (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className="w-full flex items-center gap-4 p-4 bg-card rounded-xl border hover:bg-accent/50 transition-colors text-left"
                >
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{doc.title_az || doc.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      Versiya {doc.version}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default LegalScreen;
