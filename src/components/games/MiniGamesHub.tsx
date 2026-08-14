import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ShoppingBasket, ChevronRight, Trophy, Gamepad2, Sparkles, Puzzle } from 'lucide-react';
import { tr } from '@/lib/tr';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useScreenAnalytics, trackEvent } from '@/hooks/useScreenAnalytics';
import { useLocalGameProgress } from '@/hooks/useLocalGameProgress';
import { useSubmitGameScore } from '@/hooks/useGameScores';
import SaglamSebetLevels from './saglam-sebet/SaglamSebetLevels';
import SaglamSebetGame from './saglam-sebet/SaglamSebetGame';
import { TOTAL_LEVELS as SAGLAM_SEBET_TOTAL_LEVELS } from './saglam-sebet/levelConfig';
import BirlesdirLevels from './birlesdir/BirlesdirLevels';
import BirlesdirGame from './birlesdir/BirlesdirGame';
import { TOTAL_LEVELS as BIRLESDIR_TOTAL_LEVELS } from './birlesdir/levelConfig';
import Leaderboard from './Leaderboard';

interface MiniGamesHubProps {
  onBack: () => void;
}

type View = 'hub' | 'levels' | 'game';
type Tab = 'games' | 'leaderboard';

const SAGLAM_SEBET_ID = 'saglam-sebet';
const BIRLESDIR_ID = 'birlesdir';

const GAMES = [
  {
    id: SAGLAM_SEBET_ID,
    titleKey: 'saglamsebet_title',
    title: 'Sağlam Səbət',
    descKey: 'saglamsebet_card_desc',
    desc: 'Sağlam qidaları tut, zərərlilərdən qaç',
    icon: ShoppingBasket,
    gradient: 'from-emerald-500 to-teal-600',
    totalLevels: SAGLAM_SEBET_TOTAL_LEVELS,
  },
  {
    id: BIRLESDIR_ID,
    titleKey: 'birlesdir_title',
    title: 'Birləşdir',
    descKey: 'birlesdir_card_desc',
    desc: '3 və ya daha çoxunu birləşdir, bonusları aç',
    icon: Puzzle,
    gradient: 'from-violet-500 to-fuchsia-500',
    totalLevels: BIRLESDIR_TOTAL_LEVELS,
  },
];

