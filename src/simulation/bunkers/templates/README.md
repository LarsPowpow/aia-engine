
# Effect Bunker Prefab Template Contract

## Canonical fields for mass production

For automated mass production and UI compatibility, always use these canonical fields:

- Perks: `type: "PERK"`, `perk_bucket: "..."` (required)
- Masteries: `type: "WEAPON_MASTERY"`
- Runeglass: `type: "RUNEGLASS"`

**Example for a perk:**

```json
{
  "id": "perk_healing_defense_ii",
  "type": "PERK",
  "perk_bucket": "fixed_perk",
  "label": "Healing Defense II",
  "name": "Healing Defense II",
  "description": "On Block: Heal for 2.5% base health (5s cooldown).",
  "event": "onBlock",
  "condition": { "type": "activeItem", "itemType": "Kite Shield" },
  "cooldown": 5,
  "effects": [
    {
      "type": "heal",
      "value": 0.025,
      "valueType": "baseHealth",
      "target": "self"
    }
  ],
  "labels": ["D_Fixed_Shield_Kite_OnBlock"]
}
```

This template enables mass production of effect bunkers for the combat simulator. Prefab JSONs should provide the following fields:

- `id`: Unique bunker ID (required)
- `type`: 'PERK', 'MASTERY', 'RUNEGLASS', etc. (required)
- `label`: Display name (required)
- `description`: Description for UI (required)
- `category`: Effect category (e.g., 'EMPOWER', 'REND', 'MISC_DAMAGE') (required)
- `defaultValue` or `amount`: Numeric value (required)
- `defaultDuration` or `duration`: Duration in seconds (Infinity for passive) (optional)
- `eventType`: Event type to trigger effect (e.g., 'BLOCK_START') (optional)
- `conditions`: Array of condition strings (optional)
- `effectId`: Unique effect ID (optional, auto-generated if missing)

## Template Logic
- Validates event and conditions using `checkConditions`.
- Picks target automatically (source for EMPOWER/MISC_DAMAGE, target otherwise).
- Generates a unique effect id if not provided.
- Normalizes value and duration.
- Returns `{ applyEffects: [{ ...effect, targetId }] }` for engine compatibility.
- Emits debug logs in non-production for prefab troubleshooting.

## Example Prefab JSON
```json
{
  "id": "perk_counter_attack_empower",
  # Effect Bunker Prefab Template Contract

  This README documents the corrected JSON prefab structure used by the automated bunker generator.
  Drop prefab JSON files in `src/simulation/bunkers/prefabs/` and run `node scripts/generateBunkers.cjs`. The script will scan the folder, generate JS bunkers into `src/simulation/bunkers/generated/`, and keep the workflow fully automated.

  ## Minimal required fields
  - `id` (string) - Unique bunker identifier (e.g. `perk_healing_defense_ii`).
  - `bucket` (string) - Perk bucket/category used by UI and loadout (e.g. `fixed_perk`, `consumable`, `mastery`).
  - `name` (string) - Human-friendly name for UI.
  - `event` (string) - Engine event that triggers the bunker (e.g. `onBlock`, `onHit`, `onAttack`).
  - `effects` (array) - One or more engine-friendly effect objects (see below).

  ## Recommended/optional fields
  - `description` (string) - Short UI description.
  - `condition` (object|string) - Event condition (e.g. `{ "type": "activeItem", "itemType": "Kite Shield" }` or a simple string condition key).
  - `cooldown` (number) - Internal cooldown in seconds (e.g. `5`).
  - `labels` (array of strings) - Tags for exclusivity/compatibility (e.g. `['D_Fixed_Shield_Kite_OnBlock']`).
  - `compatibleWith` (array of strings) - Optional compatibility hints for UI (e.g. `['Kite Shield']`).
  - `metadata` (object) - Any additional data you want preserved and available to the template.

  ## Effect object shape
  Each entry in the `effects` array should be an engine-friendly object. Common fields:
  - `type` (string) - `heal`, `damage`, `empower`, `statModifier`, etc.
  - `value` (number) - Numeric value (absolute or fraction depending on `valueType`).
  - `valueType` (string) - Optional: `baseHealth`, `percent`, `flat`, `raw`, etc. Helps the template interpret the value.
  - `target` (string) - `self`, `target`, `ally`, etc.
  - `duration` (number|null) - Duration in seconds, or `null` for instant effects.
  - `statusId` or `id` (string) - Optional effect id (template will auto-generate if missing).

  Examples:


  - Empower (Counter Attack style):

  ```json
  {
    "id": "perk_counter_attack_empower",
    "type": "EFFECT",
    "bucket": "fixed_perk",
    "name": "Counter Attack",
    "description": "On Block: Gain a 20% Empower for 4s.",
    "event": "onBlock",
    "condition": "onBlock",
    "cooldown": 0,
    "effects": [
      {
        "type": "empower",
        "value": 0.20,
        "valueType": "percent",
        "target": "self",
        "duration": 4
      }
    ],
    "labels": ["D_Fixed_Shield_Kite_OnBlock"]
  }
  ```

  - Healing Defense II (the perk we're testing):

  ```json
  {
    "id": "perk_healing_defense_ii",
    "type": "EFFECT",
    "bucket": "fixed_perk",
    "name": "Healing Defense II",
    "description": "On Block: Heal for 2.5% base health (5s cooldown).",
    "event": "onBlock",
    "condition": { "type": "activeItem", "itemType": "Kite Shield" },
    "cooldown": 5,
    "effects": [
      {
        "type": "heal",
        "value": 0.025,
        "valueType": "baseHealth",
        "target": "self",
        "duration": null
      }
    ],
    "labels": ["D_Fixed_Shield_Kite_OnBlock"],
    "compatibleWith": ["Kite Shield"]
  }
  ```

  ## Generator behavior / Template contract

  - The generator script (`scripts/generateBunkers.cjs`) reads every `.json` file under `src/simulation/bunkers/prefabs/` and generates one `.js` bunker per prefab into `src/simulation/bunkers/generated/` using the `TEMPLATE_EffectBunker.js` template.
  - The template will validate the prefab against the in-repo schema where possible, normalize fields, and produce an engine-ready bunker that returns `{ applyEffects: [...] }` on trigger.
  - If `statusId`/`id` on effects is missing, the template will auto-generate a stable id based on `bunker.id` + effect index.

  ## Where to place your files

  - Drop your prefab JSON into:

  ```
  src/simulation/bunkers/prefabs/
  ```

  - Then run:

  ```bash
  node scripts/generateBunkers.cjs
  ```

  That is all — the pipeline is now automated: upsert source to UKB, drop prefab JSON, run the generator, register/verify in manifest if required, and run simulations.
