/**
 * FF Typescript Foundation Library
 * Copyright 2022 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { Path2 as Path2Base, ESegmentType, ISegment2 } from "@ff/core/Path2";

////////////////////////////////////////////////////////////////////////////////

export { ESegmentType, ISegment2 };

export class Path2 extends Path2Base
{
    static fromSvgPathD(d: string): Path2
    {
        return new Path2().addSvgPathD(d);
    }
    
    static fromSvgLine(x1: string | number, y1: string | number, x2: string | number, y2: string | number)
    {
        return new Path2().addSvgLine(x1, y1, x2, y2);
    }

    toPath2D(): Path2D
    {
        const segs = this.segments;
        const path = new Path2D();

        for (let i = 0, n = segs.length; i < n; ++i) {
            const seg = segs[i];
            const p = seg.p;

            switch(seg.type) {
                case ESegmentType.Move:
                    path.moveTo(p.x, p.y);
                    break;
                case ESegmentType.Line:
                    path.lineTo(p.x, p.y);
                    break;
                case ESegmentType.Bezier: {
                    const cp0 = seg.cp0;
                    const cp1 = seg.cp1;
                    path.bezierCurveTo(cp0.x, cp0.y, cp1.x, cp1.y, p.x, p.y);
                    break;
                }
                default:
                    console.warn(`[Path2.toPath2D] unhandled segment type: '${ESegmentType[seg.type]}'`);
                    break;
            }
        }

        return path;
    }
}