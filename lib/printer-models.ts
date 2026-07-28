/**
 * Common printer models with real published build volumes, used to auto-fill
 * the registration form. Not exhaustive — "Other / not listed" always stays
 * an option, and every field stays editable after auto-fill.
 */
export const PRINTER_MODELS = [
  { make: "Creality", model: "Ender 3", buildVolume: "220x220x250mm" },
  { make: "Creality", model: "Ender 3 V2", buildVolume: "220x220x250mm" },
  { make: "Creality", model: "Ender 3 S1", buildVolume: "220x220x270mm" },
  { make: "Creality", model: "Ender 5", buildVolume: "220x220x300mm" },
  { make: "Creality", model: "CR-10", buildVolume: "300x300x400mm" },
  { make: "Creality", model: "K1", buildVolume: "220x220x250mm" },
  { make: "Prusa", model: "MK3S+", buildVolume: "250x210x210mm" },
  { make: "Prusa", model: "MINI+", buildVolume: "180x180x180mm" },
  { make: "Prusa", model: "XL", buildVolume: "360x360x360mm" },
  { make: "Bambu Lab", model: "A1", buildVolume: "256x256x256mm" },
  { make: "Bambu Lab", model: "A1 Mini", buildVolume: "180x180x180mm" },
  { make: "Bambu Lab", model: "P1P", buildVolume: "256x256x256mm" },
  { make: "Bambu Lab", model: "P1S", buildVolume: "256x256x256mm" },
  { make: "Bambu Lab", model: "X1 Carbon", buildVolume: "256x256x256mm" },
  { make: "Anycubic", model: "Kobra 2", buildVolume: "220x220x250mm" },
  { make: "Anycubic", model: "Photon Mono", buildVolume: "130x80x160mm" },
  { make: "Elegoo", model: "Neptune 3", buildVolume: "220x220x280mm" },
  { make: "Elegoo", model: "Mars 3", buildVolume: "143x89x175mm" },
  { make: "Voron", model: "2.4", buildVolume: "350x350x350mm" },
  { make: "Artillery", model: "Sidewinder X2", buildVolume: "300x300x400mm" },
  { make: "FlashForge", model: "Adventurer 3", buildVolume: "150x150x150mm" },
  { make: "Ultimaker", model: "S3", buildVolume: "230x190x200mm" },
] as const;
