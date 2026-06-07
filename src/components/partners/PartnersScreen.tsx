import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, MapPin, Sparkles, Crown, Lock, Phone, Globe, Instagram, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { usePartnerCategories, usePartnerVenues, PartnerVenue } from '@/hooks/usePartnerVenues';
import { useSubscription } from '@/hooks/useSubscription';
import { PremiumModal } from '@/components/PremiumModal';
import RedemptionQRSheet from './RedemptionQRSheet';
import { useScrollToTop } from '@/hooks/useScrollToTop';

interface Props { onBack: () => void; }

export default function PartnersScreen({ onBack }: Props) {
  useScrollToTop();
  const [category, setCategory] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [selectedVenue, setSelectedVenue] = useState<PartnerVenue | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [showPremium, setShowPremium] = useState(false);

  const { data: categories } = usePartnerCategories();
  const { data: venues, isLoading } = usePartnerVenues(category);
  const { isPremium } = useSubscription();

  const filtered = (venues || []).filter(v =>
    !query.trim() || v.name.toLowerCase().includes(query.toLowerCase()) ||
    (v.address || '').toLowerCase().includes(query.toLowerCase())
  );

  const handleRedeem = (v: PartnerVenue) => {
    if (!isPremium) { setShowPremium(true); return; }
    setSelectedVenue(v);
    setQrOpen(true);
  };

  if (selectedVenue && !qrOpen) {
    return (
      <VenueDetail
        venue={selectedVenue}
        isPremium={isPremium}
        onBack={() => setSelectedVenue(null)}
        onRedeem={() => handleRedeem(selectedVenue)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="flex items-center gap-3 p-3">
          <button onClick={onBack} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-bold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-primary" /> Partnyor Endirimləri
            </h1>
            <p className="text-[11px] text-muted-foreground">Spa, idman, gözəllik və daha çox</p>
          </div>
          {!isPremium && (
            <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
              <Crown className="w-3 h-3" /> Premium
            </span>
          )}
        </div>

        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Məkan axtar..." className="pl-9 h-9 text-sm" />
          </div>
        </div>

        <div className="flex gap-2 px-3 pb-3 overflow-x-auto scrollbar-hide">
          <CategoryPill active={category === 'all'} onClick={() => setCategory('all')} label="Hamısı" />
          {categories?.map((c) => (
            <CategoryPill key={c.key} active={category === c.key} onClick={() => setCategory(c.key)} label={c.label_az} />
          ))}
        </div>
      </div>

      <div className="p-3 space-y-3">
        {isLoading && (
          <div className="py-10 flex justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="py-16 text-center">
            <MapPin className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Bu kateqoriyada hələ partnyor yoxdur.</p>
          </div>
        )}

        {filtered.map((v, i) => (
          <motion.button
            key={v.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            onClick={() => setSelectedVenue(v)}
            className="w-full bg-card border border-border rounded-2xl overflow-hidden shadow-sm text-left"
          >
            {v.cover_url && (
              <div className="h-32 bg-muted overflow-hidden">
                <img src={v.cover_url} alt={v.name} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-3 flex items-start gap-3">
              {v.logo_url ? (
                <img src={v.logo_url} alt="" className="w-12 h-12 rounded-xl object-cover border border-border" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <h3 className="font-bold text-sm truncate">{v.name}</h3>
                  {v.is_featured && <span className="text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">★</span>}
                </div>
                {v.address && (
                  <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" /> {v.address}
                  </p>
                )}
                <div className="inline-flex items-center gap-1 mt-1.5 bg-primary/10 text-primary text-[11px] font-bold px-2 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3" /> {v.discount_label}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground mt-3" />
            </div>
          </motion.button>
        ))}
      </div>

      {selectedVenue && (
        <RedemptionQRSheet
          open={qrOpen}
          onClose={() => { setQrOpen(false); setSelectedVenue(null); }}
          venueId={selectedVenue.id}
          venueName={selectedVenue.name}
        />
      )}

      <PremiumModal isOpen={showPremium} onClose={() => setShowPremium(false)} />
    </div>
  );
}

function CategoryPill({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
        active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
      }`}
    >{label}</button>
  );
}

function VenueDetail({ venue, isPremium, onBack, onRedeem }: { venue: PartnerVenue; isPremium: boolean; onBack: () => void; onRedeem: () => void }) {
  useScrollToTop();
  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="relative">
        {venue.cover_url ? (
          <img src={venue.cover_url} alt={venue.name} className="w-full h-56 object-cover" />
        ) : (
          <div className="w-full h-56 bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
            <Sparkles className="w-16 h-16 text-primary/40" />
          </div>
        )}
        <button onClick={onBack} className="absolute top-3 left-3 w-9 h-9 rounded-full bg-background/80 backdrop-blur flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 -mt-8 relative">
        <div className="bg-card rounded-2xl shadow-lg border border-border p-4">
          <div className="flex items-start gap-3">
            {venue.logo_url && (
              <img src={venue.logo_url} alt="" className="w-14 h-14 rounded-xl object-cover border-2 border-background -mt-8" />
            )}
            <div className="flex-1">
              <h1 className="text-lg font-bold">{venue.name}</h1>
              {venue.address && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" /> {venue.address}
                </p>
              )}
            </div>
          </div>

          <div className="mt-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-3 border border-primary/20">
            <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Sənin endirimin</p>
            <p className="text-xl font-black text-primary mt-1">{venue.discount_label}</p>
            {venue.discount_terms && <p className="text-[11px] text-muted-foreground mt-1">{venue.discount_terms}</p>}
          </div>

          {venue.description && <p className="text-sm text-foreground/80 mt-3 leading-relaxed whitespace-pre-line">{venue.description}</p>}

          <div className="grid grid-cols-3 gap-2 mt-4">
            {venue.phone && (
              <a href={`tel:${venue.phone}`} className="flex flex-col items-center gap-1 p-2 bg-muted rounded-xl">
                <Phone className="w-4 h-4 text-primary" />
                <span className="text-[10px] text-muted-foreground">Zəng</span>
              </a>
            )}
            {venue.website && (
              <a href={venue.website} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1 p-2 bg-muted rounded-xl">
                <Globe className="w-4 h-4 text-primary" />
                <span className="text-[10px] text-muted-foreground">Veb sayt</span>
              </a>
            )}
            {venue.instagram && (
              <a href={`https://instagram.com/${venue.instagram.replace('@','')}`} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1 p-2 bg-muted rounded-xl">
                <Instagram className="w-4 h-4 text-primary" />
                <span className="text-[10px] text-muted-foreground">Instagram</span>
              </a>
            )}
            {venue.latitude && venue.longitude && (
              <a href={`https://maps.google.com/?q=${venue.latitude},${venue.longitude}`} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1 p-2 bg-muted rounded-xl">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-[10px] text-muted-foreground">Xəritə</span>
              </a>
            )}
          </div>

          {venue.gallery_urls && venue.gallery_urls.length > 0 && (
            <div className="mt-4 flex gap-2 overflow-x-auto scrollbar-hide">
              {venue.gallery_urls.map((g, i) => (
                <img key={i} src={g} alt="" className="w-28 h-28 rounded-xl object-cover flex-shrink-0" />
              ))}
            </div>
          )}
        </div>

        <div className="fixed left-0 right-0 bottom-0 p-4 bg-gradient-to-t from-background to-transparent">
          <Button onClick={onRedeem} className="w-full h-12 text-base font-bold" size="lg">
            {isPremium ? (
              <><Sparkles className="w-5 h-5 mr-2" /> Endirimi al — QR yarat</>
            ) : (
              <><Lock className="w-5 h-5 mr-2" /> Premium ilə endirim al</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
