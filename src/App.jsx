import React, { useState, useEffect, useRef } from 'react';

export default function SpinningWheel() {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [hasWon, setHasWon] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [claimCode, setClaimCode] = useState('');
  const [spinCount, setSpinCount] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [showKeepOrSpin, setShowKeepOrSpin] = useState(false);
  const [pendingPrize, setPendingPrize] = useState(null);
  const [usedExtraSpin, setUsedExtraSpin] = useState(false);
  const [isGrandPrizeCelebration, setIsGrandPrizeCelebration] = useState(false);
  const [pointerFlick, setPointerFlick] = useState(false);
  
  const audioContext = useRef(null);

  const BRAND_BLUE = '#2563EB';
  
  // Logo as inline SVG data URL
  const logoSrc = "https://i.imgur.com/eSuSXgq.png";

  const prizes = [
    { label: '2 Free Videos', shortLabel: '2 Videos', color: '#0d9488', emoji: '🎬', tier: 'win', description: '2 free LinkedIn videos', codePrefix: 'VIDEO' },
    { label: '1 Month Content', shortLabel: '1 Month Content', color: '#7c3aed', emoji: '🎁', tier: 'jackpot', description: '1 Month of Free Content (Grand Prize)', codePrefix: 'MONTH' },
    { label: 'Spin Again', shortLabel: 'Spin Again', color: '#64748b', emoji: '🎲', tier: 'retry', description: null, codePrefix: null },
    { label: 'New Profile Banner', shortLabel: 'New Profile Banner', color: '#f97316', emoji: '🎨', tier: 'win', description: 'A new LinkedIn profile banner', codePrefix: 'BANNER' },
    { label: '2 Free Written Posts', shortLabel: '2 Written Posts', color: '#3b82f6', emoji: '✍️', tier: 'win', description: '2 free written LinkedIn posts', codePrefix: 'POST' },
    { label: "You Didn't Win", shortLabel: "Didn't Win", color: '#ef4444', emoji: '😢', tier: 'lose', description: null, codePrefix: null },
  ];

  const segmentAngle = 360 / prizes.length;

  const generateCode = (prefix) => {
    const chars = '23456789';
    let code = prefix + '-';
    for (let i = 0; i < 4; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem('videoHeroWheel');
      if (stored) {
        const data = JSON.parse(stored);
        if (data.won) {
          setHasWon(true);
          setShowResult(true);
          setResult(prizes.find(p => p.label === data.prize));
          setClaimCode(data.code);
        }
        setSpinCount(data.spinCount || 0);
      }
    } catch (e) {
      // localStorage not available (private browsing) - continue without persistence
    }
  }, []);

  // Exact cubic-bezier(0.12, 0.8, 0.2, 1) implementation
  const cubicBezier = (t) => {
    // For cubic-bezier(0.12, 0.8, 0.2, 1), we need to solve for y given x=t
    // Using iterative approximation since cubic bezier is parametric
    const p1x = 0.12, p1y = 0.8, p2x = 0.2, p2y = 1;
    
    // Newton-Raphson to find parameter u where x(u) = t
    let u = t;
    for (let i = 0; i < 8; i++) {
      const x = 3 * (1 - u) * (1 - u) * u * p1x + 3 * (1 - u) * u * u * p2x + u * u * u - t;
      const dx = 3 * (1 - u) * (1 - u) * p1x + 6 * (1 - u) * u * (p2x - p1x) + 3 * u * u * (1 - p2x);
      if (Math.abs(x) < 0.0001) break;
      u -= x / dx;
    }
    u = Math.max(0, Math.min(1, u));
    
    // Calculate y at parameter u
    return 3 * (1 - u) * (1 - u) * u * p1y + 3 * (1 - u) * u * u * p2y + u * u * u;
  };
  
  // Play tick and flick arrow when crossing peg boundaries
  const playSpinTicks = (startRotation, endRotation, durationMs) => {
    if (!audioContext.current) return;
    
    const startTime = performance.now();
    const totalDegrees = endRotation - startRotation;
    let lastPegIndex = Math.floor(startRotation / 60); // 6 pegs = 60° apart
    
    const tick = () => {
      if (!audioContext.current) return;
      const osc = audioContext.current.createOscillator();
      const gain = audioContext.current.createGain();
      osc.connect(gain);
      gain.connect(audioContext.current.destination);
      osc.frequency.value = 650;
      gain.gain.value = 0.15;
      osc.start();
      osc.stop(audioContext.current.currentTime + 0.03);
    };
    
    const flick = () => {
      setPointerFlick(true);
      setTimeout(() => setPointerFlick(false), 60);
    };
    
    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      
      // Apply easing to get current rotation
      const easedProgress = cubicBezier(progress);
      const currentRotation = startRotation + (totalDegrees * easedProgress);
      const currentPegIndex = Math.floor(currentRotation / 60);
      
      // Check if we crossed a peg boundary
      if (currentPegIndex > lastPegIndex) {
        tick();
        flick();
        lastPegIndex = currentPegIndex;
      }
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  };

  const initAudio = () => {
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
    }
  };

  const playSound = (type) => {
    if (!audioContext.current) return;
    const ctx = audioContext.current;
    
    if (type === 'win') {
      // Fun slot machine style win sound
      const playChime = (freq, delay, duration, volume) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + duration);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + duration);
      };
      
      // Quick ascending "ding ding ding DING!"
      playChime(784, 0, 0.15, 0.2);
      playChime(988, 0.1, 0.15, 0.22);
      playChime(1175, 0.2, 0.15, 0.24);
      playChime(1568, 0.3, 0.4, 0.3);
      
      // Triumphant chord
      setTimeout(() => {
        [1047, 1319, 1568].forEach((freq) => {
          playChime(freq, 0, 0.5, 0.15);
        });
      }, 500);
      
      // Sparkle flourish
      setTimeout(() => {
        [2093, 2349, 2637, 2793].forEach((freq, i) => {
          playChime(freq, i * 0.06, 0.2, 0.08);
        });
      }, 700);
    } else if (type === 'jackpot') {
      // Elegant triple chime for jackpot
      const chimes = [
        { notes: [523, 659, 784], delay: 0 },
        { notes: [587, 740, 880], delay: 0.3 },
        { notes: [659, 831, 1047], delay: 0.6 }
      ];
      chimes.forEach(({ notes, delay }) => {
        notes.forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.12, ctx.currentTime + delay);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.5);
          osc.start(ctx.currentTime + delay);
          osc.stop(ctx.currentTime + delay + 0.5);
        });
      });
    } else if (type === 'retry') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 400;
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else if (type === 'applause') {
      // Create celebratory chime sequence
      const notes = [523, 659, 784, 1047, 1319];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.4);
        osc.start(ctx.currentTime + i * 0.1);
        osc.stop(ctx.currentTime + i * 0.1 + 0.4);
      });
    } else if (type === 'grandPrize') {
      // Epic ascending fanfare for grand prize on second spin
      const notes = [392, 440, 523, 587, 659, 784, 880, 1047];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.18, ctx.currentTime + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.12 + 0.5);
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.5);
      });
      // Final chord
      setTimeout(() => {
        [523, 659, 784, 1047].forEach(freq => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);
          osc.start();
          osc.stop(ctx.currentTime + 1);
        });
      }, 900);
    }
  };

  const spin = () => {
    if (isSpinning || hasWon) return;
    
    initAudio();
    setIsSpinning(true);
    setResult(null);
    
    // Game flow:
    // Order: Videos(0), Jackpot(1), SpinAgain(2), Banner(3), WrittenPosts(4), DidntWin(5)
    // spinCount increments AFTER each spin completes
    // spinCount=0: 1st spin → 85% Banner (3), 15% Videos (0) → shows Keep/Risk modal
    // spinCount=1 && usedExtraSpin: 2nd spin → Spin Again (2)
    // spinCount=2 && usedExtraSpin: 3rd spin → 85% Written Posts (4) barely past Didn't Win, 15% Grand Prize (1)
    
    let targetPrizeIndex;
    let nearMiss = false;
    
    if (spinCount === 0) {
      // 1st spin: 85% Banner, 15% Videos
      targetPrizeIndex = Math.random() < 0.85 ? 3 : 0;
    } else if (spinCount === 1 && usedExtraSpin) {
      // 2nd spin (after risk): Spin Again
      targetPrizeIndex = 2;
    } else if (spinCount === 2 && usedExtraSpin) {
      // 3rd spin: 85% Written Posts (barely past Didn't Win), 15% Grand Prize
      if (Math.random() < 0.85) {
        targetPrizeIndex = 4;
        nearMiss = true; // Land at edge, barely past Didn't Win
      } else {
        targetPrizeIndex = 1;
      }
    } else {
      // Fallback
      targetPrizeIndex = 0;
    }
    
    const prize = prizes[targetPrizeIndex];
    
    // Calculate rotation to land pointer on target segment's center
    // Pointer is at top (-90° position)
    // Segment N spans from (N*60 - 90)° to ((N+1)*60 - 90)°
    // Segment N's center is at (N*60 - 90 + 30)° = (N*60 - 60)°
    // At rotation R, the point originally at angle A is now at angle A+R
    // We want segment N's center to be at -90° (top/pointer)
    // So: (N*60 - 60) + R = -90 (mod 360)
    // R = -90 - N*60 + 60 = -30 - N*60
    // For positive R: R = 330 - N*60 (mod 360)
    
    // Calculate spin duration and easing based on prize
    const isJackpotSpin = prize.tier === 'jackpot';
    const spinDuration = 11; // Match CSS transition duration
    
    const spins = isJackpotSpin ? 5 + Math.floor(Math.random() * 2) : 6 + Math.floor(Math.random() * 3);
    const targetAngle = (330 - targetPrizeIndex * segmentAngle + 360) % 360;
    
    // For jackpot, land near the edge of segment (barely makes it)
    // For near-miss (Didn't Win), land just barely past Written Posts
    // For others, land more centered
    let offset;
    if (isJackpotSpin) {
      offset = 22 + Math.random() * 5; // Land near the far edge
    } else if (nearMiss) {
      offset = -25 + Math.random() * 3; // Land at very start of segment, barely past the previous one
    } else {
      offset = (Math.random() - 0.5) * 30; // ±15° centered
    }
    
    // Add to current rotation for cumulative effect
    const currentNormalized = rotation % 360;
    let additionalRotation = targetAngle - currentNormalized;
    if (additionalRotation <= 0) additionalRotation += 360;
    
    const totalRotation = rotation + (spins * 360) + additionalRotation + offset;
    
    setRotation(totalRotation);
    
    // Simulate peg hits for sound and arrow flicks
    playSpinTicks(rotation, totalRotation, spinDuration * 1000);
    
    // Wheel stops after spinDuration
    setTimeout(() => {
      // Haptic feedback on mobile
      if (navigator.vibrate) navigator.vibrate(100);
      
      setResult(prize);
      setIsSpinning(false);
      const newSpinCount = spinCount + 1;
      setSpinCount(newSpinCount);
      
      // Delay before showing result screen
      setTimeout(() => {
        if (prize.tier === 'retry' || prize.tier === 'lose') {
          playSound('retry');
          try {
            localStorage.setItem('videoHeroWheel', JSON.stringify({ 
              spinCount: newSpinCount,
              won: false,
              usedExtraSpin: usedExtraSpin,
              timestamp: Date.now() 
            }));
          } catch (e) {}
          // Keep result visible, clear it when they spin again
        } else if (prize.tier === 'win' && !usedExtraSpin) {
          // Mid-tier prize - offer choice to keep or spin again
          playSound('win');
          setPendingPrize(prize);
          setShowKeepOrSpin(true);
        } else {
          // Jackpot or already used extra spin - finalize
          finalizePrize(prize, newSpinCount);
        }
      }, 2000);
    }, spinDuration * 1000);
  };

  const finalizePrize = (prize, count) => {
    const code = generateCode(prize.codePrefix);
    setClaimCode(code);
    setHasWon(true);
    
    try {
      localStorage.setItem('videoHeroWheel', JSON.stringify({ 
        prize: prize.label, 
        code: code,
        spinCount: count,
        won: true,
        timestamp: Date.now() 
      }));
    } catch (e) {}
    
    // Special celebration for grand prize on second spin (they risked it and won big!)
    const isGrandPrizeOnRisk = prize.tier === 'jackpot' && usedExtraSpin;
    const isJackpot = prize.tier === 'jackpot';
    
    if (isGrandPrizeOnRisk) {
      setIsGrandPrizeCelebration(true);
      playSound('grandPrize');
      setShowConfetti(true);
      // Extra long confetti for grand prize
      setTimeout(() => setShowConfetti(false), 8000);
      // Longer pause to let the moment sink in
      setTimeout(() => {
        setShowResult(true);
      }, 4000);
    } else if (isJackpot) {
      // Regular jackpot (shouldn't happen with current logic, but just in case)
      setIsGrandPrizeCelebration(true); // Use gold confetti
      playSound('jackpot');
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 6000);
      setTimeout(() => {
        playSound('applause');
        setShowResult(true);
      }, 3500);
    } else {
      setIsGrandPrizeCelebration(false);
      if (prize.tier === 'jackpot') {
        playSound('jackpot');
      } else {
        playSound('win');
      }
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5500);
      
      // Show result screen after brief delay
      setTimeout(() => {
        playSound('applause');
        setShowResult(true);
      }, 3000);
    }
  };

  const keepPrize = () => {
    setShowKeepOrSpin(false);
    finalizePrize(pendingPrize, spinCount);
  };

  const spinAgainChoice = () => {
    setShowKeepOrSpin(false);
    setPendingPrize(null);
    setResult(null);
    setUsedExtraSpin(true);
  };

  const Confetti = () => (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {[...Array(isGrandPrizeCelebration ? 150 : 70)].map((_, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${Math.random() * 100}%`,
            top: -20,
            width: isGrandPrizeCelebration ? 12 : 10,
            height: isGrandPrizeCelebration ? 12 : 10,
            backgroundColor: isGrandPrizeCelebration 
              ? ['#FFD700', '#FFC107', '#FFEB3B', '#7C3AED', '#8B5CF6', '#A78BFA'][Math.floor(Math.random() * 6)]
              : [BRAND_BLUE, '#6366F1', '#8B5CF6', '#10B981', '#3B82F6', '#60A5FA'][Math.floor(Math.random() * 6)],
            transform: `rotate(${Math.random() * 360}deg)`,
            animation: `confettiFall ${1.5 + Math.random() * 1}s linear forwards`,
            animationDelay: `${Math.random() * 0.3}s`,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
        />
      ))}
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); }
          100% { transform: translateY(105vh) rotate(720deg); }
        }
      `}</style>
    </div>
  );

  // Logo removed for now

  // Result screen with code
  if (showResult && hasWon && result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)' }}>
        {showConfetti && <Confetti />}
        
        <div className="max-w-sm w-full text-center">
          {/* Header */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <img src={logoSrc} alt="Video Hero" className="w-8 h-8" />
            <span className="text-white font-bold text-xl tracking-wide">VIDEO HERO</span>
          </div>
          
          <div className="text-7xl mb-4">{result.emoji}</div>
          {result.tier === 'jackpot' ? (
            <>
              <p className="text-amber-400 text-sm font-semibold uppercase tracking-wider mb-1">Grand Prize</p>
              <h1 className="text-3xl font-bold text-white mb-2">
                You won!
              </h1>
            </>
          ) : (
            <h1 className="text-3xl font-bold text-white mb-2">
              You won!
            </h1>
          )}
          <p className="text-xl text-slate-300 mb-6">
            {result.description}
          </p>
          
          {/* Code display */}
          <div className="my-8 p-5 bg-slate-800/80 rounded-2xl border border-slate-600">
            <p className="text-slate-400 text-sm mb-2">Your redeem code</p>
            <p className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-widest">{claimCode}</p>
          </div>
          
          <p className="text-slate-400 mb-6">
            Send this code to <span className="text-white font-semibold">Alex Ryzer</span> on LinkedIn to redeem
          </p>
          
          <a
            href="https://www.linkedin.com/in/alexryzer/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full py-4 rounded-xl text-white font-bold text-lg transition-all hover:opacity-90"
            style={{ backgroundColor: BRAND_BLUE }}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            Message Alex
          </a>
          
          <p className="text-gray-600 text-xs mt-6">
            Screenshot this page to save your code
          </p>
        </div>
        
        {/* Reset button */}
        <button
          onClick={() => {
            try { localStorage.removeItem('videoHeroWheel'); } catch(e) {}
            window.location.reload();
          }}
          className="fixed bottom-4 right-4 text-transparent text-xs hover:text-slate-600"
        >
          Reset
        </button>
      </div>
    );
  }

  // Main wheel screen
  return (
    <div className="min-h-screen flex flex-col items-center justify-evenly p-4 py-6 relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)' }}>
      {/* Ambient glow behind wheel */}
      <div 
        className="absolute rounded-full blur-3xl opacity-30 pointer-events-none"
        style={{
          width: 'min(600px, 100vw)',
          height: 'min(600px, 100vw)',
          background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />
      {showConfetti && <Confetti />}
      
      {/* Keep or Spin Again modal */}
      {showKeepOrSpin && pendingPrize && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-600 rounded-3xl p-8 max-w-sm mx-4 text-center shadow-2xl">
            <div className="text-5xl mb-4">{pendingPrize.emoji}</div>
            <h2 className="text-2xl font-bold text-white mb-2">You landed on</h2>
            <p className="text-xl text-slate-200 mb-6">{pendingPrize.label}</p>
            
            <div className="bg-blue-950 border border-blue-800 rounded-xl p-4 mb-6">
              <p className="text-blue-200 text-sm">Want to <span className="text-white font-bold">give up this prize</span> for one more spin?</p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={keepPrize}
                className="w-full py-3 rounded-xl text-white font-semibold transition-all hover:scale-105 shadow-lg shadow-blue-500/20"
                style={{ backgroundColor: BRAND_BLUE }}
              >
                Keep My Prize 🎉
              </button>
              <button
                onClick={spinAgainChoice}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold transition-all hover:scale-105 shadow-lg shadow-orange-500/20"
              >
                Risk It — Spin 1 More Time 🎰
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Ready modal */}
      {!isReady && !hasWon && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-600/50 rounded-2xl p-10 max-w-sm mx-4 text-center shadow-2xl">
            <div className="flex items-center justify-center gap-3 mb-8">
              <img src={logoSrc} alt="Video Hero" className="w-10 h-10" />
              <span className="text-white font-bold text-2xl tracking-wide">VIDEO HERO</span>
            </div>
            <p className="text-slate-300 text-base mb-2">Alex Ryzer invited you to</p>
            <h2 className="text-2xl font-medium text-white mb-8">Spin the Wheel</h2>
            <button
              onClick={() => setIsReady(true)}
              className="w-full py-4 rounded-xl text-white font-semibold text-lg transition-all hover:opacity-90"
              style={{ backgroundColor: BRAND_BLUE }}
            >
              Start
            </button>
          </div>
        </div>
      )}
      
      {/* Logo - ALWAYS visible: top-left on desktop, top-center on mobile */}
      <div className="fixed top-4 left-4 items-center gap-2 z-50 hidden sm:flex">
        <img src={logoSrc} alt="Video Hero" className="w-8 h-8" />
        <span className="text-white font-bold text-xl tracking-wide">VIDEO HERO</span>
      </div>
      <div className="fixed top-4 left-1/2 -translate-x-1/2 items-center gap-2 z-50 flex sm:hidden">
        <img src={logoSrc} alt="Video Hero" className="w-8 h-8" />
        <span className="text-white font-bold text-xl tracking-wide">VIDEO HERO</span>
      </div>
      
      {/* Header */}
      <div className="text-center relative z-10 mt-14 sm:mt-0">
        {usedExtraSpin ? (
          <h1 className="text-2xl sm:text-4xl font-bold text-amber-400 px-4">Go Big or Go Home</h1>
        ) : (
          <h1 className="text-2xl sm:text-4xl font-bold text-white px-4">Spin to Win Free LinkedIn Content</h1>
        )}
      </div>
      
      <div className="relative">
        {/* POINTER/TICKER - Fixed at top with flick animation */}
        <div 
          className="absolute -top-1 sm:-top-2 left-1/2 z-30"
          style={{
            transform: `translateX(-50%) rotate(${pointerFlick ? 15 : 0}deg)`,
            transformOrigin: 'center bottom',
            transition: pointerFlick ? 'transform 0.03s linear' : 'transform 0.08s ease-out',
          }}
        >
          <svg className="w-6 h-8 sm:w-[30px] sm:h-[40px]" viewBox="0 0 30 40">
            <path 
              d="M15 40 L3 8 Q0 0 8 0 L22 0 Q30 0 27 8 Z" 
              fill="#1e293b"
              stroke="#475569"
              strokeWidth="2"
            />
            <path 
              d="M15 32 L7 10 Q5 5 10 5 L20 5 Q25 5 23 10 Z" 
              fill="#f59e0b"
            />
          </svg>
        </div>
        
        {/* Wheel */}
        <div className="relative rounded-full p-1 shadow-2xl shadow-blue-500/20 w-[min(450px,88vw)] h-[min(450px,88vw)]" style={{ background: 'linear-gradient(135deg, #334155, #1e293b)' }}>
          <svg
            id="spin-wheel"
            className="w-full h-full rounded-full"
            viewBox="0 0 380 380"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: isSpinning ? 'transform 11s cubic-bezier(0.12, 0.8, 0.2, 1)' : 'none',
            }}
          >
            <circle cx="190" cy="190" r="188" fill="#111827" />
            
            {prizes.map((prize, index) => {
              const startAngle = index * segmentAngle - 90;
              const endAngle = startAngle + segmentAngle;
              const startRad = (startAngle * Math.PI) / 180;
              const endRad = (endAngle * Math.PI) / 180;
              
              const x1 = 190 + 183 * Math.cos(startRad);
              const y1 = 190 + 183 * Math.sin(startRad);
              const x2 = 190 + 183 * Math.cos(endRad);
              const y2 = 190 + 183 * Math.sin(endRad);
              
              const midAngle = startAngle + segmentAngle / 2;
              const midRad = (midAngle * Math.PI) / 180;
              const emojiX = 190 + 90 * Math.cos(midRad);
              const emojiY = 190 + 90 * Math.sin(midRad);
              const textX = 190 + 140 * Math.cos(midRad);
              const textY = 190 + 140 * Math.sin(midRad);
              
              return (
                <g key={index}>
                  <path
                    d={`M 190 190 L ${x1} ${y1} A 183 183 0 0 1 ${x2} ${y2} Z`}
                    fill={prize.color}
                    stroke="#111827"
                    strokeWidth="2"
                  />
                  <text 
                    x={emojiX} 
                    y={emojiY} 
                    fontSize="32" 
                    textAnchor="middle" 
                    dominantBaseline="middle"
                    transform={`rotate(${midAngle + 90}, ${emojiX}, ${emojiY})`}
                  >
                    {prize.emoji}
                  </text>
                  <text
                    x={textX}
                    y={textY}
                    fill="white"
                    fontSize="14"
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${midAngle + 90}, ${textX}, ${textY})`}
                  >
                    {prize.shortLabel}
                  </text>
                </g>
              );
            })}
            
            {/* Center circle */}
            <circle cx="190" cy="190" r="35" fill="#1F2937" stroke="#374151" strokeWidth="3" />
            <circle cx="190" cy="190" r="24" fill={BRAND_BLUE} />
            
            {/* Pegs on segment dividers */}
            {[...Array(6)].map((_, i) => {
              const angle = (i * 60 - 90) * Math.PI / 180;
              const x = 190 + 178 * Math.cos(angle);
              const y = 190 + 178 * Math.sin(angle);
              return (
                <circle key={`peg-${i}`} cx={x} cy={y} r="8" fill="#334155" stroke="#1e293b" strokeWidth="2" />
              );
            })}
          </svg>
        </div>
      </div>
      
      {/* Bottom section - results and button */}
      <div className="text-center relative z-10">
        {/* Spin Again message */}
        {result && result.tier === 'retry' && !isSpinning && (
          <div className="mb-2">
            <p className="text-xl text-white font-semibold">🔄 Spin Again!</p>
            <p className="text-gray-400 text-sm">You get another try</p>
          </div>
        )}
        
        {/* Didn't Win message */}
        {result && result.tier === 'lose' && !isSpinning && (
          <div className="mb-2">
            <p className="text-xl text-white font-semibold">😢 So close!</p>
            <p className="text-gray-400 text-sm">One more chance...</p>
          </div>
        )}
        
        {/* Win message before transition */}
        {result && result.tier !== 'retry' && result.tier !== 'lose' && hasWon && !showResult && (
          <div className="mb-2">
            <p className="text-2xl text-white font-bold">{result.emoji} You won!</p>
          </div>
        )}
        
        {/* Spin Button - hidden after winning */}
        {!hasWon && (
          <button
            onClick={spin}
            disabled={isSpinning || (result && result.tier !== 'retry' && result.tier !== 'lose')}
            className={`px-10 sm:px-16 py-3 sm:py-4 rounded-xl text-base sm:text-lg font-semibold text-white transition-all ${
              isSpinning || (result && result.tier !== 'retry' && result.tier !== 'lose')
                ? 'bg-slate-700 cursor-not-allowed opacity-50'
                : 'hover:opacity-90'
            }`}
            style={{ 
              backgroundColor: (isSpinning || (result && result.tier !== 'retry' && result.tier !== 'lose')) 
                ? undefined 
                : usedExtraSpin ? '#ea580c' : BRAND_BLUE,
            }}
          >
            {isSpinning ? 'Spinning...' : (result && result.tier === 'retry') ? 'Spin Again!' : usedExtraSpin ? 'Final Spin!' : 'Spin to Win'}
          </button>
        )}
      </div>
      

      
      {/* Reset button */}
      <button
        onClick={() => {
          try { localStorage.removeItem('videoHeroWheel'); } catch(e) {}
          window.location.reload();
        }}
        className="fixed bottom-4 right-4 text-transparent text-xs hover:text-slate-600"
      >
        Reset
      </button>
    </div>
  );
}
