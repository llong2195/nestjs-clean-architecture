import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'ROLES_KEY';
export const Roles = (...roles: string[]): ReturnType<typeof SetMetadata> =>
  SetMetadata(ROLES_KEY, roles);
