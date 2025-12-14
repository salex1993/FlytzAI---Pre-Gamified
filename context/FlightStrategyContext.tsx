
import React, { createContext, useContext, useState, PropsWithChildren } from 'react';
import { FlightProfile, TripPlan, Strategy, FlightDeal, AIAnalysis, SavedStrategy } from '../types';
import { generateStrategy } from '../services/strategyEngine';

interface FlightStrategyContextType {
  profile: FlightProfile | null;
  trip: TripPlan | null;
  strategy: Strategy | null;
  deals: FlightDeal[];
  aiAnalysis: AIAnalysis | null;
  updateProfile: (p: FlightProfile) => void;
  updateTrip: (t: TripPlan) => void;
  updateDeals: (d: FlightDeal[]) => void;
  updateAiAnalysis: (a: AIAnalysis) => void;
  runStrategy: (overrideProfile?: FlightProfile, overrideTrip?: TripPlan) => void;
  saveStrategy: (name: string) => void;
  loadStrategy: (saved: SavedStrategy) => void;
  reset: () => void;
}

const FlightStrategyContext = createContext<FlightStrategyContextType | undefined>(undefined);

export const FlightStrategyProvider = ({ children }: PropsWithChildren) => {
  const [profile, setProfile] = useState<FlightProfile | null>(null);
  const [trip, setTrip] = useState<TripPlan | null>(null);
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [deals, setDeals] = useState<FlightDeal[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);

  const runStrategy = (overrideProfile?: FlightProfile, overrideTrip?: TripPlan) => {
    // Use overrides if provided, otherwise use current state
    const activeProfile = overrideProfile || profile;
    const activeTrip = overrideTrip || trip;

    if (!activeProfile || !activeTrip) {
        console.warn("Cannot run strategy: Missing Profile or Trip data");
        return;
    }

    // Ensure state is updated if we used overrides (synchronizing context)
    if (overrideProfile) setProfile(overrideProfile);
    if (overrideTrip) setTrip(overrideTrip);

    const result = generateStrategy(activeProfile, activeTrip);
    setStrategy(result);
    
    // Reset deals and analysis when running new strategy
    setDeals([]);
    setAiAnalysis(null);
  };

  const saveStrategy = (name: string) => {
    if (!profile || !trip || !strategy) return;
    const newSaved: SavedStrategy = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString(),
      originSummary: profile.homeAirports[0],
      targetSummary: trip.destinationRegions[0],
      profile,
      trip,
      strategy,
      deals,
      aiAnalysis
    };
    
    // Save to local storage
    const existing = localStorage.getItem('flytz_strategies_v1');
    const strategies: SavedStrategy[] = existing ? JSON.parse(existing) : [];
    strategies.push(newSaved);
    localStorage.setItem('flytz_strategies_v1', JSON.stringify(strategies));
  };

  const loadStrategy = (saved: SavedStrategy) => {
    setProfile(saved.profile);
    setTrip(saved.trip);
    setStrategy(saved.strategy);
    setDeals(saved.deals || []);
    setAiAnalysis(saved.aiAnalysis || null);
  };

  const reset = () => {
    setProfile(null);
    setTrip(null);
    setStrategy(null);
    setDeals([]);
    setAiAnalysis(null);
  };

  return (
    <FlightStrategyContext.Provider 
      value={{ 
        profile, 
        trip, 
        strategy, 
        deals,
        aiAnalysis,
        updateProfile: setProfile, 
        updateTrip: setTrip, 
        updateDeals: setDeals,
        updateAiAnalysis: setAiAnalysis,
        runStrategy, 
        saveStrategy, 
        loadStrategy, 
        reset 
      }}
    >
      {children}
    </FlightStrategyContext.Provider>
  );
};

export const useFlightStrategy = () => {
  const context = useContext(FlightStrategyContext);
  if (!context) throw new Error('useFlightStrategy must be used within FlightStrategyProvider');
  return context;
};
