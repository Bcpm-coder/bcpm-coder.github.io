const GAME_VOLUME_MULTIPLIER = 2;
const MAX_GAME_VOLUME_MULTIPLIER = 2;

const audioHandlerPrototype = self.AudioDOMHandler?.prototype;

if (audioHandlerPrototype && !audioHandlerPrototype.__bcpmVolumeBoosted) {
  const getMasterVolume = audioHandlerPrototype.GetMasterVolume;

  audioHandlerPrototype.GetMasterVolume = function () {
    return Math.min(
      MAX_GAME_VOLUME_MULTIPLIER,
      getMasterVolume.call(this) * GAME_VOLUME_MULTIPLIER,
    );
  };

  Object.defineProperty(audioHandlerPrototype, '__bcpmVolumeBoosted', {
    value: true,
  });
}
