'use client';

import React, { useEffect, useState } from 'react';
import { getUserStats, getStreakSummary } from '../utils/db';

// helper for 7-slice citrus SVG where each slice is filled based on weeklyDays[] checked in
const CitrusSVG = ({
    weeklyDays = [false, false, false, false, false, false, false],
    size = 48,
    currentDayIndex = null,
    filledColor = '#FFA94D' // default fallback if not passed
}) => {
    // create 7 wedge paths w/ rotate transforms
    const slices = weeklyDays;
    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 1;
    const innerR = r * 0.4;

    // compute wedge path for i (0-6)
    const wedgePath = (i) => {
        const startAngle = (i * 360 / 7) - 90;
        const endAngle = ((i + 1) * 360 / 7) - 90;
        const toRad = a => (a * Math.PI) / 180;
        const x1 = cx + r * Math.cos(toRad(startAngle));
        const y1 = cy + r * Math.sin(toRad(startAngle));
        const x2 = cx + r * Math.cos(toRad(endAngle));
        const y2 = cy + r * Math.sin(toRad(endAngle));
        const x3 = cx + (innerR * 0.7) * Math.cos(toRad(endAngle));
        const y3 = cy + (innerR * 0.7) * Math.sin(toRad(endAngle));
        const x4 = cx + (innerR * 0.7) * Math.cos(toRad(startAngle));
        const y4 = cy + (innerR * 0.7) * Math.sin(toRad(startAngle));
        const large = (endAngle - startAngle) > 180 ? 1 : 0;
        return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${large} 0 ${x4} ${y4} Z`;
    };

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Weekly check-in citrus">
            {/* gradient - doesnt look good rn but keeping as a reminder to fix later
            <defs>
                <radialGradient id="sliceGradient" cx="50%" cy="50%" r="50%">
                    <stop offset="50%" stopColor="#ffe6b3ff" />
                    <stop offset="100%" stopColor="#FFA94D" />
                </radialGradient>
            </defs>*/}

            {/* glow for current day? */}
            <defs>
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#ffd166" />
                </filter>
            </defs>
            
            {/* outer circle (for border) */}
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f6c85f" strokeWidth="4" />
            {slices.map((filled, i) => {
                const reversedIndex = 6 - i; // reverse slice order
                return (
                    <path
                        key={i}
                        d={wedgePath(reversedIndex)} // use reversedIndex here
                        fill={filled ? filledColor : '#fff6b6ff'}
                        stroke="#f49d2a"
                        strokeWidth={3}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter={i === currentDayIndex ? 'url(#glow)' : undefined}
                    />
                );
            })}

            {/* (center disc) */}
            <circle cx={cx} cy={cy} r={innerR * 0.5} fill="#fff" opacity="0.6" />
       </svg>
    );
};

export default function StreakBadge({ refreshKey = 0, compact = false }) {
    const [stats, setStats] = useState(null);
    const [summary, setSummary] = useState(null);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const s = await getUserStats();
                const sum = await getStreakSummary();
                if (!mounted) return;
                setStats(s);
                setSummary(sum);
            } catch (err) {
                console.error('StreakBadge load err', err);
            }
        })();
        return () => { mounted = false; };
    }, [refreshKey]);

    if (!summary || !stats) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CitrusSVG weeklyDays={[false,false,false,false,false,false,false]} size={40} />
            <div style={{ fontSize: 12, color: '#666' }}>Loading…</div>
        </div>
        );
    }

    const { currentStreak, longestStreak, currentWeekCount, completedFullWeeks } = summary;
    const weeklyDays = (stats && stats.weeklyDays) || [false, false, false, false, false, false, false];
    const todayIndex = (new Date().getDay() + 6) % 7;

    return (
        <div className="flex items-center justify-center bg-amber-100 border-2 border-orange-400 rounded-lg px-4 py-2">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CitrusSVG weeklyDays={weeklyDays} size={48} currentDayIndex={new Date().getDay()} filledColor="#FF9F00" />
                <div style={{ display: 'flex', flexDirection: 'column', color: '#1f2937' }}>
                    <div style={{ fontWeight: 700, lineHeight: 1 }}>
                        {currentStreak} <span style={{ fontWeight: 600, fontSize: 17 }}>day streak</span>
                    </div>
                    <div style={{ fontSize: 11 }}>
                        {completedFullWeeks} weeks • longest: {longestStreak}
                    </div>
                </div>
            </div>
        </div>
    );
}