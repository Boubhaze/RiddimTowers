import React, { useState, useEffect } from 'react';

const AsciiDisplay: React.FC = () => {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((f) => f + 1);
    }, 150);
    return () => clearInterval(interval);
  }, []);

  // --- ANIMATION HELPERS ---
  const getSpin = () => ['|', '/', '-', '\\'][frame % 4];
  const getRevSpin = () => ['|', '\\', '-', '/'][frame % 4];
  const getLed = (speed: number) => (frame % speed < speed / 2 ? '(*)' : '( )');
  
  // Sine wave fader movement
  const getFader = (offset: number) => {
    const val = Math.floor((Math.sin((frame * 0.2) + offset) + 1) * 2.5);
    const track = ['|', '|', '|', '|', '|', '|'];
    track[5 - val] = '='; // Fader knob
    return track;
  };

  // --- RENDER FUNCTIONS ---

  const renderPreamp = () => {
    const s = getFader(0);
    const b = getFader(2);
    const m = getFader(4);
    const h = getFader(1);
    const t = getFader(3);
    const vu = frame % 2 === 0 ? '|||  ' : '|||||';

    return `
 .-----------------------------.
 |    5-WAY PREAMP CONTROL     |
 |-----------------------------|
 |                             |
 | SUB  BAS  MID  HIG  TOP     |
 | .--. .--. .--. .--. .--.    |
 | |${s[0]}| |${b[0]}| |${m[0]}| |${h[0]}| |${t[0]}|    |
 | |${s[1]}| |${b[1]}| |${m[1]}| |${h[1]}| |${t[1]}|    |
 | |${s[2]}| |${b[2]}| |${m[2]}| |${h[2]}| |${t[2]}|    |
 | |${s[3]}| |${b[3]}| |${m[3]}| |${h[3]}| |${t[3]}|    |
 | |${s[4]}| |${b[4]}| |${m[4]}| |${h[4]}| |${t[4]}|    |
 | |${s[5]}| |${b[5]}| |${m[5]}| |${h[5]}| |${t[5]}|    |
 | '--' '--' '--' '--' '--'    |
 |                             |
 | SIGNAL: [${vu}]           |
 '-----------------------------'
`.substring(1);
  };

  const renderSiren = () => {
    const l1 = getLed(4); // Fast
    const l2 = getLed(12); // Slow
    const wave = frame % 4; 
    const w = wave === 0 ? '_  ' : wave === 1 ? ' _ ' : wave === 2 ? '  _' : ' _ ';

    return `
 .-----------------------.
 |   NJ-DUB SIREN UNIT   |
 |-----------------------|
 |                       |
 |    MODE      LFO      |
 |   [${w}]     (${getSpin()})      |
 |                       |
 |    RATE     PITCH     |
 |    ( /)     ( \\)      |
 |                       |
 |   STATUS    TRIGGER   |
 |    ${l1}      [###]     |
 |                       |
 |    PWR                |
 |    ${l2}                |
 '-----------------------'
`.substring(1);
  };

  const renderEcho = () => {
    const tape1 = getSpin();
    const tape2 = getSpin();
    // Moving tape visual
    const t = frame % 3 === 0 ? ' ~ ~ ' : frame % 3 === 1 ? '~ ~ ~' : ' ~ ~ ';

    return `
 .-----------------------.
 |  SPACE ECHO RE-201    |
 |-----------------------|
 |      TAPE TRANSPORT   |
 |      .--.   .--.      |
 |      |${tape1} |===|${tape2} |      |
 |      '--'   '--'      |
 |       \\_______/       |
 |        ${t}        |
 |                       |
 |  INTENS.  RATE  VOL   |
 |   ( /)    (\\)   (|)   |
 |                       |
 |  BASS     TREBLE      |
 |   ( |)     (|)        |
 '-----------------------'
`.substring(1);
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 items-center md:items-end justify-center select-none pointer-events-none">
        
        {/* PREAMP CARD */}
        <div className="bg-white dark:bg-black border-2 border-black dark:border-white p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] flex flex-col items-center h-full transition-colors">
            <div className="w-full text-[9px] font-mono tracking-widest text-gray-400 dark:text-gray-500 mb-2 border-b border-gray-100 dark:border-gray-800 pb-1 text-center">
                UNIT_01
            </div>
            <pre className="font-mono text-[10px] leading-[1.1] whitespace-pre text-black dark:text-white font-bold">
                {renderPreamp()}
            </pre>
        </div>

        {/* SIREN CARD */}
        <div className="bg-white dark:bg-black border-2 border-black dark:border-white p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] flex flex-col items-center h-full transition-colors">
             <div className="w-full text-[9px] font-mono tracking-widest text-gray-400 dark:text-gray-500 mb-2 border-b border-gray-100 dark:border-gray-800 pb-1 text-center">
                UNIT_02
            </div>
            <pre className="font-mono text-[10px] leading-[1.1] whitespace-pre text-black dark:text-white font-bold">
                {renderSiren()}
            </pre>
        </div>

        {/* ECHO CARD */}
        <div className="bg-white dark:bg-black border-2 border-black dark:border-white p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] flex flex-col items-center h-full transition-colors">
             <div className="w-full text-[9px] font-mono tracking-widest text-gray-400 dark:text-gray-500 mb-2 border-b border-gray-100 dark:border-gray-800 pb-1 text-center">
                UNIT_03
            </div>
            <pre className="font-mono text-[10px] leading-[1.1] whitespace-pre text-black dark:text-white font-bold">
                {renderEcho()}
            </pre>
        </div>

    </div>
  );
};

export default AsciiDisplay;