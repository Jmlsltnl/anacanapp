import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, FileText, Download, Share2, Calendar,
  Heart, Droplets, Activity, Scale, ChevronRight,
  Printer, Mail
} from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { useToast } from '@/hooks/use-toast';
import { useHealthReport } from '@/hooks/useHealthReport';
import { useChildren } from '@/hooks/useChildren';

interface DoctorReportScreenProps {
  onBack: () => void;
}

const DoctorReportScreen = ({ onBack }: DoctorReportScreenProps) => {
  const { name, lifeStage, getCycleData, getPregnancyData } = useUserStore();
  const { selectedChild, getChildAge } = useChildren();
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState('1month');

  // Fetch real health data from backend
  const { trends: healthData, isLoading: healthLoading } = useHealthReport(selectedPeriod);

  const cycleData = getCycleData();
  const pregData = getPregnancyData();
  
  // Derive baby data from selectedChild for multi-child support
  const childAge = selectedChild ? getChildAge(selectedChild) : null;
  const babyData = selectedChild && childAge ? {
    id: selectedChild.id,
    name: selectedChild.name,
    birthDate: new Date(selectedChild.birth_date),
    gender: selectedChild.gender as 'boy' | 'girl',
    ageInDays: childAge.days,
    ageInMonths: childAge.months,
  } : null;

  const periods = [
    { id: '1week', label: '1 Həftə' },
    { id: '1month', label: '1 Ay' },
    { id: '3months', label: '3 Ay' },
    { id: 'all', label: 'Hamısı' },
  ];

  const handleDownload = () => {
    toast({
      title: 'Hesabat hazırlanır...',
      description: 'PDF faylı bir neçə saniyəyə hazır olacaq.',
    });
  };

  const handleShare = () => {
    toast({
      title: 'Paylaşım',
      description: 'Hesabat həkiminizə göndərildi.',
    });
  };

  const getStageSpecificData = () => {
    if (lifeStage === 'flow' && cycleData) {
      return [
        { label: 'Dövrə uzunluğu', value: `${cycleData.cycleLength} gün`, icon: Calendar },
        { label: 'Menstruasiya', value: `${cycleData.periodLength} gün`, icon: Droplets },
        { label: 'Cari faza', value: cycleData.phase, icon: Activity },
        { label: 'Dövrənin günü', value: `${cycleData.currentDay}`, icon: Heart },
      ];
    }
    if (lifeStage === 'bump' && pregData) {
      return [
        { label: 'Hamiləlik həftəsi', value: `${pregData.currentWeek} həftə`, icon: Calendar },
        { label: 'Trimester', value: `${pregData.trimester}-cü`, icon: Activity },
        { label: 'Körpə ölçüsü', value: pregData.babySize.fruit, icon: Heart },
        { label: 'Təxmini doğuş', value: pregData.dueDate?.toLocaleDateString('az-AZ'), icon: Calendar },
      ];
    }
    if (lifeStage === 'mommy' && babyData) {
      return [
        { label: 'Körpənin adı', value: babyData.name, icon: Heart },
        { label: 'Yaş', value: babyData.ageInMonths > 0 ? `${babyData.ageInMonths} ay` : `${babyData.ageInDays} gün`, icon: Calendar },
        { label: 'Doğum tarixi', value: babyData.birthDate.toLocaleDateString('az-AZ'), icon: Calendar },
        { label: 'Cinsiyyət', value: babyData.gender === 'boy' ? 'Oğlan' : 'Qız', icon: Activity },
      ];
    }
    return [];
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="gradient-primary px-5 pt-4 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <motion.button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Həkim Hesabatı</h1>
            <p className="text-white/80 text-sm">Sağlamlıq məlumatlarınız</p>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-3 space-y-4">
        {/* Report Preview Card */}
        <motion.div 
          className="bg-card rounded-3xl p-5 shadow-card border border-border/50"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <FileText className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-lg">{name || 'İstifadəçi'}</h2>
              <p className="text-sm text-muted-foreground">
                Hesabat tarixi: {new Date().toLocaleDateString('az-AZ')}
              </p>
            </div>
          </div>

          {/* Period Selector */}
          <div className="flex gap-2 mb-4 overflow-x-auto hide-scrollbar">
            {periods.map(period => (
              <button
                key={period.id}
                onClick={() => setSelectedPeriod(period.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedPeriod === period.id
                    ? 'bg-primary text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-3">
            <motion.button
              onClick={handleDownload}
              className="flex flex-col items-center gap-2 p-4 bg-muted rounded-2xl"
              whileTap={{ scale: 0.95 }}
            >
              <Download className="w-6 h-6 text-primary" />
              <span className="text-xs font-medium">Yüklə</span>
            </motion.button>
            <motion.button
              onClick={handleShare}
              className="flex flex-col items-center gap-2 p-4 bg-muted rounded-2xl"
              whileTap={{ scale: 0.95 }}
            >
              <Share2 className="w-6 h-6 text-primary" />
              <span className="text-xs font-medium">Paylaş</span>
            </motion.button>
            <motion.button
              className="flex flex-col items-center gap-2 p-4 bg-muted rounded-2xl"
              whileTap={{ scale: 0.95 }}
            >
              <Mail className="w-6 h-6 text-primary" />
              <span className="text-xs font-medium">Email</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Stage Specific Data */}
        <motion.div 
          className="bg-card rounded-3xl p-5 shadow-card border border-border/50"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="font-bold mb-4">Əsas Məlumatlar</h3>
          <div className="grid grid-cols-2 gap-3">
            {getStageSpecificData().map((item, index) => {
              const Icon = item.icon;
              return (
                <div 
                  key={index}
                  className="bg-muted/50 rounded-2xl p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-primary" />
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                  </div>
                  <p className="font-bold text-lg">{item.value}</p>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Health Trends - Real data from backend */}
        <motion.div 
          className="bg-card rounded-3xl p-5 shadow-card border border-border/50"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="font-bold mb-4">Sağlamlıq Trendləri</h3>
          {healthLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              {healthData.map((item, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-2xl"
                >
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.value}</p>
                  </div>
                  <span className={`text-sm font-bold ${
                    item.positive ? 'text-emerald-600' : 'text-amber-600'
                  }`}>
                    {item.trend}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Notes Section */}
        <motion.div 
          className="bg-card rounded-3xl p-5 shadow-card border border-border/50"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="font-bold mb-4">Həkim üçün Qeydlər</h3>
          <textarea
            placeholder="Həkiminiz üçün əlavə qeydlər yazın..."
            className="w-full h-24 p-4 rounded-2xl bg-muted/50 resize-none outline-none focus:ring-2 focus:ring-primary/20"
          />
        </motion.div>

        {/* Export Full Report */}
        <motion.button
          onClick={handleDownload}
          className="w-full gradient-primary text-white font-bold py-4 rounded-2xl shadow-elevated flex items-center justify-center gap-2"
          whileTap={{ scale: 0.98 }}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <FileText className="w-5 h-5" />
          Tam Hesabatı Yüklə (PDF)
        </motion.button>
      </div>
    </div>
  );
};

export default DoctorReportScreen;
