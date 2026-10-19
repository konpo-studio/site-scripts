const defaults = {
    ticks: 0,
    gravity: 0.5,
    decay: 0.94,
    startVelocity: 30,
    count: 30,
    shapes: ["emoji", "circle", "diamonds"],
    colors: ["#bb0000", "#9680ff", "#FFE400", "#FFBD00", "#E89400"],
    zIndex: 1000
}
const gSize = 1.2 / 10 * parseFloat($('html').css('font-size'))
console.log(gSize)

const playConfetti = (canvas, confetti) => {
    const shoot = () => {
        //bottom-left
        confetti(canvas, {
            ...defaults,
            angle: 60,
            scalar: gSize * 1.2,
            spread: 100,
            origin: { x: 0, y: 1 },
            drift: -1
        });
        confetti(canvas, {
            ...defaults,
            angle: 60,
            scalar: gSize * .75,
            spread: 150,
            startVelocity: 55,
            origin: { x: 0, y: 1 },
            drift: -1,
        });
        confetti(canvas, {
            ...defaults,
            angle: 60,
            scalar: gSize * 4,
            spread: 150,
            origin: { x: 0, y: 1 },
            drift: -1,
            shapes: ["emoji"],
            shapeOptions: {
                emoji: {
                    value: ["🧧", "🏮"],
                },
            },
        });
        //bottom-right
        confetti(canvas, {
            ...defaults,
            angle: 120,
            scalar: gSize * 1.2,
            spread: 100,
            origin: { x: 1, y: 1 },
            drift: 1,
        });
        confetti(canvas, {
            ...defaults,
            angle: 120,
            scalar: gSize * .75,
            spread: 150,
            startVelocity: 55,
            origin: { x: 1, y: 1 },
            drift: 1,
        });
        confetti(canvas, {
            ...defaults,
            angle: 120,
            scalar: gSize * 4,
            spread: 150,
            origin: { x: 1, y: 1 },
            drift: 1,
            shapes: ["emoji"],
            shapeOptions: {
                emoji: {
                    value: ["🧧", "🏮"],
                },
            },
        });
        //top-left
        confetti(canvas, {
            ...defaults,
            angle: -60,
            scalar: gSize * 1.2,
            spread: 100,
            origin: { x: 0, y: 0 },
            drift: -1
        });
        confetti(canvas, {
            ...defaults,
            angle: -60,
            scalar: gSize * .75,
            spread: 150,
            startVelocity: 55,
            origin: { x: 0, y: 0 },
            drift: -1,
        });
        confetti(canvas, {
            ...defaults,
            angle: -60,
            scalar: gSize * 4,
            spread: 150,
            origin: { x: 0, y: 0 },
            drift: -1,
            shapes: ["emoji"],
            shapeOptions: {
                emoji: {
                    value: ["🧧", "🏮"],
                },
            },
        });
        //top-right
        confetti(canvas, {
            ...defaults,
            angle: -120,
            scalar: gSize * 1.2,
            spread: 100,
            origin: { x: 1, y: 0 },
            drift: 1,
        });
        confetti(canvas, {
            ...defaults,
            angle: -120,
            scalar: gSize * .75,
            spread: 150,
            startVelocity: 55,
            origin: { x: 1, y: 0 },
            drift: 1,
        });
        confetti(canvas, {
            ...defaults,
            angle: -120,
            scalar: gSize * 4,
            spread: 150,
            origin: { x: 1, y: 0 },
            drift: 1,
            shapes: ["emoji"],
            shapeOptions: {
                emoji: {
                    value: ["🧧", "🏮"],
                },
            },
        });
    }
    setTimeout(shoot, 0);
    setTimeout(shoot, 100);
    setTimeout(shoot, 200);
}
