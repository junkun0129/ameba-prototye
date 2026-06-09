import { useEffect, useRef } from 'react';
import type { AvatarModel } from '@/lib/types';

type Props = {
    avatar: AvatarModel;
};

function drawSingleEye(
    ctx: CanvasRenderingContext2D,
    ex: number,
    ey: number,
    style: AvatarModel['eyeStyle'],
    isSad: boolean,
) {
    ctx.save();
    ctx.translate(ex, ey);

    let eyeW = 14;
    let eyeH = 15;
    if (style === 'cool') {
        eyeW = 13;
        eyeH = 8;
    }
    if (style === 'sparkle') {
        eyeW = 15.5;
        eyeH = 16;
    }

    ctx.fillStyle = '#2a1f1a';
    ctx.beginPath();
    ctx.ellipse(0, 0, eyeW / 2, eyeH / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    if (style !== 'cool') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.ellipse(0, eyeH / 5, eyeW / 2.5, eyeH / 3.5, 0, 0, Math.PI, false);
        ctx.fill();
    }

    if (isSad) {
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(-2, 3, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(3, -2, 2.5, 0, Math.PI * 2);
        ctx.fill();
    } else {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-2.5, -2.5, 2.8, 0, Math.PI * 2);
        ctx.fill();
        if (style !== 'cool') {
            ctx.beginPath();
            ctx.arc(2.5, 2.5, 1.2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    ctx.restore();
}

function drawLegsAndShoes(ctx: CanvasRenderingContext2D, avatar: AvatarModel, rotL: number, rotR: number) {
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#3b2d24';
    ctx.lineJoin = 'round';

    const drawOneLeg = () => {
        ctx.fillStyle = avatar.skinColor;
        ctx.beginPath();
        ctx.rect(-3.5, 0, 7, 16);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = avatar.pantsColor;
        ctx.beginPath();
        if (avatar.pantsStyle === 'pants' || avatar.shirtStyle === 'bear') {
            ctx.roundRect(-5.5, -2, 11, 16, 2);
        } else if (avatar.pantsStyle === 'skirt') {
            ctx.moveTo(-5, -2);
            ctx.lineTo(5, -2);
            ctx.lineTo(9, 10);
            ctx.lineTo(-9, 10);
            ctx.closePath();
        } else {
            ctx.roundRect(-5, -2, 10, 11, 2);
        }
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.rect(-3.5, 12, 7, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = avatar.shoeColor;
        ctx.beginPath();
        ctx.moveTo(3, 14);
        ctx.lineTo(5, 21);
        ctx.quadraticCurveTo(5, 24, 3, 24);
        ctx.lineTo(-11, 24);
        ctx.quadraticCurveTo(-16, 24, -14, 19);
        ctx.quadraticCurveTo(-11, 15, -4, 14);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.moveTo(4, 21);
        ctx.lineTo(-12, 21);
        ctx.quadraticCurveTo(-16, 21, -14.5, 24);
        ctx.lineTo(3, 24);
        ctx.quadraticCurveTo(5, 24, 5, 21);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    };

    ctx.save();
    ctx.translate(-7, -22);
    ctx.rotate(rotR);
    drawOneLeg();
    ctx.restore();

    ctx.save();
    ctx.translate(6, -17);
    ctx.rotate(rotL);
    drawOneLeg();
    ctx.restore();
}

function drawBody(ctx: CanvasRenderingContext2D, avatar: AvatarModel) {
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#3b2d24';
    ctx.fillStyle = avatar.shirtColor;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(-9, -44);
    ctx.lineTo(13, -44);
    ctx.lineTo(16, -18);
    ctx.lineTo(-12, -18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.ellipse(-1, -44, 7, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (avatar.shirtStyle === 'bear') {
        ctx.fillStyle = avatar.shirtColor;
        ctx.beginPath();
        ctx.arc(-24, -88, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(24, -88, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
}

function drawArms(
    ctx: CanvasRenderingContext2D,
    avatar: AvatarModel,
    rotL: number,
    rotR: number,
    isFrontOnly: boolean,
) {
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#3b2d24';

    const drawArm = () => {
        ctx.fillStyle = avatar.skinColor;
        ctx.beginPath();
        ctx.rect(-3.5, 6, 7, 12);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 19, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        if (avatar.shirtStyle === 'longsleeve' || avatar.shirtStyle === 'hoodie' || avatar.shirtStyle === 'bear') {
            ctx.fillStyle = avatar.shirtColor;
            ctx.beginPath();
            ctx.roundRect(-4.5, -2, 9, 19, 2);
            ctx.fill();
            ctx.stroke();
        } else if (avatar.shirtStyle === 'tshirt') {
            ctx.fillStyle = avatar.shirtColor;
            ctx.beginPath();
            ctx.roundRect(-4.5, -2, 9, 10, 2);
            ctx.fill();
            ctx.stroke();
        }
    };

    if (!isFrontOnly) {
        ctx.save();
        ctx.translate(-10, -42);
        ctx.rotate(rotL + 0.3);
        drawArm();
        ctx.restore();
    } else {
        ctx.save();
        ctx.translate(14, -40);
        ctx.rotate(rotR - 0.1);
        drawArm();
        ctx.restore();
    }
}

function drawNeck(ctx: CanvasRenderingContext2D, avatar: AvatarModel) {
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#3b2d24';
    ctx.fillStyle = avatar.skinColor;
    ctx.beginPath();
    ctx.rect(-6, -48, 12, 10);
    ctx.fill();
    ctx.stroke();
}

function drawHeadBase(ctx: CanvasRenderingContext2D, avatar: AvatarModel) {
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#3b2d24';
    ctx.fillStyle = avatar.skinColor;

    ctx.beginPath();
    const x = -37;
    const y = -102;
    const w = 74;
    const h = 60;
    const r = 30;
    ctx.moveTo(x + w / 2, y);
    ctx.bezierCurveTo(x + w - 4, y, x + w - 2, y + h / 3, x + w, y + h / 2 + 2);
    ctx.bezierCurveTo(x + w + 1, y + h - 11, x + w - r / 2, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.bezierCurveTo(x + r / 2, y + h, x - 1, y + h - 11, x, y + h / 2 + 2);
    ctx.bezierCurveTo(x + 2, y + h / 3, x + 4, y, x + w / 2, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(-36, -68, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(36, -68, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
}

function drawFaceFeatures(ctx: CanvasRenderingContext2D, avatar: AvatarModel) {
    const faceCenterY = -68;
    const faceShiftX = -5;
    const eyeOffsetX = 17;

    ctx.save();
    ctx.translate(faceShiftX, 0);
    ctx.strokeStyle = avatar.hairColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    let browAngle = 0;
    let browYShift = 0;
    if (avatar.expression === 'angry') {
        browAngle = 0.22;
        browYShift = 2;
    } else if (avatar.expression === 'sad') {
        browAngle = -0.2;
        browYShift = -1;
    }

    ctx.save();
    ctx.translate(-eyeOffsetX, faceCenterY - 14 + browYShift);
    ctx.rotate(browAngle);
    ctx.beginPath();
    ctx.moveTo(-4.5, 0);
    ctx.lineTo(4.5, -1.5);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(eyeOffsetX, faceCenterY - 14 + browYShift);
    ctx.rotate(-browAngle);
    ctx.beginPath();
    ctx.moveTo(-4.5, -1.5);
    ctx.lineTo(4.5, 0);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#ff7b7b';
    ctx.beginPath();
    ctx.ellipse(-24, faceCenterY + 4, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(24, faceCenterY + 4, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#fca5a5';
    ctx.beginPath();
    ctx.ellipse(0, faceCenterY, 3.5, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    const isClosed = avatar.blinkFrames > 0 || avatar.expression === 'smile';
    ctx.fillStyle = '#3b2d24';
    ctx.strokeStyle = '#3b2d24';

    if (isClosed) {
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(-eyeOffsetX, faceCenterY - 4, 6.5, Math.PI, 0, false);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(eyeOffsetX, faceCenterY - 4, 6.5, Math.PI, 0, false);
        ctx.stroke();
    } else if (avatar.expression === 'wink') {
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(-eyeOffsetX, faceCenterY - 4, 6.5, Math.PI, 0, false);
        ctx.stroke();
        drawSingleEye(ctx, eyeOffsetX, faceCenterY - 4, avatar.eyeStyle, false);
    } else if (avatar.expression === 'sad') {
        drawSingleEye(ctx, -eyeOffsetX, faceCenterY - 4, avatar.eyeStyle, true);
        drawSingleEye(ctx, eyeOffsetX, faceCenterY - 4, avatar.eyeStyle, true);
    } else {
        drawSingleEye(ctx, -eyeOffsetX, faceCenterY - 4, avatar.eyeStyle, false);
        drawSingleEye(ctx, eyeOffsetX, faceCenterY - 4, avatar.eyeStyle, false);
    }

    ctx.strokeStyle = '#3b2d24';
    ctx.lineWidth = 3;
    let currentMouth = avatar.mouthStyle;
    if (avatar.expression === 'smile') currentMouth = 'smile';
    if (avatar.expression === 'angry') currentMouth = 'dot';
    if (avatar.expression === 'sad') currentMouth = 'ho';

    switch (currentMouth) {
        case 'smile':
            ctx.beginPath();
            ctx.arc(0, faceCenterY + 12, 5, 0, Math.PI, false);
            ctx.stroke();
            break;
        case 'dot':
            ctx.fillStyle = '#fca5a5';
            ctx.beginPath();
            ctx.arc(0, faceCenterY + 13, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            break;
        case 'ho':
            ctx.fillStyle = '#f43f5e';
            ctx.beginPath();
            ctx.ellipse(0, faceCenterY + 12, 4, 5.5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            break;
        case 'cat':
            ctx.beginPath();
            ctx.arc(-3.5, faceCenterY + 13, 3.5, 0, Math.PI, false);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(3.5, faceCenterY + 13, 3.5, 0, Math.PI, false);
            ctx.stroke();
            break;
    }

    ctx.restore();
}

function drawHairBack(ctx: CanvasRenderingContext2D, avatar: AvatarModel) {
    if (avatar.hairStyle === 'none') return;
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#3b2d24';
    ctx.fillStyle = avatar.hairColor;

    switch (avatar.hairStyle) {
        case 'bob':
            ctx.beginPath();
            ctx.arc(0, -73, 40, Math.PI, 0, false);
            ctx.lineTo(40, -50);
            ctx.lineTo(-40, -50);
            ctx.closePath();
            break;
        case 'long':
            ctx.beginPath();
            ctx.roundRect(-41, -100, 82, 85, [36, 36, 12, 12]);
            break;
        case 'twin':
        case 'pony':
        case 'spiky':
            ctx.beginPath();
            ctx.arc(0, -73, 39, Math.PI, 0, false);
            ctx.closePath();
            break;
    }
    ctx.fill();
    ctx.stroke();
}

function drawHairFront(ctx: CanvasRenderingContext2D, avatar: AvatarModel) {
    if (avatar.hairStyle === 'none') return;
    ctx.save();
    ctx.translate(-2, 0);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#3b2d24';
    ctx.fillStyle = avatar.hairColor;

    switch (avatar.hairStyle) {
        case 'spiky':
            ctx.beginPath();
            ctx.moveTo(-36, -80);
            ctx.lineTo(-22, -92);
            ctx.lineTo(-14, -74);
            ctx.lineTo(0, -96);
            ctx.lineTo(10, -74);
            ctx.lineTo(24, -92);
            ctx.lineTo(36, -80);
            ctx.quadraticCurveTo(0, -112, -36, -80);
            ctx.closePath();
            break;
        default:
            ctx.beginPath();
            ctx.arc(0, -73, 40, Math.PI * 1.05, Math.PI * 1.95, false);
            ctx.lineTo(34, -75);
            ctx.lineTo(24, -82);
            ctx.lineTo(12, -75);
            ctx.lineTo(0, -84);
            ctx.lineTo(-12, -75);
            ctx.lineTo(-24, -82);
            ctx.lineTo(-34, -75);
            ctx.closePath();
            break;
    }

    ctx.fill();
    ctx.stroke();
    ctx.restore();
}

function drawAccessories(ctx: CanvasRenderingContext2D, avatar: AvatarModel) {
    const faceCenterY = -68;
    const faceShiftX = -5;

    if (avatar.glasses) {
        ctx.save();
        ctx.translate(faceShiftX, 0);
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = '#e11d48';
        ctx.fillStyle = 'rgba(255,255,255,0.22)';
        ctx.beginPath();
        ctx.roundRect(-25, faceCenterY - 10, 20, 16, 5);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.roundRect(5, faceCenterY - 10, 20, 16, 5);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-5, faceCenterY - 2);
        ctx.lineTo(5, faceCenterY - 2);
        ctx.stroke();
        ctx.restore();
    }

    if (avatar.nekomimi) {
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#3b2d24';
        ctx.fillStyle = '#3b2d24';
        ctx.beginPath();
        ctx.moveTo(-34, -94);
        ctx.lineTo(-20, -114);
        ctx.lineTo(-10, -98);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(10, -98);
        ctx.lineTo(20, -114);
        ctx.lineTo(34, -94);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
}

function renderAvatarCanvas(ctx: CanvasRenderingContext2D, avatar: AvatarModel) {
    ctx.clearRect(0, 0, 140, 180);

    let bobY = 0;
    let bodyScaleY = 1;
    let bodyScaleX = 1;
    let armRotationL = 0;
    let armRotationR = 0;
    let legRotationL = 0;
    let legRotationR = 0;
    let bodyAngle = 0;

    if (avatar.state === 'walking') {
        bobY = Math.abs(Math.sin(avatar.walkCycle)) * -4;
        legRotationL = Math.sin(avatar.walkCycle) * 0.45;
        legRotationR = -Math.sin(avatar.walkCycle) * 0.45;
        armRotationL = -Math.sin(avatar.walkCycle) * 0.25;
        armRotationR = Math.sin(avatar.walkCycle) * 0.25;
    } else if (avatar.state === 'wave') {
        armRotationR = -Math.PI * 0.7 + Math.sin(Date.now() * 0.02) * 0.3;
    } else if (avatar.state === 'dance') {
        bodyAngle = Math.sin(Date.now() * 0.01) * 0.12;
        bobY = Math.sin(Date.now() * 0.015) * -3;
    } else if (avatar.state === 'jump') {
        const jumpProgress = (30 - avatar.actionTimer) / 30;
        const height = Math.sin(jumpProgress * Math.PI) * 25;
        bobY = -height;
        if (height > 5) {
            bodyScaleY = 1.08;
            bodyScaleX = 0.95;
        } else {
            bodyScaleY = 0.95;
            bodyScaleX = 1.05;
        }
    } else if (avatar.state === 'sleeping') {
        bodyAngle = Math.PI * 0.45;
        bobY = 30;
    } else if (avatar.state === 'sitting') {
        legRotationL = -Math.PI * 0.45;
        legRotationR = -Math.PI * 0.45;
        bobY = 4;
    }

    ctx.save();
    ctx.translate(70, 150);
    const isFlipped = avatar.dir === 'FR' || avatar.dir === 'BR';
    if (isFlipped) {
        ctx.scale(-1, 1);
    }
    ctx.translate(0, bobY);
    ctx.rotate(bodyAngle);
    ctx.scale(bodyScaleX, bodyScaleY);

    const isBackView = avatar.dir === 'BL' || avatar.dir === 'BR';
    if (!isBackView) {
        drawLegsAndShoes(ctx, avatar, legRotationL, legRotationR);
        drawArms(ctx, avatar, armRotationL, armRotationR, false);
        drawHairBack(ctx, avatar);
        drawBody(ctx, avatar);
        drawNeck(ctx, avatar);
        drawHeadBase(ctx, avatar);
        drawFaceFeatures(ctx, avatar);
        drawHairFront(ctx, avatar);
        drawAccessories(ctx, avatar);
        drawArms(ctx, avatar, armRotationL, armRotationR, true);
    } else {
        drawLegsAndShoes(ctx, avatar, legRotationL, legRotationR);
        drawBody(ctx, avatar);
        drawNeck(ctx, avatar);
        drawHeadBase(ctx, avatar);
        drawHairBack(ctx, avatar);
        drawArms(ctx, avatar, armRotationL, armRotationR, true);
    }
    ctx.restore();
}

export default function AvatarCanvas({ avatar }: Props) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        renderAvatarCanvas(ctx, avatar);
    }, [avatar]);

    return <canvas ref={canvasRef} width={140} height={180} className="absolute left-0 top-0 z-10 h-[180px] w-[140px]" />;
}
