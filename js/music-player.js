document.addEventListener("DOMContentLoaded", function() {
    const playButton = document.querySelector('.play');
    const audio = new Audio('music/theVisionBySonum.mp3');
    const stars = document.querySelector('.stars');
    let isPlaying = false;
    const fadeDuration = 3000;
    const maxVolume = 0.08;

    audio.volume = 0;

    playButton.addEventListener('click', function() {
        if (!isPlaying) {
            audio.play();
            isPlaying = true;
            playButton.classList.remove('fa-play');
            playButton.classList.add('fa-pause');
            stars.style.opacity = 1;

            const fadeInStartTime = Date.now();
            const fadeInInterval = setInterval(function() {
                const fadeInElapsedTime = Date.now() - fadeInStartTime;
                if (fadeInElapsedTime < fadeDuration) {
                    audio.volume = (fadeInElapsedTime / fadeDuration) * maxVolume;
                } else {
                    audio.volume = maxVolume;
                    clearInterval(fadeInInterval);
                }
            }, 100);
        } else {
            const fadeOutStartTime = Date.now();
            stars.style.opacity = 0;
            playButton.classList.remove('fa-pause');
            playButton.classList.add('fa-play');
            const fadeOutInterval = setInterval(function() {
                const fadeOutElapsedTime = Date.now() - fadeOutStartTime;
                if (fadeOutElapsedTime < fadeDuration) {
                    audio.volume = maxVolume - ((fadeOutElapsedTime / fadeDuration) * maxVolume);
                } else {
                    audio.volume = 0;
                    clearInterval(fadeOutInterval);
                    audio.pause();
                    isPlaying = false;  
                }
            }, 100);
        }
    });
});
