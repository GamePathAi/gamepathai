import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, RefreshCw, AlertCircle, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useSecureGameDetection, Game } from '@/hooks/useSecureGameDetection';
import { MLDetectedGamesResponse } from '@/services/ml';
import { Game as HookGame } from '@/hooks/useGames';

const GameDetectionList = () => {
  const { t } = useTranslation();
  const { games, isLoading, error, detectGames } = useSecureGameDetection();
  const [searchTerm, setSearchTerm] = useState('');
  const [mlGames, setMlGames] = useState<MLDetectedGamesResponse["detectedGames"]>([]);
  const [isLoadingMl, setIsLoadingMl] = useState(false);
  
  // Filter games based on search term
  const filteredGames = games.filter(game => 
    game.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Get games from ML service
  useEffect(() => {
    const fetchMlGames = async () => {
      try {
        setIsLoadingMl(true);
        const { mlService } = await import('@/services/ml/mlService');
        const mlDetection = await mlService.detectGames();
        setMlGames(mlDetection.detectedGames);
      } catch (error) {
        console.error("Failed to fetch games from ML service:", error);
      } finally {
        setIsLoadingMl(false);
      }
    };
    
    fetchMlGames();
  }, []);
  
  // Combine local detection and ML detection
  const combinedGames = [...games];
  mlGames.forEach(mlGame => {
    if (!games.some(localGame => localGame.id === mlGame.id)) {
      combinedGames.push({
        id: mlGame.id,
        name: mlGame.name,
        path: mlGame.installPath || '',
        platform: 'ML Detection',
        lastPlayed: Date.now(),
        genre: "Detected",
        image: `https://placehold.co/600x400/1A2033/ffffff?text=${encodeURIComponent(mlGame.name)}`,
        isOptimized: false,
        optimizationType: "none",
        executable: mlGame.executable || ''
      });
    }
  });
  
  // Handle refresh button click
  const handleRefresh = async () => {
    try {
      await detectGames();
      setIsLoadingMl(true);
      const { mlService } = await import('@/services/ml/mlService');
      const mlDetection = await mlService.detectGames();
      setMlGames(mlDetection.detectedGames);
      setIsLoadingMl(false);
      
      toast.success(t("games.detection.success"), {
        description: t("games.detection.refreshed")
      });
    } catch (err) {
      toast.error(t("games.detection.error"), {
        description: t("games.detection.refreshFailed")
      });
    }
  };
  
  // Handle game optimization
  const handleOptimizeGame = async (gameId: string, gameName: string) => {
    try {
      const { mlService } = await import('@/services/ml/mlService');
      return toast.promise(
        mlService.optimizeGame(gameId),
        {
          loading: t('games.optimizing', {name: gameName}),
          success: t('games.optimized', {name: gameName}),
          error: t('games.optimizeFailed', {name: gameName})
        }
      );
    } catch (error) {
      console.error("Game optimization failed:", error);
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {t('games.detection.title')}
            <span className="text-sm text-gray-400 ml-2">({combinedGames.length})</span>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleRefresh} 
            disabled={isLoading || isLoadingMl}
          >
            <RefreshCw 
              className={`h-4 w-4 mr-1 ${(isLoading || isLoadingMl) ? 'animate-spin' : ''}`} 
            />
            {t('common.refresh')}
          </Button>
        </CardTitle>
        <CardDescription>{t('games.detection.description')}</CardDescription>
        
        <div className="mt-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder={t('common.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 my-2 border border-red-100 dark:border-red-900/50">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3 text-sm text-red-800 dark:text-red-300">
                {error}
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-2 mt-1">
          {isLoading || isLoadingMl ? (
            <div className="text-center py-8">
              <div className="animate-pulse text-sm text-gray-500">
                {t('games.detection.loading')}
              </div>
            </div>
          ) : combinedGames.length > 0 ? (
            filteredGames.map(game => (
              <div 
                key={game.id} 
                className="p-3 border rounded-md flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <div>
                  <div className="font-medium">{game.name}</div>
                  <div className="text-xs text-gray-500">{game.path || 'Unknown location'}</div>
                </div>
                <div>
                  <Button size="sm" variant="ghost" onClick={() => handleOptimizeGame(game.id, game.name)}>
                    {t('games.optimize')}
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">
                {searchTerm ? t('games.detection.noResults') : t('games.detection.noGames')}
              </p>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between text-xs text-gray-500">
        <div>
          {combinedGames.length > 0 && 
            t('games.detection.count', {count: combinedGames.length})}
        </div>
        <div>
          {t('games.detection.lastUpdated', {
            time: new Intl.DateTimeFormat(undefined, {
              hour: '2-digit', 
              minute: '2-digit'
            }).format(new Date())
          })}
        </div>
      </CardFooter>
    </Card>
  );
};

export default GameDetectionList;
