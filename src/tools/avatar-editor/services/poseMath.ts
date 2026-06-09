import { CANVAS_SIZE } from '@/tools/avatar-editor/constants';
import type {
    BodyPartAsset,
    BoneDefinition,
    OverlayPartAsset,
    Point,
    WalkCycleConfig,
} from '@/tools/avatar-editor/types';

export function clampPoint(point: Point): Point {
    return {
        x: Math.max(0, Math.min(CANVAS_SIZE, Math.round(point.x))),
        y: Math.max(0, Math.min(CANVAS_SIZE, Math.round(point.y))),
    };
}

export function getBoneMap(bones: BoneDefinition[]) {
    return Object.fromEntries(bones.map(bone => [bone.name, bone])) as Record<BoneDefinition['name'], BoneDefinition>;
}

export function getOverlayAnchorPoint(overlay: OverlayPartAsset, bones: BoneDefinition[], bodyParts: BodyPartAsset[]) {
    const bone = overlay.selectedTarget.boneName ? bones.find(item => item.name === overlay.selectedTarget.boneName) : undefined;
    if (bone) {
        return bone.point;
    }

    const parentPart = bodyParts.find(item => item.type === overlay.selectedTarget.partType);
    return parentPart?.position ?? { x: CANVAS_SIZE / 2, y: CANVAS_SIZE / 2 };
}

export function computeBodyPose(bodyPart: BodyPartAsset, walkTime: number, walkCycle: WalkCycleConfig) {
    const { speed, armSwing, legSwing, bodyBounce } = walkCycle;
    // phase increases at `speed` rad/sec so that speed controls how fast the cycle runs
    const phase = walkTime * speed;
    // Primary stride oscillation (once per full cycle)
    const swing = Math.sin(phase);

    let rotation = 0;
    // All parts share the same vertical bounce so the entire body moves as a unit.
    // Using the absolute value creates a bob-up on EVERY half-step (twice per stride).
    const bounceY = -Math.abs(Math.sin(phase)) * bodyBounce * 0.5;

    if (bodyPart.type === 'rightArm') {
        rotation = -swing * armSwing;   // opposite phase to legs
    } else if (bodyPart.type === 'leftArm') {
        rotation = swing * armSwing;
    } else if (bodyPart.type === 'rightLeg') {
        rotation = swing * legSwing;
    } else if (bodyPart.type === 'leftLeg') {
        rotation = -swing * legSwing;
    }

    // Pivot-fixed rotation: rotate around the pivot joint so the root stays planted.
    const fromPivotX = bodyPart.position.x - bodyPart.pivot.x;
    const fromPivotY = bodyPart.position.y - bodyPart.pivot.y;
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    const rotX = fromPivotX * cos - fromPivotY * sin;
    const rotY = fromPivotX * sin + fromPivotY * cos;

    return {
        x: bodyPart.pivot.x + rotX,
        y: bodyPart.pivot.y + rotY + bounceY,
        rotation,
        pivotX: bodyPart.pivot.x,
        pivotY: bodyPart.pivot.y + bounceY,
    };
}

export function computeAttachedPointWorldPosition(
    bodyPart: BodyPartAsset,
    point: Point,
    walkTime: number,
    walkCycle: WalkCycleConfig,
) {
    const pose = computeBodyPose(bodyPart, walkTime, walkCycle);
    const fromPivotX = point.x - bodyPart.pivot.x;
    const fromPivotY = point.y - bodyPart.pivot.y;
    const cos = Math.cos(pose.rotation);
    const sin = Math.sin(pose.rotation);
    const bounceY = pose.pivotY - bodyPart.pivot.y;

    return {
        x: bodyPart.pivot.x + fromPivotX * cos - fromPivotY * sin,
        y: bodyPart.pivot.y + fromPivotX * sin + fromPivotY * cos + bounceY,
        rotation: pose.rotation,
    };
}

export function computeOverlayWorldPosition(
    overlay: OverlayPartAsset,
    bodyParts: BodyPartAsset[],
    bones: BoneDefinition[],
    walkTime: number,
    walkCycle: WalkCycleConfig,
) {
    const targetBone = overlay.selectedTarget.boneName ? bones.find(item => item.name === overlay.selectedTarget.boneName) : undefined;
    const targetPartType = targetBone?.partType ?? overlay.selectedTarget.partType;
    const hostPart = bodyParts.find(part => part.type === targetPartType);

    let originX = CANVAS_SIZE / 2;
    let originY = CANVAS_SIZE / 2;
    let hostRotation = 0;

    if (targetBone && hostPart) {
        const world = computeAttachedPointWorldPosition(hostPart, targetBone.point, walkTime, walkCycle);
        originX = world.x;
        originY = world.y;
        hostRotation = world.rotation;
    } else if (hostPart) {
        const world = computeAttachedPointWorldPosition(hostPart, hostPart.position, walkTime, walkCycle);
        originX = world.x;
        originY = world.y;
        hostRotation = world.rotation;
    } else {
        const anchorPoint = getOverlayAnchorPoint(overlay, bones, bodyParts);
        originX = anchorPoint.x;
        originY = anchorPoint.y;
    }

    const isFaceOrHair = overlay.type !== 'clothes' && overlay.type !== 'pants' && overlay.type !== 'shoes';
    return {
        x: originX + overlay.relativePosition.x,
        y: originY + overlay.relativePosition.y,
        rotation: hostRotation * (isFaceOrHair ? 0.25 : 0.65),
    };
}
