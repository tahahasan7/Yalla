// Music track data - filenames for all available tracks
// Only include tracks that are actually available in AUDIO_TRACK_MAP
export const MUSIC_TRACKS = [
  "ZISO - Off the Favela.mp3",
  "Yarin Primak - Rio Groove.mp3",
  "Yarin Primak - Rio Groove - Instrumental Version.mp3",
  "Yarin Primak - Back to the Base.mp3",
  "The North - Salsa Picante.mp3",
  "Skygaze - Kissing the Moon.mp3",
  "Shekel Beats - Food.mp3",
  "Rynn - A Good Day for Falling in Love.mp3",
  "Russo - Club - Instrumental Version.mp3",
  "Ohad Ben Ari - Concerto KV 488 Mozart.mp3",
  "Moon - You Need It.mp3",
  "Migra - Baile Nomade.mp3",
  // Removed tracks that aren't in AUDIO_TRACK_MAP
  // "Michael Shynes - Next to You.mp3",
  // "messwave - needed you.mp3",
  // "Maitê Inaê - Yemaya.mp3",
  // "Logan Pilcher - Answers to Questions.mp3",
  // "LANI - COPYPASTE feat JARED.mp3",
  // "L Donner - Singela feat Soraya Ravenle.mp3",
  // "Katrina Stone - Dont Tell Me What to Do.mp3",
  // "Jimmy Curtis - On Top.mp3",
  // "Jay Sanon - Come My Way.mp3",
  // "Jane  The Boy - Wild.mp3",
  // "Jane  The Boy - Hostage.mp3",
  // "Henry Young - One More Last Time feat Ashley Alisha.mp3",
  // "Ge Filter Fish - Baby Im Stuck in a Cone.mp3",
  // "FVMELESS - First Name Basis.mp3",
  // "Frank Bentley - TUNNEL VISION.mp3",
  // "Echo LaRoux - Take My Heart and Go.mp3",
  // "Donner  Tie - Gostosinho.mp3",
  // "djnoone - Ojitos.mp3",
  // "Dimitrix - Fun Fun Fun.mp3",
  // "Curtis Cole - BOO.mp3",
  // "Christopher Galovan - Aire.mp3",
  // "Captain Joz - King Bayla.mp3",
  // "Birraj - Prelude in E Minor Op 28 No 4.mp3",
  // "Birraj - Nocturne in Eb Op 9 No 2.mp3",
  // "Anthony Lazaro - A Thousand Little Fires.mp3",
  // "Amos Ever Hadani - Infinito Tren.mp3",
  // "Amick Cutler - Weight of My Love.mp3",
];

// Create a mapping for audio tracks to avoid dynamic requires
// Using a smaller subset of tracks to avoid bundling issues
export const AUDIO_TRACK_MAP: Record<string, any> = {
  "ZISO - Off the Favela.mp3": require("../../assets/music/ZISO - Off the Favela.mp3"),
  "Yarin Primak - Rio Groove.mp3": require("../../assets/music/Yarin Primak - Rio Groove.mp3"),
  "Yarin Primak - Rio Groove - Instrumental Version.mp3": require("../../assets/music/Yarin Primak - Rio Groove - Instrumental Version.mp3"),
  "Yarin Primak - Back to the Base.mp3": require("../../assets/music/Yarin Primak - Back to the Base.mp3"),
  "The North - Salsa Picante.mp3": require("../../assets/music/The North - Salsa Picante.mp3"),
  "Skygaze - Kissing the Moon.mp3": require("../../assets/music/Skygaze - Kissing the Moon.mp3"),
  "Shekel Beats - Food.mp3": require("../../assets/music/Shekel Beats - Food.mp3"),
  "Rynn - A Good Day for Falling in Love.mp3": require("../../assets/music/Rynn - A Good Day for Falling in Love.mp3"),
  "Russo - Club - Instrumental Version.mp3": require("../../assets/music/Russo - Club - Instrumental Version.mp3"),
  "Ohad Ben Ari - Concerto KV 488 Mozart.mp3": require("../../assets/music/Ohad Ben Ari - Concerto KV 488 Mozart.mp3"),
  "Moon - You Need It.mp3": require("../../assets/music/Moon - You Need It.mp3"),
  "Migra - Baile Nomade.mp3": require("../../assets/music/Migra - Baile Nomade.mp3"),
  // Removing problematic files with special characters
  // "Maitê Inaê - Yemaya.mp3": require("../../assets/music/Maitê Inaê - Yemaya.mp3"),
};

// Helper function to format track name (remove .mp3 extension)
export const formatTrackName = (track: string): string => {
  return track.replace(".mp3", "");
};
