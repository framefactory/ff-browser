/**
 * WebGPU Lab
 * Copyright 2025 Ralph Wiedemeier, Frame Factory GmbH
 * 
 * License: MIT
 */

import { math } from "@ffweb/core/math.js";
import {
    IManipListener, 
    type IPointerEvent, 
    type ITriggerEvent
} from "./ManipTarget.js";

export { IPointerEvent, ITriggerEvent }

enum EManipMode { Off, Pan, Orbit, Dolly, Zoom, PanDolly, Roll }
enum EManipPhase { Off, Active, Release }


export class OrbitManipulator implements IManipListener
{
    orbit = [ 0, 0, 0 ];
    offset = [0, 0, 50 ];

    minOrbit = [ -90, -Infinity, -Infinity ];
    maxOrbit = [ 90, Infinity, Infinity ];
    minOffset = [ -Infinity, -Infinity, 0.1 ];
    maxOffset = [ Infinity, Infinity, 1000 ];

    orientationEnabled = true;
    offsetEnabled = true;
    cameraMode = true;
    orthographicMode = false;

    protected mode = EManipMode.Off;
    protected phase = EManipPhase.Off;
    protected prevPinchDist = 0;

    protected deltaX = 0;
    protected deltaY = 0;
    protected deltaPinch = 0;
    protected deltaWheel = 0;

    viewportWidth = 100;
    viewportHeight = 100;


    onPointer(event: IPointerEvent): boolean
    {
        if (event.isPrimary) {
            if (event.type === "pointer-down") {
                this.phase = EManipPhase.Active;
            }
            else if (event.type === "pointer-up") {
                this.phase = EManipPhase.Release;
                return true;
            }
        }

        if (event.type === "pointer-down") {
            this.mode = this.getModeFromEvent(event);
        }

        this.deltaX += event.movementX;
        this.deltaY += event.movementY;

        // calculate pinch
        if (event.pointerCount === 2) {
            const positions = event.activePointers;
            const dx = positions[1].offsetX - positions[0].offsetX;
            const dy = positions[1].offsetY - positions[0].offsetY;
            const pinchDist = Math.sqrt(dx * dx + dy * dy);

            const prevPinchDist = this.prevPinchDist || pinchDist;
            this.deltaPinch *= prevPinchDist > 0 ? (pinchDist / prevPinchDist) : 1;
            this.prevPinchDist = pinchDist;
        }
        else {
            this.deltaPinch = 1;
            this.prevPinchDist = 0;
        }

        return true;
    }

    onTrigger(event: ITriggerEvent): boolean
    {
        if (event.type === "wheel") {
            this.deltaWheel += math.limit(event.wheel, -1, 1);
            return true;
        }

        return false;
    }

    /**
     * Updates the manipulator.
     * @returns true if the state has changed during the update.
     */
     update(): boolean
     {
         if (this.phase === EManipPhase.Off && this.deltaWheel === 0) {
             return false;
         }
 
         if (this.deltaWheel !== 0) {
             this.updatePose(0, 0, this.deltaWheel * 0.07 + 1, 0, 0, 0);
             this.deltaWheel = 0;
             return true;
         }
 
         if (this.phase === EManipPhase.Active) {
             if (this.deltaX === 0 && this.deltaY === 0 && this.deltaPinch === 1) {
                 return false;
             }
 
             this.updateByMode();
             this.deltaX = 0;
             this.deltaY = 0;
             this.deltaPinch = 1;
             return true;
         }
         else if (this.phase === EManipPhase.Release) {
             this.deltaX *= 0.85;
             this.deltaY *= 0.85;
             this.deltaPinch = 1;
             this.updateByMode();
 
             const delta = Math.abs(this.deltaX) + Math.abs(this.deltaY);
             if (delta < 0.1) {
                 this.mode = EManipMode.Off;
                 this.phase = EManipPhase.Off;
             }
             return true;
         }
 
         return false;
     }
 
     protected updateByMode()
     {
         switch(this.mode) {
             case EManipMode.Orbit:
                 this.updatePose(0, 0, 1, this.deltaY, this.deltaX, 0);
                 break;
 
             case EManipMode.Pan:
                 this.updatePose(this.deltaX, this.deltaY, 1, 0, 0, 0);
                 break;
 
             case EManipMode.Roll:
                 this.updatePose(0, 0, 1, 0, 0, this.deltaX);
                 break;
 
             case EManipMode.Dolly:
                 this.updatePose(0, 0, this.deltaY * 0.0075 + 1, 0, 0, 0);
                 break;
 
             case EManipMode.PanDolly: {
                    const pinchScale = (this.deltaPinch - 1) * 0.5 + 1;
                    this.updatePose(this.deltaX, this.deltaY, 1 / pinchScale, 0, 0, 0);
                 }
                 break;
         }
     }
 
     protected updatePose(dX, dY, dScale, dPitch, dHead, dRoll)
     {
         const {
             orbit, minOrbit, maxOrbit,
             offset, minOffset, maxOffset
         } = this;
 
         const inverse = this.cameraMode ? -1 : 1;
 
         if (this.orientationEnabled) {
             orbit[0] += inverse * dPitch * 300 / this.viewportHeight;
             orbit[1] += inverse * dHead * 300 / this.viewportHeight;
             orbit[2] += inverse * dRoll * 300 / this.viewportHeight;
 
             // check limits
             orbit[0] = math.limit(orbit[0], minOrbit[0], maxOrbit[0]);
             orbit[1] = math.limit(orbit[1], minOrbit[1], maxOrbit[1]);
             orbit[2] = math.limit(orbit[2], minOrbit[2], maxOrbit[2]);
         }
 
         if (this.offsetEnabled) {
             const factor = offset[2] = dScale * offset[2];
 
             offset[0] += dX * factor * inverse * 2 / this.viewportHeight;
             offset[1] -= dY * factor * inverse * 2 / this.viewportHeight;
 
             // check limits
             offset[0] = math.limit(offset[0], minOffset[0], maxOffset[0]);
             offset[1] = math.limit(offset[1], minOffset[1], maxOffset[1]);
             offset[2] = math.limit(offset[2], minOffset[2], maxOffset[2]);
         }
     }

    protected getModeFromEvent(event: IPointerEvent): EManipMode
    {
        if (event.source === "mouse") {
            const button = event.originalEvent.button;

            // left button
            if (button === 0) {
                if (event.ctrlKey) {
                    return EManipMode.Pan;
                }
                if (event.altKey) {
                    return EManipMode.Dolly;
                }

                return EManipMode.Orbit;
            }

            // right button
            if (button === 2) {
                if (event.altKey) {
                    return EManipMode.Roll;
                }
                else {
                    return EManipMode.Pan;
                }
            }

            // middle button
            if (button === 1) {
                return EManipMode.Dolly;
            }
        }
        else if (event.source === "touch") {
            const count = event.pointerCount;

            if (count === 1) {
                return EManipMode.Orbit;
            }

            if (count === 2) {
                return EManipMode.PanDolly;
            }

            return EManipMode.Pan;
        }
    }
}