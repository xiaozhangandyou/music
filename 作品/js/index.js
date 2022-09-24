/* 解决click300ms延迟问题 */
FastClick.attach(document.body);
/* 获取元素 */
const musicBtn = document.querySelector(".music_btn"),
    wrapper = document.querySelector(".main_box .wrapper"),
    progress = document.querySelector(".progress"),
    curTime = progress.querySelector(".cur_time"),
    totalTime = progress.querySelector(".total_time"),
    progCur = progress.querySelector(".prog_cur"),
    myAudio = document.querySelector(".myAudio");
let lyricList = [],//记录歌词的集合
    prevLyric = null,//上一个选中的歌词
    num = 0,//记录歌词切换的次数
    // T = 0,//记录歌词的位置
    PH = 0;//一行歌词的高度
/*获取数据 && 绑定数据*/
const queryData = function queryData() {
    return new Promise(resolve => {
        let xhr = new XMLHttpRequest;
        xhr.open("get", "./json/lyric.json");
        xhr.onreadystatechange = () => {
            let { readyState, status, responseText } = xhr;
            if (readyState === 4 && status === 200) {
                let data = JSON.parse(responseText);
                resolve(data.lyric);
            }
        }
        xhr.send();
    })
}

const binding = function binding(lyric) {
    // 歌词解析
    let data = [];
    lyric = lyric.replace(/&#(32|40|41|45);/g, (val, $1) => {
        let table = {
            32: ' ',
            40: '(',
            41: ')',
            45: '-'
        };
        return table[$1] || val;
    });
    lyric.replace(/\[(\d+):(\d+).(?:\d+)\]([^\↵]+)(?:\↵;)?/g, (_, minutes, seconds, text) => {
        data.push({
            minutes,
            seconds,
            text
        });
    });

    // 歌词绑定
    let str = ``;
    data.forEach(item => {
        let { minutes, seconds, text } = item;
        str += `<p minutes="${minutes}" seconds="${seconds}">
            ${text}
        </p>`;
    });
    wrapper.innerHTML = str;
    lyricList = Array.from(wrapper.querySelectorAll('p'));
    PH = lyricList[0].offsetHeight;
};

/*歌词滚动 & 进度条处理 */
const audioPause = function () {//播放暂停 封装函数
    myAudio.pause();
    musicBtn.classList.remove('move');
    clearInterval(autoTimer);
    autoTimer = null;
}
const format = function (time) {
    time = +time;
    let obj = {
        minutes: '00',
        seconds: '00'
    };
    if (time) {
        let m = Math.floor(time / 60),
            s = Math.round(time - m * 60);
        obj.minutes = m < 10 ? '0' + m : '' + m;
        obj.seconds = s < 10 ? '0' + s : '' + s;
    }
    return obj;
}
const handleLyric = function () {
    let { duration, currentTime } = myAudio;
    a = format(currentTime);
    //控制歌词选中
    for (let i = 0; i < lyricList.length; i++) {
        let item = lyricList[i];
        let minutes = item.getAttribute("minutes"),
            seconds = item.getAttribute("seconds");
        if (minutes === a.minutes && seconds === a.seconds) {
            //发现一个新匹配的：移除上一个的匹配，让当前这个匹配即可
            if (prevLyric) prevLyric.className = '';
            item.className = "active";
            prevLyric = item;
            num++
            break;
        }
    };
    //控制歌词移动
    if (num > 4) {
        // T -= (num-4)*PH;
        wrapper.style.top = `${-(num - 3) * PH}px`;
    }
    //控制音乐播放结束
    if (currentTime >= duration) {
        wrapper.style.top = '0px';
        if (prevLyric) prevLyric.className = '';
        num = 0;
        prevLyric = null;
        audioPause();
    }
};
const handleProgress = function () {
    let { duration, currentTime } = myAudio;
    a = format(duration);
    b = format(currentTime);
    if (currentTime >= duration) {
        //播放结束
        curTime.innerHTML = `00:00`;
        progCur.style.width = `0%`;
        audioPause();
        return;
    }
    curTime.innerHTML = `${b.minutes}:${b.seconds}`;
    totalTime.innerHTML = `${a.minutes}:${a.seconds}`;
    progCur.style.width = `${currentTime / duration * 100}%`;
};
$sub.on('playing', handleLyric);
$sub.on('playing', handleProgress);

/*控制播放和暂停*/
let autoTimer = null;
const handle = function () {
    musicBtn.style.opacity = 1;
    musicBtn.addEventListener("click", function () {
        if (myAudio.paused) {
            //当前是暂停的:让其播放,并且开启定时器
            myAudio.play();
            musicBtn.classList.add('move');
            if (autoTimer === null) {
                $sub.emit('playing');
                autoTimer = setInterval(() => {
                    $sub.emit('playing');
                }, 1000);
            }
            return;
        }
        //当前是播放的：让其暂停
        audioPause();
    });
};

// document.addEventListener("visibilitychange", function () {
//     if (document.hidden) {
//         //离开页卡
//         clearInterval(autoTimer);
//         autoTimer = null;
//         return;
//     }
//     //进入页卡
//     if (autoTimer === null) {
//         $sub.emit('playing');//不用等待1s
//         autoTimer = setInterval(() => {
//             $sub.emit('playing');
//         }, 1000);
//     }
// })

queryData()
    .then(value => {
        binding(value);
        handle();
    })