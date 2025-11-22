// 便利贴部分参考：https://blog.csdn.net/m0_63398413/article/details/134225206

const sticky_color = [
    '#f0c2a2',
    '#fffbc7',
    '#aed0ee',
    '#f9d3e3',
    '#bfd1b1',
    '#dcc7e1'
]
var color_index = Math.floor(Math.random() * sticky_color.length);

const concepts_size = [
    ["社会性别",35],
    ["指派性别",25],
    ["性/别",25],
    ["性别认同",30],
    ["性别表达",25],
    ["性别规范",25],
    ["性别期待",25],
    ["性别焦虑",25],
    ["性别过渡",30],
    ["性身份障碍&易性证",25],
    ["HRT",25],
    ["SRS",25],
    ["疾病&障碍&失能",25],
    ["典型性",25],
    ["多样性",25],
    ["操演性",25],
    ["可哀悼性",25],
    ["权力",30],
    ["强奸罪",25],
    ["性交易",25],
    ["暴力",25],
    ["交叉性",25],
    ["性别框架",25],
    ["恐跨",30],
    ["自我形象",25],
    ["固有偏好",25],
    ["身体情感",25],
    ["Transgender",35],
    ["Queer",25],
    ["Intersex",25],
    ["Woman",25],
    ["ASD",25],
    ["ADHD",25],
    ["ND",25],
    ["ADD",25],
    ["TERF",30]
];
const concepts_ls = concepts.map(item => [item['title'], item['fontsize'], item['id']]);
for (let i = 0; i < concepts_ls.length; i++) {
    for (let j = 0; j < concepts_size.length; j++) {
        if (concepts_ls[i][0] === concepts_size[j][0]) {
            concepts_ls[i][1] = concepts_size[j][1];
            break;
        }
    }
}
function get_concept_content(id) {
    const data = concepts.find(item => item['id'] === id);
    // 创建div元素作为便利贴的容器，并添加类名"stickynote"
    const sticky = document.createElement("div");
    sticky.id = `node${data.id}`;
    sticky.classList.add("stickynote");  
    sticky.style.backgroundColor = sticky_color[color_index];
    sticky.style.position = "absolute";
    sticky.style.left = `10%`;
    sticky.style.top = `30%`;
    if (data.con.length > 100) {
        sticky.style.width = `200px`;
        sticky.style.height = `200px`;
    }
    color_index = (color_index + 1) % sticky_color.length;
    const content = document.createElement("p");
    content.classList.add("stickynote-text");
    content.innerHTML = data.con || "";
    sticky.appendChild(content);
    const aElem = document.createElement("a"); 
    aElem.textContent = "深入了解→";
    aElem.classList.add("stickynote-link");
    sticky.appendChild(aElem);
    if (data.details) {
        aElem.style.display = "block";
        aElem.href = `/archives/node/${data.id}`;
    }
    else {
        aElem.style.display = "none";
    }
    board.appendChild(sticky);

    // 创建可拖动便利贴的对象
    const draggable = Draggable.create(sticky, {
        // 设置拖动方向为水平和垂直
        type: "x,y", 
        // 拖动开始时的回调函数
        onDragStart: function () { 
            // 启用惯性动画，外部js库
            InertiaPlugin.track(this.target, "x"); 
            // 拖动开始时的动画效果
            grabNoteAnimation(this.target); 
        },
        // 拖动中的回调函数
        onDrag: function () { 
            // 获取水平方向上的速度
            let dx = InertiaPlugin.getVelocity(this.target, "x"); 
            // 调用GSAP库
            gsap.to(this.target, { 
                // 根据速度旋转便利贴(所以会有越快越歪)
                rotation: dx * -0.003, 
                duration: 0.5,
                ease: "elastic.out(1.8, 0.6)",
                // 动画完成后的回调函数
                onComplete: function () { 
                    // 旋转回初始状态
                    gsap.to(this.target, { 
                        rotation: 0,
                        duration: 0.5,
                        ease: "elastic.out(1.8, 0.6)"
                    });
                }
            });
        },
        // 拖动结束时的回调函数
        onDragEnd: function () {
            releaseNoteAnimation(this.target); 
        },

        // 避免拖动时误触发内部元素的点击事件
        dragClickables: false, 
    }); 

    sticky.addEventListener("dblclick", function() {
        if (draggable) {
            draggable[0].disable();
        }
        sticky.remove();
    });
}
document.addEventListener('DOMContentLoaded', () => {
    const cloud = document.getElementById('concept_cloud')
    const blackboard = document.querySelector('.blackboard');
    WordCloud(
        cloud,
        {
            list: concepts_ls,
            fontFamily: "チョークS, 楷体",
            color: "random-light",
            rotationSteps: 2,
            click: function(item) {
                const currentNode = document.getElementById(`node${item[2]}`);
                if (currentNode) {
                    // 如果便利贴已经存在，则不创建新的
                    return;
                } else {
                    // 创建新的便利贴
                    get_concept_content(item[2]);
                }
            }
        }
    );
    cloud.style.position = "relative";
    cloud.style.backgroundColor = "transparent"; // 设置背景颜色为透明
    blackboard.style.height = cloud.offsetHeight + 80 + "px";
});

// 拖动便利贴时的抓取动画
function grabNoteAnimation(target) {
    // 创建动画时间线对象
    const timeline = gsap.timeline(); 
    timeline
        .to(target, {
            rotateX: 30, 
            boxShadow: "-1px 14px 40px -4px rgba(0, 0, 0, 0.12), inset 0 14px 20px -12px rgba(0, 0, 0, 0.3)", // 添加阴影效果
            duration: 0.3
        })
        .to(target, {
            // 将便利贴旋转回初始状态
            rotation: 0, 
            rotateX: 5,
            // 缩放便利贴
            scale: 1.1, 
            boxShadow: "-1px 14px 40px -4px rgba(0, 0, 0, 0.12), inset 0 24px 30px -12px rgba(0, 0, 0, 0.3)", // 调整阴影效果
            // 弹性缓动效果
            ease: "elastic.out(0.8, 0.5)" 
        }, 0.15);
    timeline.play();
}

// 释放便利贴时的动画
function releaseNoteAnimation(target) {
    const timeline = gsap.timeline(); 
    timeline
        .to(target, {
            rotateX: 30, 
            boxShadow: "-1px 10px 5px -4px rgba(0, 0, 0, 0.02), inset 0 24px 30px -12px rgba(0, 0, 0, 0.2)", // 调整阴影效果
            duration: 0.3
        })
        .to(target, {
            // 还原缩放
            scale: 1 
        }, 0)
        .to(target, {
            // 将便利贴旋转回初始状态
            rotateX: 5, 
            boxShadow: "-1px 10px 5px -4px rgba(0, 0, 0, 0.02), inset 0 24px 30px -12px rgba(0, 0, 0, 0.2)", // 调整阴影效果
            ease: "elastic.out(0.8, 0.5)"
        }, 0.2);
    timeline.play();
}

document.getElementById("eraser").addEventListener("click", function() {
    const stickynotes = document.querySelectorAll(".stickynote");
    stickynotes.forEach(function(note) {
        note.remove();
        }
    );
});