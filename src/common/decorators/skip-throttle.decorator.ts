import { SetMetadata } from '@nestjs/common';

export const SKIP_THROTTLE_KEY = 'SKIP_THROTTLE_KEY';
export const SkipThrottle = () => SetMetadata(SKIP_THROTTLE_KEY, true);
