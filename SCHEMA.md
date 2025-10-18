# Simulation Engine Schema Reference

## Event Schema
```js
{
  timestamp: Number, // seconds
  eventType: String, // e.g. 'ABILITY_HIT', 'ABILITY', 'LIGHT_ATTACK', 'BLOCK_START', etc.
  action: String,    // same as eventType, for legacy compatibility
  abilityId: String, // e.g. 'ability_sword_leaping_strike'
  weapon: String,    // e.g. 'Sword', 'Flail'
  sourceId: String,  // e.g. 'Player'
  targetId: String,  // e.g. 'Target Dummy'
  conditions: Array, // e.g. ['ATTACK_IS_BACKSTAB']
  notes: String,     // optional
}
```

## Bunker METADATA Schema
```js
{
  id: String,           // unique bunker id
  type: String,         // 'PERK', 'MASTERY', 'RUNEGLASS', etc.
  label: String,        // display name
  description: String,  // description for UI
  amount: Number,       // value for modifier/effect
  eventType: String,    // event type to match
  abilityId: String,    // ability id to match
  damageType: String,   // e.g. 'MISC_DAMAGE', 'EMPOWER', etc.
  category: String,     // effect/modifier category
  conditions: Array,    // e.g. ['ON_ABILITY_HIT:ability_sword_leaping_strike']
}
```

## Condition String Format
- Format: `TYPE:VALUE`
- Example: `ON_ABILITY_HIT:ability_sword_leaping_strike`
- Supported types: `ON_ABILITY_HIT`, `ATTACK_IS_BACKSTAB`, etc.

## Best Practices
- Always use `eventType` for event matching.
- Use consistent `abilityId` values across events and bunker configs.
- Document new event types and categories in this file.
- Refactor legacy code to use these fields for reliability.
