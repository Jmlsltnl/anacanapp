import React, { useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { ArrowLeft, Heart, X, Star, Sparkles, Check, Users } from 'lucide-react';
import { useNameVoting, MatchedName } from '@/hooks/useNameVoting';
import { useFavoriteNames } from '@/hooks/useFavoriteNames';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface NameVotingScreenProps {
  onBack: () => void;
}

const NameVotingScreen: React.FC<NameVotingScreenProps> = ({ onBack }) => {
  const { favorites } = useFavoriteNames();
  const { 
    myVotes, 
    vote, 
    getMatchedNames, 
    hasVoted, 
    getMyVote,
    likedNames,
    matchCount 
  } = useNameVoting();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right' | 'up' | null>(null);

  // Get names that haven't been voted on yet
  const unvotedNames = favorites.filter(f => !hasVoted(f.name));
  const currentName = unvotedNames[currentIndex];
  const matches = getMatchedNames();

  const handleVote = async (voteType: 'like' | 'dislike' | 'superlike') => {
    if (!currentName) return;

    setDirection(voteType === 'dislike' ? 'left' : voteType === 'superlike' ? 'up' : 'right');
    
    await vote(
      currentName.name,
      currentName.gender,
      voteType,
      currentName.meaning || undefined,
      currentName.origin || undefined
    );

    setTimeout(() => {
      setDirection(null);
      if (currentIndex < unvotedNames.length - 1) {
        setCurrentIndex(prev => prev + 1);
      }
    }, 300);
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 100;
    
    if (info.offset.x > threshold) {
      handleVote('like');
    } else if (info.offset.x < -threshold) {
      handleVote('dislike');
    } else if (info.offset.y < -threshold) {
      handleVote('superlike');
    }
  };

  const cardVariants = {
    initial: { scale: 0.95, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: (direction: 'left' | 'right' | 'up' | null) => ({
      x: direction === 'left' ? -300 : direction === 'right' ? 300 : 0,
      y: direction === 'up' ? -300 : 0,
      opacity: 0,
      rotate: direction === 'left' ? -20 : direction === 'right' ? 20 : 0,
    }),
  };

  const genderColors = {
    boy: 'from-blue-400 to-blue-600',
    girl: 'from-pink-400 to-pink-600',
    unisex: 'from-purple-400 to-purple-600',
  };

  const genderLabels = {
    boy: 'Oğlan',
    girl: 'Qız',
    unisex: 'Uniseks',
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="flex items-center justify-between p-4">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-muted">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold">Ad Səsverməsi</h1>
          <div className="flex items-center gap-2">
            {matchCount > 0 && (
              <Badge className="bg-gradient-to-r from-pink-500 to-red-500 text-white">
                <Sparkles className="w-3 h-3 mr-1" />
                {matchCount} match
              </Badge>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="vote" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mx-4 max-w-[calc(100%-2rem)]">
          <TabsTrigger value="vote">Səs ver</TabsTrigger>
          <TabsTrigger value="matches">
            Uyğunlar
            {matchCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-pink-500 text-white rounded-full">
                {matchCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="my-votes">Seçimlərim</TabsTrigger>
        </TabsList>

        <TabsContent value="vote" className="px-4 mt-4">
          {favorites.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Heart className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Sevimlilər yoxdur
              </h3>
              <p className="text-muted-foreground text-sm max-w-xs">
                Əvvəlcə "Körpə Adları" alətindən bəzi adları sevimlilərə əlavə edin
              </p>
            </div>
          ) : unvotedNames.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Check className="w-16 h-16 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Bütün adlara səs verdiniz!
              </h3>
              <p className="text-muted-foreground text-sm max-w-xs">
                "Uyğunlar" bölməsindən partnyorunuzla ortaq seçimlərinizi görün
              </p>
            </div>
          ) : (
            <div className="relative h-[400px] flex items-center justify-center">
              <AnimatePresence mode="wait" custom={direction}>
                {currentName && (
                  <motion.div
                    key={currentName.name}
                    custom={direction}
                    variants={cardVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    drag
                    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                    dragElastic={0.7}
                    onDragEnd={handleDragEnd}
                    className={`absolute w-full max-w-sm bg-gradient-to-br ${
                      genderColors[currentName.gender as keyof typeof genderColors]
                    } rounded-3xl shadow-2xl cursor-grab active:cursor-grabbing`}
                  >
                    <div className="p-8 text-white text-center">
                      <div className="text-6xl font-bold mb-4">{currentName.name}</div>
                      <Badge 
                        variant="secondary" 
                        className="bg-white/20 text-white border-0 mb-4"
                      >
                        {genderLabels[currentName.gender as keyof typeof genderLabels]}
                      </Badge>
                      {currentName.meaning && (
                        <p className="text-white/80 text-sm mb-2">
                          "{currentName.meaning}"
                        </p>
                      )}
                      {currentName.origin && (
                        <p className="text-white/60 text-xs">
                          Mənşə: {currentName.origin}
                        </p>
                      )}
                    </div>

                    {/* Swipe indicators */}
                    <div className="absolute inset-0 pointer-events-none">
                      <motion.div
                        className="absolute left-4 top-1/2 -translate-y-1/2 px-4 py-2 bg-red-500 rounded-lg text-white font-bold"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 0, scale: 0.8 }}
                      >
                        NOPE
                      </motion.div>
                      <motion.div
                        className="absolute right-4 top-1/2 -translate-y-1/2 px-4 py-2 bg-green-500 rounded-lg text-white font-bold"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 0, scale: 0.8 }}
                      >
                        LIKE
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Progress indicator */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-1">
                {unvotedNames.slice(0, 10).map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      idx === currentIndex ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                ))}
                {unvotedNames.length > 10 && (
                  <span className="text-xs text-muted-foreground ml-2">
                    +{unvotedNames.length - 10}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Vote buttons */}
          {currentName && (
            <div className="flex justify-center gap-4 mt-8">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleVote('dislike')}
                className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shadow-lg"
              >
                <X className="w-8 h-8 text-red-500" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleVote('superlike')}
                className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shadow-lg"
              >
                <Star className="w-7 h-7 text-blue-500" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleVote('like')}
                className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shadow-lg"
              >
                <Heart className="w-8 h-8 text-green-500" />
              </motion.button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="matches" className="px-4 mt-4">
          {matches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Users className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Hələlik uyğunluq yoxdur
              </h3>
              <p className="text-muted-foreground text-sm max-w-xs">
                Siz və partnyorunuz eyni adı bəyəndikdə burada görünəcək
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {matches.map((match) => (
                <MatchCard key={match.name} match={match} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-votes" className="px-4 mt-4">
          {likedNames.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Heart className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Hələ heç bir ada səs verməmisiniz
              </h3>
            </div>
          ) : (
            <div className="space-y-2">
              {likedNames.map((v) => (
                <div
                  key={v.name}
                  className="flex items-center justify-between p-4 bg-card rounded-xl border border-border"
                >
                  <div>
                    <div className="font-semibold">{v.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {genderLabels[v.gender as keyof typeof genderLabels]}
                    </div>
                  </div>
                  <Badge
                    variant={v.vote === 'superlike' ? 'default' : 'secondary'}
                    className={v.vote === 'superlike' ? 'bg-blue-500' : ''}
                  >
                    {v.vote === 'superlike' ? (
                      <Star className="w-3 h-3 mr-1" />
                    ) : (
                      <Heart className="w-3 h-3 mr-1" />
                    )}
                    {v.vote === 'superlike' ? 'Super' : 'Bəyəndim'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

const MatchCard: React.FC<{ match: MatchedName }> = ({ match }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-xl border ${
        match.isSuperMatch
          ? 'bg-gradient-to-r from-pink-500/10 to-purple-500/10 border-pink-500/30'
          : 'bg-card border-border'
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold">{match.name}</span>
            {match.isSuperMatch && (
              <Badge className="bg-gradient-to-r from-pink-500 to-purple-500 text-white border-0">
                <Sparkles className="w-3 h-3 mr-1" />
                Super Match!
              </Badge>
            )}
          </div>
          {match.meaning && (
            <p className="text-sm text-muted-foreground mt-1">"{match.meaning}"</p>
          )}
        </div>
        <div className="flex gap-1">
          {match.myVote === 'superlike' ? (
            <Star className="w-5 h-5 text-blue-500 fill-blue-500" />
          ) : (
            <Heart className="w-5 h-5 text-green-500 fill-green-500" />
          )}
          {match.partnerVote === 'superlike' ? (
            <Star className="w-5 h-5 text-blue-500 fill-blue-500" />
          ) : (
            <Heart className="w-5 h-5 text-green-500 fill-green-500" />
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default NameVotingScreen;
