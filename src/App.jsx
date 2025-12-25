import { useState, useEffect, useRef } from 'react';

export default function SpinWheel() {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [hasWon, setHasWon] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [claimCode, setClaimCode] = useState('');
  const [spinCount, setSpinCount] = useState(0);
  const [showKeepOrSpin, setShowKeepOrSpin] = useState(false);
  const [pendingPrize, setPendingPrize] = useState(null);
  const [usedExtraSpin, setUsedExtraSpin] = useState(false);
  const [isGrandPrizeCelebration, setIsGrandPrizeCelebration] = useState(false);
  const [pointerFlick, setPointerFlick] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
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
          setIsReady(true);
        }
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }, []);

  useEffect(() => {
    // Initialize audio context on first user interaction
    const initAudio = () => {
      if (!audioContext.current) {
        audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
      }
    };
    window.addEventListener('click', initAudio, { once: true });
    return () => window.removeEventListener('click', initAudio);
  }, []);

  // Tick sound effect during spin
  useEffect(() => {
    if (!isSpinning) return;
    
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
    
    // Start with fast ticks, slow down
    let tickCount = 0;
    const maxTicks = 60;
    
    const scheduleTick = () => {
      if (tickCount >= maxTicks || !isSpinning) return;
      
      tick();
      flick();
      tickCount++;
      
      // Exponentially increasing delay (slowing down)
      const baseDelay = 80;
      const delay = baseDelay + Math.pow(tickCount / maxTicks, 2) * 400;
      
      setTimeout(scheduleTick, delay);
    };
    
    // Start ticking after a brief delay
    const startTimeout = setTimeout(scheduleTick, 200);
    
    return () => clearTimeout(startTimeout);
  }, [isSpinning]);

  const playSound = (type) => {
    if (!audioContext.current) return;
    const ctx = audioContext.current;
    
    if (type === 'win') {
      const playChime = (freq, delay, duration, vol) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(vol, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + duration);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + duration);
      };
      
      // Quick ascending "ding ding ding DING!"
      playChime(784, 0, 0.15, 0.35);
      playChime(988, 0.1, 0.15, 0.38);
      playChime(1175, 0.2, 0.15, 0.4);
      playChime(1568, 0.3, 0.4, 0.5);
      
      // Triumphant chord
      setTimeout(() => {
        [1047, 1319, 1568].forEach((freq) => {
          playChime(freq, 0, 0.5, 0.3);
        });
      }, 500);
      
      // Sparkle flourish
      setTimeout(() => {
        [2093, 2349, 2637, 2793].forEach((freq, i) => {
          playChime(freq, i * 0.06, 0.2, 0.15);
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
          gain.gain.setValueAtTime(0.25, ctx.currentTime + delay);
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
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
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
        gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.1);
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
        gain.gain.setValueAtTime(0.35, ctx.currentTime + i * 0.12);
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
          gain.gain.setValueAtTime(0.3, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);
          osc.start();
          osc.stop(ctx.currentTime + 1);
        });
      }, 1000);
    }
  };

  const spin = () => {
    if (isSpinning || hasWon) return;
    
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
    
    // Calculate the target rotation for landing on this segment's center
    const segmentCenterOffset = 330 - (targetPrizeIndex * 60);
    
    // Normalize to positive angle
    const normalizedOffset = ((segmentCenterOffset % 360) + 360) % 360;
    
    // Add randomness within segment (-25 to +25 degrees from center to stay within segment)
    let randomOffset;
    if (nearMiss) {
      // For near miss: land at the very edge, 25-28 degrees from center toward Didn't Win
      // Written Posts (4) is next to Didn't Win (5)
      // Positive offset moves toward lower index (Didn't Win side)
      randomOffset = 22 + Math.random() * 4; // 22-26 degrees from center
    } else {
      randomOffset = (Math.random() - 0.5) * 40;
    }
    
    // Add multiple full rotations (6-9 rotations for more drama)
    const fullRotations = isJackpotSpin 
      ? (8 + Math.floor(Math.random() * 3)) * 360  // 8-10 rotations for jackpot
      : (6 + Math.floor(Math.random() * 3)) * 360; // 6-8 rotations normally
    
    const newRotation = rotation + fullRotations + normalizedOffset + randomOffset;
    
    setRotation(newRotation);
    
    // Show result after spin completes
    setTimeout(() => {
      setIsSpinning(false);
      setResult(prize);
      setSpinCount(prev => prev + 1);
      
      if (prize.tier === 'win') {
        // First spin win - show keep/risk modal
        if (spinCount === 0) {
          setPendingPrize(prize);
          setShowKeepOrSpin(true);
          playSound('win');
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 4000);
        } else {
          // Won on extra spin
          const code = generateCode(prize.codePrefix);
          setClaimCode(code);
          setHasWon(true);
          setShowResult(true);
          playSound(usedExtraSpin ? 'grandPrize' : 'win');
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000);
          try {
            localStorage.setItem('videoHeroWheel', JSON.stringify({ won: true, prize: prize.label, code }));
          } catch (e) {
            // Ignore localStorage errors
          }
        }
      } else if (prize.tier === 'jackpot') {
        const code = generateCode(prize.codePrefix);
        setClaimCode(code);
        setHasWon(true);
        setShowResult(true);
        setIsGrandPrizeCelebration(true);
        playSound('grandPrize');
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 8000);
        try {
          localStorage.setItem('videoHeroWheel', JSON.stringify({ won: true, prize: prize.label, code }));
        } catch (e) {
          // Ignore localStorage errors
        }
      } else if (prize.tier === 'retry') {
        playSound('retry');
        setShowResult(true);
      } else if (prize.tier === 'lose') {
        setHasWon(true);
        setShowResult(true);
        try {
          localStorage.setItem('videoHeroWheel', JSON.stringify({ won: true, prize: 'lost', code: null }));
        } catch (e) {
          // Ignore localStorage errors
        }
      }
    }, spinDuration * 1000);
  };

  const keepPrize = () => {
    if (!pendingPrize) return;
    const code = generateCode(pendingPrize.codePrefix);
    setClaimCode(code);
    setHasWon(true);
    setShowKeepOrSpin(false);
    setShowResult(true);
    playSound('applause');
    try {
      localStorage.setItem('videoHeroWheel', JSON.stringify({ won: true, prize: pendingPrize.label, code }));
    } catch (e) {
      // Ignore localStorage errors
    }
  };

  const spinAgainChoice = () => {
    setUsedExtraSpin(true);
    setShowKeepOrSpin(false);
    setPendingPrize(null);
    setResult(null);
    setShowResult(false);
  };

  const resetWheel = () => {
    try {
      localStorage.removeItem('videoHeroWheel');
    } catch (e) {
      // Ignore localStorage errors
    }
    setRotation(0);
    setIsSpinning(false);
    setResult(null);
    setHasWon(false);
    setShowResult(false);
    setClaimCode('');
    setSpinCount(0);
    setShowKeepOrSpin(false);
    setPendingPrize(null);
    setUsedExtraSpin(false);
    setIsGrandPrizeCelebration(false);
    setShowConfetti(false);
  };

  // Confetti component
  const Confetti = () => {
    const pieces = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 2,
      color: ['#fbbf24', '#60a5fa', '#34d399', '#f472b6', '#a78bfa'][Math.floor(Math.random() * 5)],
      size: 8 + Math.random() * 8,
    }));

    return (
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {pieces.map((piece) => (
          <div
            key={piece.id}
            className="absolute animate-bounce"
            style={{
              left: `${piece.left}%`,
              top: '-20px',
              width: piece.size,
              height: piece.size,
              backgroundColor: piece.color,
              borderRadius: Math.random() > 0.5 ? '50%' : '0%',
              animation: `fall ${piece.duration}s ease-in ${piece.delay}s forwards`,
            }}
          />
        ))}
        <style>{`
          @keyframes fall {
            to {
              transform: translateY(100vh) rotate(720deg);
              opacity: 0;
            }
          }
        `}</style>
      </div>
    );
  };

  // Grand prize celebration screen
  if (isGrandPrizeCelebration && result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)' }}>
        {showConfetti && <Confetti />}
        <div className="text-center z-10">
          <div className="text-8xl mb-6 animate-bounce">🎁</div>
          <h1 className="text-4xl sm:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 mb-4">
            GRAND PRIZE!
          </h1>
          <p className="text-2xl text-white mb-8">{result.description}</p>
          <div className="bg-slate-800/80 backdrop-blur border border-amber-500/30 rounded-2xl p-8 max-w-md mx-auto">
            <p className="text-slate-300 mb-2">Your exclusive code:</p>
            <p className="text-3xl font-mono font-bold text-amber-400 tracking-wider">{claimCode}</p>
            <p className="text-slate-400 text-sm mt-4">DM this code to @VideoHero on LinkedIn to claim</p>
          </div>
        </div>
        <button
          onClick={resetWheel}
          className="fixed bottom-4 right-4 text-slate-600 hover:text-slate-400 text-sm transition-colors"
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
              fill="#f97316"
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
              
              const textRadius = 120;
              const textX = 190 + textRadius * Math.cos(midRad);
              const textY = 190 + textRadius * Math.sin(midRad);
              
              const emojiRadius = 75;
              const emojiX = 190 + emojiRadius * Math.cos(midRad);
              const emojiY = 190 + emojiRadius * Math.sin(midRad);

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
            <circle cx="190" cy="190" r="35" fill="#1e293b" stroke="#334155" strokeWidth="4" />
            <circle cx="190" cy="190" r="25" fill={BRAND_BLUE} />
            
            {/* Pegs around edge */}
            {prizes.map((_, index) => {
              const angle = index * segmentAngle - 90;
              const rad = (angle * Math.PI) / 180;
              const x = 190 + 175 * Math.cos(rad);
              const y = 190 + 175 * Math.sin(rad);
              return (
                <circle key={`peg-${index}`} cx={x} cy={y} r="6" fill="#334155" stroke="#475569" strokeWidth="2" />
              );
            })}
          </svg>
        </div>
      </div>
      
      {/* Bottom section */}
      <div className="text-center relative z-10">
        {/* Result Message */}
        {showResult && result && result.tier !== 'retry' && (
          <div className="mb-4">
            {result.tier === 'win' || result.tier === 'jackpot' ? (
              <>
                <p className="text-xl text-white mb-2">🎉 You won: <span className="font-bold text-amber-400">{result.label}</span></p>
                {claimCode && (
                  <div className="bg-slate-800/50 rounded-xl px-6 py-3 inline-block">
                    <p className="text-slate-400 text-sm mb-1">Your code:</p>
                    <p className="text-2xl font-mono font-bold text-white tracking-wider">{claimCode}</p>
                    <p className="text-slate-500 text-xs mt-2">DM this to @VideoHero on LinkedIn</p>
                  </div>
                )}
              </>
            ) : result.tier === 'lose' ? (
              <p className="text-xl text-slate-400">Better luck next time! 😢</p>
            ) : null}
          </div>
        )}
        
        {showResult && result && result.tier === 'retry' && (
          <div className="mb-4">
            <p className="text-xl text-white">🎲 <span className="font-semibold text-amber-400">Spin Again!</span></p>
            <p className="text-slate-400 text-sm">You get another try</p>
          </div>
        )}
        
        {/* Spin Button */}
        {!hasWon && (
          <button
            onClick={spin}
            disabled={isSpinning || showKeepOrSpin}
            className="px-12 py-4 rounded-2xl text-white font-bold text-xl transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 shadow-lg"
            style={{ 
              backgroundColor: usedExtraSpin && spinCount >= 2 ? '#ea580c' : BRAND_BLUE,
              boxShadow: usedExtraSpin && spinCount >= 2 
                ? '0 10px 40px rgba(234, 88, 12, 0.3)' 
                : '0 10px 40px rgba(37, 99, 235, 0.3)'
            }}
          >
            {isSpinning ? 'Spinning...' : 
             result?.tier === 'retry' ? 'Spin Again!' : 
             usedExtraSpin && spinCount >= 2 ? '🎰 Final Spin!' :
             'Spin to Win'}
          </button>
        )}
      </div>
      
      {/* Reset button */}
      <button
        onClick={resetWheel}
        className="fixed bottom-4 right-4 text-slate-600 hover:text-slate-400 text-sm transition-colors z-50"
      >
        Reset
      </button>
    </div>
  );
}
