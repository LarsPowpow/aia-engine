/**
 * Auto-generated Effect Bunker
 */
import { METADATA as templateMetadata, createEffectBunker as templateCreateEffectBunker } from '../templates/TEMPLATE_EffectBunker.js';
import { BUNKER_METADATA_SCHEMA, validateSchema } from '../../schema.js';
import { checkContext, checkSource, checkConditions } from '../bunkerUtils.js';

export const METADATA = {
  "id": "perk_counter_attack_empower",
  "type": "PERK",
  "label": "Counter Attack",
  "description": "On Block: Gain a 20% Empower for 4s.",
  "defaultValue": 0.2,
  "defaultDuration": 4,
  "eventType": "BLOCK_START",
  "category": "EMPOWER",
  "conditions": [
    "ON_BLOCK_START"
  ]
};
validateSchema(METADATA, BUNKER_METADATA_SCHEMA);


// Custom handler for Counter Attack Empower: applies Empower to the source on block

function counterAttackEmpowerHandler(context) {
  const eventType = (context.eventType || '').toUpperCase();
  const expectedType = (METADATA.eventType || '').toUpperCase();
  const contextOk = checkContext(context);
  const conditionsOk = checkConditions(METADATA.conditions, context);
  const eventTypeOk = eventType === expectedType;
  const shouldProc = contextOk && conditionsOk && eventTypeOk;
  const effect = shouldProc ? [{
    id: METADATA.id,
    target: context.source.id,
    category: METADATA.category,
    value: METADATA.defaultValue,
    duration: METADATA.defaultDuration,
    source: METADATA.id,
    label: METADATA.label,
    description: METADATA.description
  }] : [];
  const result = effect.length > 0 ? { applyEffects: effect } : null;
  console.log('[COUNTER ATTACK HANDLER]', {
    eventType,
    expectedType,
    eventTypeOk,
    contextOk,
    conditionsOk,
    shouldProc,
    context,
    effect,
    result
  });
  return result;
}

export const handler = counterAttackEmpowerHandler;

export default {
  id: METADATA.id,
  type: METADATA.type,
  metadata: METADATA,
  handler: counterAttackEmpowerHandler
};
