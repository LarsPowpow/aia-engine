// Utility function to normalize combat log entries
function normalizeCombatLog(logEntries) {
    return logEntries.map((entry, idx) => ({
        ...entry,
        timestamp: entry.timestamp ?? idx + 1,
        source: entry.source ?? 'Player',
        action: entry.action ?? 'Attack',
        damage: typeof entry.damage === 'number' ? entry.damage : Number(entry.damage) || 0
    }));
}

export { normalizeCombatLog };
