const fs = require('fs');
const vm = require('vm');

function parseJsFileContent(content, objectName) {
  // Remove export and window assignment
  let scriptContent = content.replace(/^export const \w+ = /, '');
  scriptContent = scriptContent.replace(/window\.\w+ = \w+;\s*$/, '');
  // Remove trailing commas if any before a closing brace or bracket
  scriptContent = scriptContent.replace(/,\s*([}\]])/g, '$1');
  
  // Wrap in an object to make it a valid expression for eval
  const context = {};
  vm.createContext(context);
  vm.runInContext(`${objectName} = ${scriptContent}`, context);
  return context[objectName];
}

function stringifyObject(obj, indent = 2) {
  // Basic stringifier, not perfect for comments or complex formatting
  // but good enough for JS object literals.
  // For more complex cases, a proper code generator (like escodegen) would be better.
  // This will not preserve comments within the objects.
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'function') {
      return value.toString(); // Keep functions as strings if any (not expected here)
    }
    return value;
  }, indent);
}


const spellTypesFilePath = process.argv[2];
const unitTypesFilePath = process.argv[3];

const spellTypesContent = fs.readFileSync(spellTypesFilePath, 'utf8');
const unitTypesContent = fs.readFileSync(unitTypesFilePath, 'utf8');

// Extracting the objects by finding their start and end
// This is safer than regex for large, complex objects and avoids eval on the whole file.

let spellTypesString = spellTypesContent.substring(spellTypesContent.indexOf('{'), spellTypesContent.lastIndexOf('}') + 1);
let unitTypesString = unitTypesContent.substring(unitTypesContent.indexOf('export const unitTypes = {') + 'export const unitTypes = '.length , unitTypesContent.indexOf('};', unitTypesContent.indexOf('export const unitTypes = {')) + 1);
let unitUpgradesString = unitTypesContent.substring(unitTypesContent.indexOf('export const unitUpgrades = {') + 'export const unitUpgrades = '.length, unitTypesContent.indexOf('};', unitTypesContent.indexOf('export const unitUpgrades = {'))+1);

const spellTypes = eval('(' + spellTypesString + ')');
const unitTypes = eval('(' + unitTypesString + ')');
const unitUpgrades = eval('(' + unitUpgradesString + ')');


const preservedKeys = ['name', 'enabled', 'passive', 'requiredUpgrade', 'effect', 'description'];

for (const unitName in unitTypes) {
  if (unitTypes.hasOwnProperty(unitName)) {
    const unit = unitTypes[unitName];
    if (unit.stats && unit.stats.abilities) {
      const originalAbilities = unit.stats.abilities;
      const newAbilities = [];

      for (const originalAbility of originalAbilities) {
        const spellId = originalAbility.effect;
        const baseSpell = spellTypes[spellId];

        if (!baseSpell) { // If not found in spellTypes (e.g. some passives), keep as is.
          newAbilities.push(originalAbility);
          continue;
        }
        
        // Check if this is a passive ability that was genericized in spellTypes.js
        // If originalAbility.passive is true AND baseSpell.passive is true, then it's a genericized passive.
        // If originalAbility.passive is true but baseSpell.passive is not, it's likely a unit-specific passive, keep as is.
        // However, the prompt said "If a passive ability was genericized into spellTypes.js, then it should be updated like other abilities."
        // The creation of spellTypes.js used `effect` as key. So if `spellTypes[originalAbility.effect]` exists, it was "genericized".
        // The only special handling for passives is to ensure 'passive' and 'requiredUpgrade' are copied.

        let newAbility = { spellId: spellId };

        // 1. Always copy 'name'
        newAbility.name = originalAbility.name;

        // 2. Always copy 'enabled' if it exists
        if (originalAbility.hasOwnProperty('enabled')) {
          newAbility.enabled = originalAbility.enabled;
        }

        // 3. Handle 'passive' and 'requiredUpgrade' for passive abilities
        if (originalAbility.passive) {
          newAbility.passive = true; // it is passive
          if (originalAbility.hasOwnProperty('requiredUpgrade')) {
             // Only copy requiredUpgrade if it's different from base or not in base
            if (!baseSpell.hasOwnProperty('requiredUpgrade') || baseSpell.requiredUpgrade !== originalAbility.requiredUpgrade) {
                 newAbility.requiredUpgrade = originalAbility.requiredUpgrade;
            }
            // If it's same as base, it will be omitted, which is fine.
            // However, the prompt was: "If passive: true, also copy requiredUpgrade if it exists." - this implies always copying it.
            // Let's stick to the "copy if different or not in base" for overrides for consistency.
            // Re-evaluating: "passive: originalAbility.passive if it exists". "If passive: true, also copy requiredUpgrade if it exists."
            // This sounds like these two should always be copied if present in original for passives.
            // Let's adjust: if originalAbility.passive, then newAbility.passive = true.
            // And if originalAbility.requiredUpgrade exists (and it's passive), newAbility.requiredUpgrade = originalAbility.requiredUpgrade.
            // This means `requiredUpgrade` for passives will always appear in unitTypes if it was there originally.
             newAbility.requiredUpgrade = originalAbility.requiredUpgrade; // Always copy for passive if present
          }
        }


        // 4. For all other properties, copy if different from baseSpell or not in baseSpell
        for (const key in originalAbility) {
          if (originalAbility.hasOwnProperty(key)) {
            if (key === 'spellId' || key === 'effect' || key === 'description' || key === 'name' || key === 'enabled' || (key === 'passive' && originalAbility.passive) || (key === 'requiredUpgrade' && originalAbility.passive && originalAbility.hasOwnProperty('requiredUpgrade'))) {
              // Already handled or should be skipped
              continue;
            }

            if (!baseSpell.hasOwnProperty(key) || JSON.stringify(baseSpell[key]) !== JSON.stringify(originalAbility[key])) {
              newAbility[key] = originalAbility[key];
            }
          }
        }
        newAbilities.push(newAbility);
      }
      unit.stats.abilities = newAbilities;
    }
  }
}

// Reconstruct the file content
let outputContent = `// units/unitTypes.js - Unit definitions with reimagined fantasy units

  // Define all unit types with their stats
  export const unitTypes = ${stringifyObject(unitTypes, 2)};

  // Define available upgrades
  export const unitUpgrades = ${stringifyObject(unitUpgrades, 2)};

  // Make unit types available globally
  window.unitTypes = unitTypes;
  window.unitUpgrades = unitUpgrades;
`;

console.log(outputContent);
process.exit(0); // ensure a clean exit for the bash tool
