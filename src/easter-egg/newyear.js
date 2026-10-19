const defaults = {
    ticks: 0,
    gravity: 0,
    decay: 0.94,
    startVelocity: 30,
    count: 30,
    shapes: ["emoji", "circle", "diamonds"],
    colors: ["#bb0000", "#9680ff", "#FFE400", "#FFBD00", "#E89400"],
    zIndex: 1000
}

const play = async (canvas, confetti) => {
    const shoot = async () => {
        //bottom-left
        const _confetti = await confetti;
        _confetti(canvas, {
            ...defaults,
            angle: 60,
            scalar: 1.2,
            spread: 100,
            origin: { x: 0, y: 1 },
            drift: -1
        });
        _confetti(canvas, {
            ...defaults,
            angle: 60,
            scalar: .75,
            spread: 150,
            startVelocity: 55,
            origin: { x: 0, y: 1 },
            drift: -1,
        });
        _confetti(canvas, {
            ...defaults,
            angle: 60,
            scalar: 2,
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
        _confetti(canvas, {
            ...defaults,
            angle: 120,
            scalar: 1.2,
            spread: 100,
            origin: { x: 1, y: 1 },
            drift: 1,
        });
        _confetti(canvas, {
            ...defaults,
            angle: 120,
            scalar: .75,
            spread: 150,
            startVelocity: 55,
            origin: { x: 1, y: 1 },
            drift: 1,
        });
        _confetti(canvas, {
            ...defaults,
            angle: 120,
            scalar: 2,
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
        _confetti(canvas, {
            ...defaults,
            angle: -60,
            scalar: 1.2,
            spread: 100,
            origin: { x: 0, y: 0 },
            drift: -1
        });
        _confetti(canvas, {
            ...defaults,
            angle: -60,
            scalar: .75,
            spread: 150,
            startVelocity: 55,
            origin: { x: 0, y: 0 },
            drift: -1,
        });
        _confetti(canvas, {
            ...defaults,
            angle: -60,
            scalar: 2,
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
        _confetti(canvas, {
            ...defaults,
            angle: -120,
            scalar: 1.2,
            spread: 100,
            origin: { x: 1, y: 0 },
            drift: 1,
        });
        _confetti(canvas, {
            ...defaults,
            angle: -120,
            scalar: .75,
            spread: 150,
            startVelocity: 55,
            origin: { x: 1, y: 0 },
            drift: 1,
        });
        _confetti(canvas, {
            ...defaults,
            angle: -120,
            scalar: 2,
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
    setTimeout(await shoot, 0);
    setTimeout(await shoot, 100);
    setTimeout(await shoot, 200);
};
export { play };
export default null;
