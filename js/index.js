$(function() {
    var $player = $('.movie-player');
    var $movieProgress = $('#movieProgress');
    var $movieProgressText = $('#movieProgressText');
    var $moviePlayBtn = $('#moviePlayBtn');
    var $movie = $('#movie');
    var tickCall = null;
    var stepInCall = null;
    var palyCall = null;
    var maxTick = 20;
    var stepTick = 0;
    var stepTickText;
    var isPlaying = false;
    var isLoopPlay = false;
    var isAutoPlay = true;
    var stepReadyTime = 10;
    var timeline = [1000, 4000, 6000, 15000, 15000, 7000, 6000];
    var saveStep = false;
    var speed = 1;

    var pause = function() {
        isPlaying = false;
        clearInterval(palyCall);
        $player.removeClass('playing');
    };

    var setProgress = function(step) {
        if(typeof step === 'string') step = parseInt(step);
        step = step % timeline.length;
        clearInterval(tickCall);
        clearInterval(stepInCall);
        stepTick = 0;
        stepTickText = '';
        $player.attr('id', 'step-' + step).attr('tick', stepTickText).removeClass('step-in').addClass('step-ing').toggleClass('playing', !!isPlaying);
        stepInCall = setTimeout(function() {
            $player.addClass('step-in').removeClass('step-ing');
            tickCall = setInterval(function() {
                stepTickText += (stepTick++)%10;
                $player.attr('tick', stepTickText);
                if(stepTick >= timeline[step]/1000) clearInterval(tickCall);
            }, 1000/speed);
        }, stepReadyTime/speed);
        $movieProgress.val(step);
        $movieProgressText.text((step + 1)+' / '+timeline.length);
        if(isPlaying) {
            clearTimeout(palyCall);
            palyCall = setTimeout(function() {
                if((step + 1)%timeline.length === 0) {
                    if(isLoopPlay) {
                        $.zui.messager.show('重新播放', {placement: 'top', close: false, time: 1000});
                    } else {
                        pause();
                    }
                }
                setProgress(step + 1);
            }, (timeline[step] + stepReadyTime)/speed)
        }
        if(saveStep) $.zui.store.set('lastStep', step);
    };

    var play = function(step) {
        if(!isPlaying) {
            isPlaying = true;
            setProgress(step || (parseInt($movieProgress.val())));
        }
    };

    var togglePlay = function(step) {
        if(isPlaying) pause();
        else play(step);
    };

    $moviePlayBtn.on('click', function() {
        togglePlay();
    });

    $movieProgress.attr('max', timeline.length - 1).on('change input', function() {
        setProgress($(this).val());
    });

    var beginStep = $movieProgress.val();
    beginStep = saveStep ? $.zui.store.get('lastStep', beginStep) : beginStep;
    setProgress(beginStep);

    if(isAutoPlay) setTimeout(play, 500);
});
