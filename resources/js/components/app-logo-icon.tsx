import { AttendrlyMark } from '@/components/brand/attendrly-logo';
import type { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return <AttendrlyMark className={props.className} />;
}
