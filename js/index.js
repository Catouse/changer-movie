$(function() {
    // http://stackoverflow.com/a/979995/689559
    var QueryString = function () {
        // This function is anonymous, is executed immediately and 
        // the return value is assigned to QueryString!
        var query_string = {};
        var query = window.location.search.substring(1);
        var vars = query.split("&");
        for (var i=0;i<vars.length;i++) {
            var pair = vars[i].split("=");
                // If first entry with this name
            if (typeof query_string[pair[0]] === "undefined") {
              query_string[pair[0]] = decodeURIComponent(pair[1]);
                // If second entry with this name
            } else if (typeof query_string[pair[0]] === "string") {
              var arr = [ query_string[pair[0]],decodeURIComponent(pair[1]) ];
              query_string[pair[0]] = arr;
                // If third or later entry with this name
            } else {
              query_string[pair[0]].push(decodeURIComponent(pair[1]));
            }
        } 
        return query_string;
    }();

    var getOption = function(key, defaultValue) {
        var val = QueryString[key];
        if(val !== undefined) return val;
        return $.zui.store.get(key, defaultValue);
    };
    var getNumber = function(val) {
        if(typeof val === 'string') {
            return parseFloat(val);
        }
        return val;
    };
    var getBool = function(val) {
        if(typeof val === 'string') {
            return val !== '' && val !== '0' && val !== 'false';
        }
        return !!val;
    }

    var $player = $('.movie-player');
    var $movieProgress = $('#movieProgress');
    var $movieProgressText = $('#movieProgressText');
    var $moviePlayBtn = $('#moviePlayBtn');
    var $movie = $('#movie');
    var $body = $('body');
    var tickCall = null;
    var stepInCall = null;
    var palyCall = null;
    var maxTick = 20;
    var stepTick = 0;
    var stepTickText;
    var isPlaying = false;
    var isLoopPlay = getBool(getOption('loop', false));
    var isAutoPlay = getBool(getOption('autoplay', true));
    var stepReadyTime = 10;
    var timeline = [1000, 4000, 6000, 15000, 15000, 7000, 6000];
    var saveStep = false;
    var speed = getNumber(getOption('speed', 1));
    var zoom = getNumber(getOption('zoom', 1));
    var debugMode = getBool(getOption('debug', false));
    var showSettingMenu = getBool(getOption('setting'), false);
    var getStepTime = function(step) {
        if(step === undefined) step = timeline.length;
        var time = 0;
        for(var i = 0; i < step; ++i) {
            time += timeline[i] + stepReadyTime;
        }
        return time;
    }
    var totalTime = getStepTime();
    var getTimeText = function(time) {
        return new Date(time).format('mm:ss');
    };

    var pause = function() {
        isPlaying = false;
        clearInterval(palyCall);
        $player.removeClass('playing');
    };

    var updateStepTime = function(step, tick) {
        tick = tick === undefined ? stepTick : tick;
        var stepTime = getStepTime(step) + stepReadyTime + tick * 1000;
        $movieProgressText.html((step + 1)+'/'+timeline.length + ' &nbsp; ' + getTimeText(stepTime) + '/' + getTimeText(totalTime));
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
                updateStepTime(step, stepTick);
                stepTickText += (stepTick++)%10;
                $player.attr('tick', stepTickText);
                if(stepTick >= timeline[step]/1000) clearInterval(tickCall);
            }, 1000/speed);
        }, stepReadyTime/speed);
        $movieProgress.val(step);
        updateStepTime(step);
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
    beginStep = saveStep ? getNumber(getOption('begin', beginStep)) : beginStep;
    setProgress(beginStep);

    if(isAutoPlay) setTimeout(play, 500);

    $body.toggleClass('show-setting', showSettingMenu);
    $('#settingBtn').on('click', function() {
        showSettingMenu = !showSettingMenu;
        $body.toggleClass('show-setting', showSettingMenu);
        $.zui.store.set('setting', showSettingMenu);
    });

    $body.toggleClass('debug', debugMode);
    var $debugCheck = $('#debug').prop('checked', debugMode);
    $debugCheck.on('change', function() {
        debugMode = $debugCheck.is(':checked');
        $body.toggleClass('debug', debugMode);
        $.zui.store.set('debug', debugMode);
    });

    $body.css('zoom', zoom).toggleClass('zoom-large', zoom > 1);
    var $zoom = $('#zoom').val(zoom);
    $zoom.on('change', function() {
        zoom = getNumber($(this).val());
        $body.css('zoom', zoom).toggleClass('zoom-large', zoom > 1);
        $.zui.store.set('zoom', zoom);
    });

    var $loopCheck = $('#loop').prop('checked', isLoopPlay);
    $loopCheck.on('change', function() {
        isLoopPlay = $loopCheck.is(':checked');
        $.zui.store.set('loop', isLoopPlay);
    });

    var $autoplayCheck = $('#autoplay').prop('checked', isAutoPlay);
    $autoplayCheck.on('change', function() {
        isAutoPlay = $autoplayCheck.is(':checked');
        $.zui.store.set('autoplay', isAutoPlay);
    });

    var $speed = $('#speed').val(speed);
    $speed.on('change', function() {
        speed = getNumber($(this).val());
        $.zui.store.set('speed', speed);
    });
});
