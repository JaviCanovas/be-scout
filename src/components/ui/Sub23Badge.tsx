import { Badge } from "./Badge";

export function Sub23Badge({ isU23 }: { isU23: boolean }) {
    if (isU23) {
        return (
            <Badge variant="yes" className="px-2 py-0.5 min-w-[50px] font-bold">
                <span className="mr-1">✓</span> YES
            </Badge>
        );
    }
    return (
        <Badge variant="no" className="px-2 py-0.5 min-w-[50px]">
            <span className="mr-1 font-bold">✕</span> NO
        </Badge>
    );
}
