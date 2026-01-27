import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, MapPin, Thermometer, Droplets, Wind, Sun, CloudRain, 
  AlertTriangle, Shirt, Loader2, RefreshCw, Shield, Flower2, CloudSun, MapPinOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentPosition, requestLocationPermission } from '@/lib/permissions';

interface WeatherClothingProps {
  onBack: () => void;
}

interface WeatherAdvice {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  uvIndex: number;
  weatherDescription: string;
  clothingAdvice: string;
  clothingItems: string[];
  warnings: string[];
  pollenWarning: string | null;
  uvWarning: string | null;
  outdoorAdvice: string;
  safeToGoOut: boolean;
  alertLevel: 'safe' | 'caution' | 'warning' | 'danger';
}

const WeatherClothing = ({ onBack }: WeatherClothingProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [cityName, setCityName] = useState<string>('');
  const [advice, setAdvice] = useState<WeatherAdvice | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchWeather();
  }, []);

  const fetchWeather = async () => {
    setIsLoading(true);
    setLocationError(null);

    try {
      // Request location permission first
      const permission = await requestLocationPermission();
      
      if (!permission.granted) {
        setLocationError('Məkan icazəsi lazımdır. Parametrlərdən icazə verin.');
        return;
      }

      // Get user location using our permission-aware helper
      const position = await getCurrentPosition();
      const { latitude, longitude } = position.coords;

      const { data, error } = await supabase.functions.invoke('weather-clothing', {
        body: { lat: latitude, lng: longitude }
      });

      if (error) throw error;

      if (data.success) {
        setCityName(data.cityName);
        setAdvice(data.advice);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Weather fetch error:', error);
      
      if (error.message?.includes('permission') || error.message?.includes('denied')) {
        setLocationError('Məkan icazəsi rədd edildi. Parametrlərdən icazə verin.');
      } else if (error.code === 1) {
        setLocationError('Məkan icazəsi rədd edildi. Parametrlərdən icazə verin.');
      } else if (error.code === 2) {
        setLocationError('Məkan təyin edilə bilmədi. Yenidən cəhd edin.');
      } else if (error.code === 3) {
        setLocationError('Məkan sorğusu vaxt aşımına uğradı.');
      } else {
        setLocationError('Hava məlumatı alınarkən xəta baş verdi.');
      }
      toast({
        title: 'Xəta',
        description: locationError || 'Yenidən cəhd edin',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getAlertColor = (level: string) => {
    switch (level) {
      case 'danger': return 'bg-red-500';
      case 'warning': return 'bg-orange-500';
      case 'caution': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  const getAlertBg = (level: string) => {
    switch (level) {
      case 'danger': return 'bg-red-500/10 border-red-500/30';
      case 'warning': return 'bg-orange-500/10 border-orange-500/30';
      case 'caution': return 'bg-yellow-500/10 border-yellow-500/30';
      default: return 'bg-green-500/10 border-green-500/30';
    }
  };

  const getWeatherIcon = (temp: number) => {
    if (temp < 5) return '❄️';
    if (temp < 15) return '🌤️';
    if (temp < 25) return '☀️';
    return '🔥';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Hava & Geyim</h1>
            <p className="text-xs text-muted-foreground">Körpəniz üçün geyim məsləhəti</p>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchWeather} disabled={isLoading}>
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Məkan təyin edilir...</p>
          </div>
        )}

        {/* Error State */}
        {locationError && !isLoading && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-destructive shrink-0" />
                <div>
                  <h3 className="font-semibold text-destructive">Məkan xətası</h3>
                  <p className="text-sm text-muted-foreground mt-1">{locationError}</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={fetchWeather}>
                    Yenidən cəhd et
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Weather Data */}
        <AnimatePresence>
          {advice && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Location & Current Weather */}
              <Card className="overflow-hidden">
                <div className={`h-1 ${getAlertColor(advice.alertLevel)}`} />
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="font-medium">{cityName}</span>
                    <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-medium ${
                      advice.safeToGoOut ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'
                    }`}>
                      {advice.safeToGoOut ? 'Çıxmaq olar' : 'Diqqətli olun'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-5xl">{getWeatherIcon(advice.temperature)}</div>
                    <div>
                      <div className="text-4xl font-bold">{Math.round(advice.temperature)}°C</div>
                      <p className="text-sm text-muted-foreground">
                        Hiss: {Math.round(advice.feelsLike)}°C
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-sm mt-2">{advice.weatherDescription}</p>
                  
                  {/* Weather Stats */}
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <div className="bg-muted/50 rounded-lg p-2 text-center">
                      <Droplets className="w-4 h-4 mx-auto text-blue-500" />
                      <p className="text-xs text-muted-foreground mt-1">Rütubət</p>
                      <p className="font-semibold text-sm">{advice.humidity}%</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2 text-center">
                      <Wind className="w-4 h-4 mx-auto text-cyan-500" />
                      <p className="text-xs text-muted-foreground mt-1">Külək</p>
                      <p className="font-semibold text-sm">{Math.round(advice.windSpeed)} km/h</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2 text-center">
                      <Sun className="w-4 h-4 mx-auto text-orange-500" />
                      <p className="text-xs text-muted-foreground mt-1">UV</p>
                      <p className="font-semibold text-sm">{advice.uvIndex}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Clothing Advice */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold flex items-center gap-2 mb-3">
                    <Shirt className="w-5 h-5 text-primary" />
                    Geyim Tövsiyəsi
                  </h3>
                  <p className="text-sm mb-3">{advice.clothingAdvice}</p>
                  
                  <div className="flex flex-wrap gap-2">
                    {advice.clothingItems.map((item, idx) => (
                      <span 
                        key={idx}
                        className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Outdoor Advice */}
              <Card className={advice.safeToGoOut ? '' : 'border-orange-500/30'}>
                <CardContent className="p-4">
                  <h3 className="font-semibold flex items-center gap-2 mb-2">
                    <CloudSun className="w-5 h-5 text-primary" />
                    Bayırda gəzmə
                  </h3>
                  <p className="text-sm">{advice.outdoorAdvice}</p>
                </CardContent>
              </Card>

              {/* Warnings */}
              {advice.warnings.length > 0 && (
                <Card className="border-orange-500/30 bg-orange-500/5">
                  <CardContent className="p-4">
                    <h3 className="font-semibold flex items-center gap-2 text-orange-600 mb-2">
                      <AlertTriangle className="w-5 h-5" />
                      Xəbərdarlıqlar
                    </h3>
                    <ul className="space-y-2">
                      {advice.warnings.map((warning, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 shrink-0" />
                          {warning}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Pollen Warning */}
              {advice.pollenWarning && (
                <Card className="border-yellow-500/30 bg-yellow-500/5">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Flower2 className="w-5 h-5 text-yellow-600 shrink-0" />
                      <div>
                        <h3 className="font-semibold text-yellow-700">Polen Xəbərdarlığı</h3>
                        <p className="text-sm text-muted-foreground mt-1">{advice.pollenWarning}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* UV Warning */}
              {advice.uvWarning && (
                <Card className="border-orange-500/30 bg-orange-500/5">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-orange-600 shrink-0" />
                      <div>
                        <h3 className="font-semibold text-orange-700">UV Xəbərdarlığı</h3>
                        <p className="text-sm text-muted-foreground mt-1">{advice.uvWarning}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default WeatherClothing;
