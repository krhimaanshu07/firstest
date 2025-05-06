import React from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
export default function BackButton(_a) {
    var to = _a.to, _b = _a.label, label = _b === void 0 ? 'Back' : _b, _c = _a.variant, variant = _c === void 0 ? 'outline' : _c, _d = _a.className, className = _d === void 0 ? '' : _d;
    var _e = useLocation(), navigate = _e[1];
    var handleClick = function () {
        if (to) {
            navigate(to);
        }
        else {
            // If no specific route is provided, go back in history
            window.history.back();
        }
    };
    return (<Button variant={variant} onClick={handleClick} className={"flex items-center gap-2 ".concat(className)}>
      <ArrowLeft className="h-4 w-4"/>
      {label}
    </Button>);
}
