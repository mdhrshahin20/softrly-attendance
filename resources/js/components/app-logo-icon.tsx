import { SoftrlyMark } from '@/components/brand/softrly-logo';
import type { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return <SoftrlyMark className={props.className} />;
}
