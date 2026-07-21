(function () {
	var GAME_VOLUME_MULTIPLIER = 2;
	var audioContext = null;
	var masterGain = null;
	var hasUnlocked = false;

	function getAudioContext() {
		if (audioContext) return audioContext;

		var AudioContextClass = window.AudioContext || window.webkitAudioContext;
		if (!AudioContextClass) return null;

		try {
			audioContext = new AudioContextClass();
			masterGain = audioContext.createGain();
			masterGain.gain.value = Math.min(1, 0.13 * GAME_VOLUME_MULTIPLIER);
			masterGain.connect(audioContext.destination);
		} catch (error) {
			audioContext = null;
			masterGain = null;
		}

		return audioContext;
	}

	function unlockAudio() {
		var context = getAudioContext();
		if (!context) return;

		if (context.state === 'suspended') {
			var resumeResult = context.resume();
			if (resumeResult && typeof resumeResult.catch === 'function') {
				resumeResult.catch(function () {});
			}
		}

		hasUnlocked = true;
	}

	function playTone(context, frequency, startTime, duration, volume, type, endRatio) {
		var oscillator = context.createOscillator();
		var gain = context.createGain();
		var frequencyRatio = endRatio || 1.08;

		oscillator.type = type;
		oscillator.frequency.setValueAtTime(frequency, startTime);
		oscillator.frequency.exponentialRampToValueAtTime(frequency * frequencyRatio, startTime + duration);

		gain.gain.setValueAtTime(0.0001, startTime);
		gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.012);
		gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

		oscillator.connect(gain);
		gain.connect(masterGain);
		oscillator.start(startTime);
		oscillator.stop(startTime + duration + 0.02);
	}

	function vibrateHextris(pattern) {
		if (document.hidden || typeof navigator.vibrate !== 'function') return;

		try {
			navigator.vibrate(pattern);
		} catch (error) {
			// Vibration is optional and must never interrupt the game loop.
		}
	}

	window.playHextrisScoreSound = function (points, comboMultiplier) {
		if (document.hidden) return;

		var combo = Math.max(1, Math.min(Number(comboMultiplier) || 1, 6));
		vibrateHextris(combo > 1 ? [32, 28, 46] : [28, 24, 36]);

		var context = getAudioContext();
		if (!context || !masterGain || !hasUnlocked || context.state !== 'running') return;

		var scoreLift = Math.min(Math.max(Number(points) || 0, 0), 400) / 400;
		var baseFrequency = 440 + (combo - 1) * 55 + scoreLift * 70;
		var now = context.currentTime + 0.008;

		playTone(context, baseFrequency, now, 0.11, 0.72, 'sine');
		playTone(context, baseFrequency * 1.5, now + 0.055, 0.13, 0.52, 'triangle');
	};

	window.playHextrisStackSound = function (stackHeight) {
		if (document.hidden) return;

		var height = Math.max(1, Math.min(Number(stackHeight) || 1, 8));
		vibrateHextris(12 + height * 2);

		var context = getAudioContext();
		if (!context || !masterGain || !hasUnlocked || context.state !== 'running') return;

		var frequency = 185 + height * 7;
		var now = context.currentTime + 0.006;

		playTone(context, frequency, now, 0.075, 0.54, 'triangle', 0.76);
	};

	document.addEventListener('pointerdown', unlockAudio, { passive: true });
	document.addEventListener('touchstart', unlockAudio, { passive: true });
	document.addEventListener('keydown', unlockAudio);
})();