const MiniGamesHub = ({ onBack }: MiniGamesHubProps) => {
  useScreenAnalytics('MiniGamesHub', 'MiniGames');

  const [activeTab, setActiveTab] = useState<Tab>('games');
  const [view, setView] = useState<View>('hub');
  const [selectedGameId, setSelectedGameId] = useState<string>(SAGLAM_SEBET_ID);
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [leaderboardGameId, setLeaderboardGameId] = useState<string>(SAGLAM_SEBET_ID);

  // Hub ↔ səviyyələr ↔ oyun keçidlərində həmişə yuxarıdan başla
  useScrollToTop([view, activeTab]);

  // Hooks must be called unconditionally — one instance per game.
  const saglamSebetProgress = useLocalGameProgress(SAGLAM_SEBET_ID);
  const birlesdirProgress = useLocalGameProgress(BIRLESDIR_ID);
  const submitSaglamSebetScore = useSubmitGameScore(SAGLAM_SEBET_ID);
  const submitBirlesdirScore = useSubmitGameScore(BIRLESDIR_ID);

  const isSaglamSebet = selectedGameId === SAGLAM_SEBET_ID;
  const progress = isSaglamSebet ? saglamSebetProgress : birlesdirProgress;
  const submitScore = isSaglamSebet ? submitSaglamSebetScore : submitBirlesdirScore;
  const totalLevelsForSelected = isSaglamSebet ? SAGLAM_SEBET_TOTAL_LEVELS : BIRLESDIR_TOTAL_LEVELS;

  const openGame = (gameId: string) => {
    setSelectedGameId(gameId);
    setView('levels');
  };

  const handleSelectLevel = (level: number) => {
    setSelectedLevel(level);
    setView('game');
    trackEvent('minigame_level_started', { game_id: selectedGameId, level });
  };

  const handleLevelComplete = (result: { level: number; score: number; stars: 0 | 1 | 2 | 3; passed: boolean }) => {
    progress.recordLevelResult(result.level, result.score, result.stars, result.passed);
    submitScore.mutate({ score: result.score, level: result.level });
    trackEvent(result.passed ? 'minigame_level_won' : 'minigame_level_lost', {
      game_id: selectedGameId,
      level: result.level,
      score: result.score,
    });
  };

  if (view === 'game') {
    if (isSaglamSebet) {
      return (
        <SaglamSebetGame
          key={selectedLevel}
          level={selectedLevel}
          onExit={() => setView('levels')}
          onLevelComplete={handleLevelComplete}
          onNextLevel={() => setSelectedLevel((prev) => Math.min(prev + 1, SAGLAM_SEBET_TOTAL_LEVELS))}
        />
      );
    }
    return (
      <BirlesdirGame
        key={selectedLevel}
        level={selectedLevel}
        onExit={() => setView('levels')}
        onLevelComplete={handleLevelComplete}
        onNextLevel={() => setSelectedLevel((prev) => Math.min(prev + 1, BIRLESDIR_TOTAL_LEVELS))}
      />
    );
  }

  if (view === 'levels') {
    if (isSaglamSebet) {
      return (
        <SaglamSebetLevels
          progress={progress.progress}
          isLevelUnlocked={progress.isLevelUnlocked}
          onSelectLevel={handleSelectLevel}
          onBack={() => setView('hub')}
        />
      );
    }
    return (
      <BirlesdirLevels
        progress={progress.progress}
        isLevelUnlocked={progress.isLevelUnlocked}
        onSelectLevel={handleSelectLevel}
        onBack={() => setView('hub')}
      />
    );
  }

  return (
    <div className="a-scope min-h-screen pb-24" style={{ background: 'var(--a-bg)' }}>
      <div className="a-shell">
        {/* Header */}
        <header className="a-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <motion.button onClick={onBack} className="a-icon-btn" whileTap={{ scale: 0.9 }} aria-label="Back">
              <ArrowLeft className="rtl:rotate-180" size={16} strokeWidth={2} />
            </motion.button>
            <div style={{ minWidth: 0 }}>
              <p className="a-eyebrow">{tr('minigames_hub_subtitle', 'Stresi at, oyna, rahatla')}</p>
              <p className="a-wordmark" style={{ fontSize: 16 }}>{tr('minigames_hub_title', 'Mini Oyunlar')}</p>
            </div>
          </div>
          <div className="a-topbar-actions">
            <span className="a-icon-btn" style={{ cursor: 'default' }}>
              <Gamepad2 size={16} strokeWidth={2} />
            </span>
          </div>
        </header>

        {/* Tabs */}
        <div className="a-tabs w-full mb-4" style={{ display: 'flex' }}>
          <button
            onClick={() => setActiveTab('games')}
            className={`a-tab flex-1 ${activeTab === 'games' ? 'active' : ''}`}
          >
            {tr('minigames_tab_games', 'Oyunlar')}
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`a-tab flex-1 ${activeTab === 'leaderboard' ? 'active' : ''}`}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <Trophy className="w-3.5 h-3.5" /> {tr('minigames_tab_leaderboard', 'Reytinq')}
          </button>
        </div>
        <AnimatePresence mode="wait">
          {activeTab === 'games' ? (
            <motion.div key="games" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {GAMES.map((game) => {
                const gameProgress = game.id === SAGLAM_SEBET_ID ? saglamSebetProgress.progress : birlesdirProgress.progress;
                const Icon = game.icon;
                return (
                  <motion.button
                    key={game.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => openGame(game.id)}
                    className={`w-full relative overflow-hidden rounded-3xl bg-gradient-to-br ${game.gradient} p-4 text-start shadow-xl mb-4`}
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.18),transparent_60%)]" />
                    <div className="absolute -end-3 -bottom-3 opacity-15">
                      <Icon className="w-28 h-28 text-white" />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] text-white font-semibold flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" /> {tr('minigames_badge_new', 'Yeni')}
                            </span>
                          </div>
                          <h3 className="text-white font-bold text-base">{tr(game.titleKey, game.title)}</h3>
                          <p className="text-white/80 text-xs">{tr(game.descKey, game.desc)}</p>
                        </div>
                        <ChevronRight className="rtl:rotate-180 w-5 h-5 text-white/70 flex-shrink-0" />
                      </div>

                      <div className="flex items-center gap-3 text-white/90 text-[11px]">
                        <span className="px-2 py-1 rounded-full bg-white/15 font-medium">
                          {game.totalLevels} {tr('minigames_levels_short', 'səviyyə')}
                        </span>
                        <span className="px-2 py-1 rounded-full bg-white/15 font-medium">
                          {Math.min(gameProgress.unlockedLevel, game.totalLevels)}/{game.totalLevels}{' '}
                          {tr('minigames_unlocked_short', 'açıq')}
                        </span>
                        {gameProgress.bestScoreOverall > 0 && (
                          <span className="px-2 py-1 rounded-full bg-white/15 font-medium flex items-center gap-1">
                            <Trophy className="w-3 h-3" /> {gameProgress.bestScoreOverall}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.button>
                );
              })}

              {/* More games coming soon */}
              <div className="rounded-[26px] p-5 text-center" style={{ background: 'var(--a-surface)', border: '2px dashed var(--a-line-strong)' }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-2" style={{ background: 'var(--a-surface-soft)' }}>
                  <Gamepad2 className="w-6 h-6" style={{ color: 'var(--a-ink-faint)' }} />
                </div>
                <p className="a-list-title mb-0.5" style={{ margin: '0 0 2px' }}>
                  {tr('minigames_more_soon_title', 'Yeni oyunlar tezliklə')}
                </p>
                <p className="a-list-sub" style={{ margin: 0, whiteSpace: 'normal' }}>
                  {tr('minigames_more_soon_desc', 'Mini Oyunlar bölməsinə tezliklə yeni oyunlar əlavə olunacaq')}
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div key="leaderboard" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex items-center gap-2 mb-3">
                {GAMES.map((game) => (
                  <button
                    key={game.id}
                    onClick={() => setLeaderboardGameId(game.id)}
                    className={`flex-1 py-2 rounded-full text-xs font-bold transition-all ${
                      leaderboardGameId === game.id
                        ? `bg-gradient-to-r ${game.gradient} text-white shadow-button`
                        : ''
                    }`}
                    style={leaderboardGameId === game.id ?
                    { border: 'none', cursor: 'pointer' } :
                    { background: 'var(--a-surface)', color: 'var(--a-ink-soft)', border: '1px solid var(--a-line)', cursor: 'pointer' }}
                  >
                    {tr(game.titleKey, game.title)}
                  </button>
                ))}
              </div>
              <Leaderboard gameId={leaderboardGameId} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MiniGamesHub;
